'use client';
import { useEffect, useRef } from 'react';
import { useStore } from '@/app/store';
import { supabase } from '@/app/shared/api/supabase';
import { mergePins, localToRemote } from '@/app/features/pins/api/sync/merge';
import type { Pin } from '@/app/features/pins/model/pin.types';
import type { RemotePin } from '@/app/features/pins/api/sync/merge';

export function usePinSync(): void {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Track previous pin IDs to detect deletions
  const prevPinIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Step 1: Restore from localStorage
    useStore.persist.rehydrate();

    // Step 2: Pull from Supabase and merge with local state
    async function pullAndMerge(): Promise<void> {
      const { data, error } = await supabase
        .from('pins')
        .select('*');

      if (error || !data) return;

      const localPins = useStore.getState().pins;
      const merged = mergePins(localPins, data as RemotePin[]);
      useStore.setState({ pins: merged });

      // Initialise prevPinIds after first merge
      prevPinIdsRef.current = new Set(merged.map((p) => p.id));
    }

    pullAndMerge();

    // Step 3: Watch for mutations and debounce push to Supabase
    const unsubscribe = useStore.subscribe((state) => {
      const pins = state.pins;
      const prevIds = prevPinIdsRef.current;
      const currentIds = new Set(pins.map((p) => p.id));

      // Detect deleted pins (present before, absent now)
      const deletedIds = [...prevIds].filter((id) => !currentIds.has(id));
      if (deletedIds.length > 0) {
        // Immediate soft-delete — do not defer to debounce
        softDeleteFromSupabase(deletedIds);
      }

      // Update tracked IDs
      prevPinIdsRef.current = currentIds;

      // Debounced upsert for all current pins
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => pushPins(pins), 2000);
    });

    // Step 4: Flush debounce on tab close
    function flushOnUnload(): void {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        pushPins(useStore.getState().pins);
      }
    }
    window.addEventListener('beforeunload', flushOnUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', flushOnUnload);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);
}

async function pushPins(pins: Pin[]): Promise<void> {
  if (!pins.length) return;
  await supabase
    .from('pins')
    .upsert(pins.map(localToRemote), { onConflict: 'id' });
}

async function softDeleteFromSupabase(ids: string[]): Promise<void> {
  const now = new Date().toISOString();
  for (const id of ids) {
    await supabase
      .from('pins')
      .update({ updated_at: now, deleted_at: now })
      .eq('id', id);
  }
}
