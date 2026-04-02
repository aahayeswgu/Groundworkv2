const DEFAULT_MARKER_COLOR = "#D4712A";

export function createNumberedMarkerElement(
  label: string,
  color = DEFAULT_MARKER_COLOR,
): HTMLElement {
  // AdvancedMarkerElement content must be an HTMLElement.
  const markerContent = document.createElement("div");
  markerContent.style.cssText = [
    "width:28px;height:28px;border-radius:50%",
    `background:${color};color:#fff`,
    "font-size:13px;font-weight:800",
    "display:flex;align-items:center;justify-content:center",
    "border:2px solid rgba(255,255,255,0.85)",
    "box-shadow:0 2px 6px rgba(0,0,0,0.35)",
    "pointer-events:none",
    "user-select:none",
  ].join(";");
  markerContent.textContent = label;

  return markerContent;
}
