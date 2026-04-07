import { describe, expect, it } from "vitest";
import { buildCreatePin, buildUpdatePinPatch } from "@/app/features/pins/lib/pin-modal";

describe("pin-modal builders", () => {
  it("buildCreatePin carries place metadata from initialData", () => {
    const timestamp = "2026-04-06T10:00:00.000Z";
    const pin = buildCreatePin({
      initialData: {
        lat: 40.7128,
        lng: -74.006,
        placeId: "place-123",
        photoUrl: "https://example.com/photo.jpg",
        rating: 4.6,
        ratingCount: 210,
      },
      title: "Acme",
      address: "123 Main St",
      status: "prospect",
      contact: "Jane",
      phone: "555-111-2222",
      followUpDate: "2026-04-10",
      notes: [],
      timestamp,
    });

    expect(pin.placeId).toBe("place-123");
    expect(pin.photoUrl).toBe("https://example.com/photo.jpg");
    expect(pin.rating).toBe(4.6);
    expect(pin.ratingCount).toBe(210);
  });

  it("buildUpdatePinPatch includes resolved place metadata", () => {
    const patch = buildUpdatePinPatch({
      title: "Acme",
      address: "123 Main St",
      status: "prospect",
      contact: "Jane",
      phone: "555-111-2222",
      followUpDate: "2026-04-10",
      notes: [],
      timestamp: "2026-04-06T10:00:00.000Z",
      placeId: "place-123",
      photoUrl: "https://example.com/photo.jpg",
      rating: 4.6,
      ratingCount: 210,
    });

    expect(patch.placeId).toBe("place-123");
    expect(patch.photoUrl).toBe("https://example.com/photo.jpg");
    expect(patch.rating).toBe(4.6);
    expect(patch.ratingCount).toBe(210);
  });
});
