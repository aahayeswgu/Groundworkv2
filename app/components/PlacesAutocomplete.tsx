"use client";

import { useRef, useState, useEffect, useCallback } from "react";

interface Suggestion {
  description: string;
  placeId: string;
}

interface PlacesAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function PlacesAutocomplete({
  value,
  onChange,
  placeholder = "Search for a location...",
  className = "",
}: PlacesAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    try {
      // Use Places (New) AutocompleteSuggestion API
      const { AutocompleteSuggestion } = (await google.maps.importLibrary("places")) as google.maps.PlacesLibrary & {
        AutocompleteSuggestion: {
          fetchAutocompleteSuggestions: (req: {
            input: string;
            includedPrimaryTypes?: string[];
          }) => Promise<{ suggestions: Array<{
            placePrediction?: {
              placeId: string;
              text: { text: string };
            };
          }> }>;
        };
      };

      const response = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input,
      });

      const results: Suggestion[] = [];
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
    } catch (err) {
      console.error("[PlacesAutocomplete] fetch failed:", err);
      setSuggestions([]);
      setShowDropdown(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
  }

  function handleSelect(suggestion: Suggestion) {
    onChange(suggestion.description);
    setSuggestions([]);
    setShowDropdown(false);
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-bg-card shadow-lg overflow-hidden">
          {suggestions.map((s) => (
            <button
              key={s.placeId}
              onClick={() => handleSelect(s)}
              className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-orange-dim transition-colors border-b border-border last:border-0"
            >
              {s.description}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
