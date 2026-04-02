import { fetchAiBrief } from "@/app/lib/ask-ai";
import type { Pin } from "@/app/features/pins/model/pin.types";
import { PIN_INFO_STATUS_COLORS, PIN_INFO_STATUS_LABELS } from "../model/pin-info-window.model";

interface BuildPinInfoWindowContentParams {
  pin: Pin;
  onEditPin: (pinId: string) => void;
  onDeletePin: (pinId: string) => void;
  onAddRouteStop: (pin: Pin, button: HTMLButtonElement) => void;
  onPlanPin: (pin: Pin, button: HTMLButtonElement) => void;
}

export function buildPinInfoWindowContent({
  pin,
  onEditPin,
  onDeletePin,
  onAddRouteStop,
  onPlanPin,
}: BuildPinInfoWindowContentParams): HTMLElement {
  const container = document.createElement("div");
  container.style.cssText = "min-width:280px;font-family:DM Sans,sans-serif";

  if (pin.photoUrl) {
    const photo = document.createElement("div");
    photo.style.cssText = `height:140px;background:url('${pin.photoUrl}') center/cover no-repeat;border-radius:12px 12px 0 0`;
    container.appendChild(photo);
  }

  const body = document.createElement("div");
  body.style.cssText = `padding:${pin.photoUrl ? "12px 16px 14px" : "14px 16px"}`;

  const title = document.createElement("div");
  title.style.cssText = "font-weight:700;font-size:15px;margin-bottom:4px;line-height:1.3;color:#1A1A1A";
  title.textContent = pin.title;
  body.appendChild(title);

  const badge = document.createElement("span");
  badge.style.cssText = `display:inline-block;padding:2px 8px;border-radius:12px;background:${PIN_INFO_STATUS_COLORS[pin.status]};color:white;font-size:11px;font-weight:600;margin-bottom:8px`;
  badge.textContent = PIN_INFO_STATUS_LABELS[pin.status] ?? pin.status;
  body.appendChild(badge);

  if (pin.rating) {
    const ratingElement = document.createElement("div");
    ratingElement.style.cssText = "font-size:12px;margin-bottom:6px";
    const stars = "\u2605".repeat(Math.round(pin.rating)) + "\u2606".repeat(5 - Math.round(pin.rating));

    if (pin.placeId) {
      const ratingLink = document.createElement("a");
      ratingLink.href = `https://www.google.com/maps/place/?q=place_id:${pin.placeId}`;
      ratingLink.target = "_blank";
      ratingLink.rel = "noopener";
      ratingLink.style.cssText = "text-decoration:none;cursor:pointer";
      ratingLink.innerHTML = `<span style="color:#F59E0B;letter-spacing:1px">${stars}</span> <span style="color:#1A1A1A;font-weight:700">${pin.rating}</span>${pin.ratingCount ? ` <span style="color:#888">(${pin.ratingCount} reviews)</span>` : ""}`;
      ratingElement.appendChild(ratingLink);
    } else {
      ratingElement.innerHTML = `<span style="color:#F59E0B;letter-spacing:1px">${stars}</span> <span style="color:#1A1A1A;font-weight:700">${pin.rating}</span>${pin.ratingCount ? ` <span style="color:#888">(${pin.ratingCount})</span>` : ""}`;
    }

    body.appendChild(ratingElement);
  }

  if (pin.address) {
    const address = document.createElement("div");
    address.style.cssText = "font-size:12px;color:#555;margin-bottom:4px;line-height:1.4";
    address.textContent = pin.address;
    body.appendChild(address);
  }

  if (pin.contact) {
    const contact = document.createElement("div");
    contact.style.cssText = "font-size:12px;color:#333;margin-bottom:2px";
    contact.textContent = `\u{1F464} ${pin.contact}`;
    body.appendChild(contact);
  }

  if (pin.phone) {
    const phone = document.createElement("div");
    phone.style.cssText = "font-size:12px;color:#333;margin-bottom:8px";
    phone.textContent = `\u{1F4DE} ${pin.phone}`;
    body.appendChild(phone);
  }

  if (pin.placeId) {
    const gmapsRow = document.createElement("div");
    gmapsRow.style.cssText = "margin-bottom:8px";

    const gmapsLink = document.createElement("a");
    gmapsLink.href = `https://www.google.com/maps/place/?q=place_id:${pin.placeId}`;
    gmapsLink.target = "_blank";
    gmapsLink.rel = "noopener";
    gmapsLink.style.cssText = "display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#4285F4;font-weight:600;text-decoration:none";
    gmapsLink.textContent = "View on Google Maps";

    gmapsRow.appendChild(gmapsLink);
    body.appendChild(gmapsRow);
  }

  const buttonRow = document.createElement("div");
  buttonRow.style.cssText = "display:flex;gap:6px;flex-wrap:wrap";
  buttonRow.appendChild(createActionButton("edit", "Edit", "#C4692A"));
  buttonRow.appendChild(createActionButton("delete", "Delete", "#EF4444"));
  buttonRow.appendChild(createActionButton("route", "+ Route", "#C4692A"));
  buttonRow.appendChild(createActionButton("plan", "Add to Planner", "#3B8CB5"));
  body.appendChild(buttonRow);

  if (pin.placeId) {
    const aiButton = document.createElement("button");
    aiButton.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:transparent;color:#4285F4;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
    aiButton.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> Ask AI';

    const aiContainer = document.createElement("div");
    aiContainer.style.cssText = "display:none;margin-top:8px;padding:12px;border-radius:8px;background:#f8f9fa;border:1px solid #e0e0e0;font-size:13px;line-height:1.6;color:#1A1A1A;max-height:300px;overflow-y:auto";

    let briefText = "";
    let briefLoaded = false;
    let detailedLoaded = false;

    aiButton.addEventListener("click", async () => {
      if (detailedLoaded) {
        aiContainer.style.display = aiContainer.style.display === "none" ? "block" : "none";
        aiButton.textContent = aiContainer.style.display === "none" ? "Show AI Brief" : "Hide AI Brief";
        return;
      }

      if (briefLoaded) {
        aiButton.innerHTML = "Digging deeper...";
        aiButton.style.opacity = "0.7";

        try {
          const detailed = await fetchAiBrief(pin.placeId!, pin.title, pin.address, pin.status, "detailed", briefText);
          aiContainer.innerHTML = renderInfoMarkdown(`${briefText}\n\n---\n\n${detailed}`);
          detailedLoaded = true;
          aiButton.textContent = "Hide AI Brief";
          aiButton.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
          aiButton.style.opacity = "1";
        } catch {
          aiButton.innerHTML = "Learn More (retry)";
          aiButton.style.opacity = "1";
        }

        return;
      }

      aiButton.innerHTML = "Generating...";
      aiButton.style.opacity = "0.7";

      try {
        briefText = await fetchAiBrief(pin.placeId!, pin.title, pin.address, pin.status, "brief");
        aiContainer.style.display = "block";
        aiContainer.innerHTML = renderInfoMarkdown(briefText);
        briefLoaded = true;
        aiButton.innerHTML = "Learn More";
        aiButton.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;width:100%;padding:8px;border-radius:6px;border:1.5px solid #4285F4;background:#4285F4;color:#fff;font-size:13px;font-weight:700;cursor:pointer;margin-top:8px";
        aiButton.style.opacity = "1";
      } catch {
        aiButton.innerHTML = "Ask AI (retry)";
        aiButton.style.opacity = "1";
      }
    });

    body.appendChild(aiButton);
    body.appendChild(aiContainer);
  }

  container.appendChild(body);

  container.addEventListener("click", (event) => {
    const actionButton = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-action]");
    if (!actionButton) return;

    const action = actionButton.dataset.action;
    if (action === "edit") {
      onEditPin(pin.id);
      return;
    }

    if (action === "delete") {
      onDeletePin(pin.id);
      return;
    }

    if (action === "route") {
      onAddRouteStop(pin, actionButton);
      return;
    }

    if (action === "plan") {
      onPlanPin(pin, actionButton);
    }
  });

  return container;
}

function createActionButton(action: string, label: string, backgroundColor: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.dataset.action = action;
  button.textContent = label;
  button.style.cssText = `padding:6px 14px;background:${backgroundColor};color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:700`;
  return button;
}

function renderInfoMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^(\s*)\*\s+/gm, "$1• ")
    .replace(/^(\s*)[-–]\s+/gm, "$1• ")
    .replace(/\n{2,}/g, "<br><br>")
    .replace(/\n/g, "<br>");
}
