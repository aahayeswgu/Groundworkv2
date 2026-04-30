import { supabase } from "@/app/shared/api/supabase";
import { useStore } from "@/app/store";
import { localToRemote, mergePins, type RemotePin } from "./merge";

const PINS_TABLE = "pins";

export interface SyncPinsResult {
  uploaded: number;
  downloaded: number;
  deleted: number;
}

/**
 * Two-way sync: propagate local deletes as soft-delete tombstones, push local
 * pins to Supabase, pull remote pins, merge.
 *
 * Tombstone propagation runs first so a pin deleted locally cannot be
 * resurrected by the subsequent download step. Without this, removing a pin
 * from the local array (which is all `deletePin` does) leaves the cloud copy
 * intact, and the merge step adopts it back as a "new" remote pin on the next
 * sync.
 *
 * Requires authenticated user. Returns counts of changes applied.
 */
export async function syncPins(): Promise<SyncPinsResult> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to sync pins.");

  const localPins = useStore.getState().pins;
  const deletedIds = useStore.getState().deletedPinIds;

  // 1. Propagate local deletes as soft-delete tombstones on the cloud.
  // Bulk update via .in() so we make one round-trip regardless of count.
  // RLS already restricts to the current user; the explicit user_id filter
  // is defense-in-depth and makes intent obvious.
  let deletedCount = 0;
  if (deletedIds.length > 0) {
    const nowIso = new Date().toISOString();
    const { error: tombstoneError } = await supabase
      .from(PINS_TABLE)
      .update({ deleted_at: nowIso, updated_at: nowIso })
      .in("id", deletedIds)
      .eq("user_id", user.id);

    if (tombstoneError) throw new Error(`Delete sync failed: ${tombstoneError.message}`);

    deletedCount = deletedIds.length;
    // Clear queue only after the cloud confirms. On a thrown error above
    // the queue is preserved so the next sync retries.
    useStore.setState({ deletedPinIds: [] });
  }

  // 2. Upload all local (alive) pins. localToRemote always writes
  // deleted_at: null, which is intentional — these are alive pins, and a
  // pin recreated with the same id after a tombstone should resurrect it.
  const remotePinsToUpload = localPins.map((pin) => ({
    ...localToRemote(pin),
    user_id: user.id,
  }));

  if (remotePinsToUpload.length > 0) {
    const { error: upsertError } = await supabase
      .from(PINS_TABLE)
      .upsert(remotePinsToUpload, { onConflict: "id" });

    if (upsertError) throw new Error(`Upload failed: ${upsertError.message}`);
  }

  // 3. Download all remote pins for this user. We deliberately do NOT filter
  // out soft-deleted rows — the merge step needs to see them so tombstones
  // authored by other devices can be applied to this device's local store.
  const { data: remoteRows, error: fetchError } = await supabase
    .from(PINS_TABLE)
    .select("*")
    .eq("user_id", user.id);

  if (fetchError) throw new Error(`Download failed: ${fetchError.message}`);

  const remotePins: RemotePin[] = (remoteRows ?? []) as RemotePin[];

  // 4. Merge remote into local (last-write-wins; soft-deletes win when newer).
  const merged = mergePins(localPins, remotePins);

  // Count new pins from remote (i.e., pins downloaded that weren't local).
  const localIds = new Set(localPins.map((p) => p.id));
  const downloaded = merged.filter((p) => !localIds.has(p.id)).length;

  useStore.setState({ pins: merged });

  return { uploaded: remotePinsToUpload.length, downloaded, deleted: deletedCount };
}
