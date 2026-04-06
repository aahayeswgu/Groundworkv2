export const TUTORIAL_STORAGE_KEY = "gw_tutorial_seen";

export function hasTutorialBeenSeen(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
}

export function markTutorialSeen(): void {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
}

export function resetTutorialSeen(): void {
  localStorage.removeItem(TUTORIAL_STORAGE_KEY);
}
