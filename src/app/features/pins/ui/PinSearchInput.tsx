"use client";

import { useState, useRef, useCallback } from "react";
import { useMapsLibrary } from "@vis.gl/react-google-maps";
import { dispatchPanToLocation } from "@/app/shared/model/mobile-events";

interface PlaceSuggestion {
  description: string;
  placeId: string;
}

interface PinSearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PinSearchInput({ value, onChange }: PinSearchInputProps) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const places = useMapsLibrary("places");
  const geocoding = useMapsLibrary("geocoding");

  const fetchSuggestions = useCallback(
    async (input: string) => {
      if (input.length < 3 || !places) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      try {
        const response = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input });
        const results: PlaceSuggestion[] = [];
        for (const suggestion of response.suggestions ?? []) {
          if (suggestion.placePrediction) {
            results.push({
              description: suggestion.placePrediction.text.text,
              placeId: suggestion.placePrediction.placeId,
            });
          }
          if (results.length >= 5) break;
        }
        setSuggestions(results);
        setShowDropdown(results.length > 0);
      } catch {
        setSuggestions([]);
        setShowDropdown(false);
      }
    },
    [places],
  );

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  async function handleSelectPlace(suggestion: PlaceSuggestion) {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowDropdown(false);

    if (!geocoding) return;
    const geocoder = new geocoding.Geocoder();
    try {
      const result = await geocoder.geocode({ placeId: suggestion.placeId });
      const location = result.results[0]?.geometry?.location;
      if (location) {
        dispatchPanToLocation(location.lat(), location.lng(), 16, suggestion.description);
      }
    } catch {
      // silently fail — user can still search
    }
  }

  return (
    <div
      className="relative"
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget as Node | null;
        if (!event.currentTarget.contains(nextTarget)) {
          setShowDropdown(false);
        }
      }}
    >
      <div className="flex items-center bg-bg-input border-[1.5px] border-border rounded-lg px-3 transition-colors duration-200 focus-within:border-orange">
        <svg
          className="text-text-muted shrink-0"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          className="flex-1 border-none bg-transparent py-2.5 px-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
          placeholder="Search pins or find a place..."
          autoComplete="off"
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        />
      </div>
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-bg-card shadow-gw-lg overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted border-b border-border">
            Places
          </div>
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              onClick={() => handleSelectPlace(s)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-orange-dim border-b border-border last:border-0"
            >
              <svg
                className="shrink-0 text-text-muted"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
