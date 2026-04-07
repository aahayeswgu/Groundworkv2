export type DiscoverSortKey = "recommended" | "rating-desc" | "name-asc" | "name-desc";

export interface DiscoverSortOption {
  key: DiscoverSortKey;
  label: string;
}

export const DISCOVER_SORT_OPTIONS: readonly DiscoverSortOption[] = [
  { key: "recommended", label: "Recommended" },
  { key: "rating-desc", label: "Rating (High to Low)" },
  { key: "name-asc", label: "Name (A to Z)" },
  { key: "name-desc", label: "Name (Z to A)" },
];
