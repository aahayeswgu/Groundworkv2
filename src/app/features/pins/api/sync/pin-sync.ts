import { supabase } from "@/app/shared/api/supabase";
import { useStore } from "@/app/store";
import { localToRemote, mergePins, type RemotePin } from "./merge";

const PINS_TABLE = "pins";

/**
 * Two-way sync: push local pins to Supabase, pull remote pins, merge.
 * Requires authenticated user. Returns count of changes applied.
 */
export async function syncPins(): Promise<{ uploaded: number; downloaded: number }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to sync pins.");

  const localPins = useStore.getState().pins;

  // Upload all local pins (upsert by id)
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

  // Download all remote pins for this user
  const { data: remoteRows, error: fetchError } = await supabase
    .from(PINS_TABLE)
    .select("*")
    .eq("user_id", user.id);

  if (fetchError) throw new Error(`Download failed: ${fetchError.message}`);

  const remotePins: RemotePin[] = (remoteRows ?? []) as RemotePin[];

  // Merge remote into local (last-write-wins)
  const merged = mergePins(localPins, remotePins);

  // Count new pins from remote
  const localIds = new Set(localPins.map((p) => p.id));
  const downloaded = merged.filter((p) => !localIds.has(p.id)).length;

  // Apply merged result to store
  useStore.setState({ pins: merged });

  return { uploaded: remotePinsToUpload.length, downloaded };
}
