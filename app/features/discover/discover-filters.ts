import type { DiscoverResult } from "@/app/types/discover.types";

export const EXCLUDED_CHAINS = /home depot|lowe'?s|ace hardware|menards|harbor freight|sherwin.williams|walmart|target|costco|cvs|walgreens|publix|mcdonald|starbucks|dunkin|subway|burger king|taco bell|pizza|chase bank|wells fargo|bank of america|state farm|allstate/i;

// Filter out residential and non-business places
export const EXCLUDED_PLACE_TYPES: string[] = [
  'premise', 'street_address', 'subpremise', 'lodging', 'real_estate_agency',
  'moving_company', 'storage', 'atm', 'bank', 'car_dealer', 'car_rental',
  'car_wash', 'car_repair', 'gas_station', 'parking', 'cemetery', 'church',
  'hindu_temple', 'mosque', 'synagogue', 'hospital', 'pharmacy', 'doctor',
  'dentist', 'veterinary_care', 'gym', 'hair_care', 'beauty_salon', 'spa',
  'laundry', 'lawyer', 'accounting', 'insurance_agency', 'travel_agency',
  'restaurant', 'cafe', 'bar', 'night_club', 'casino', 'movie_theater',
  'museum', 'art_gallery', 'zoo', 'aquarium', 'amusement_park',
  'bowling_alley', 'campground', 'rv_park', 'park', 'tourist_attraction',
  'school', 'university', 'library', 'post_office', 'city_hall', 'courthouse',
  'embassy', 'fire_station', 'police', 'local_government_office',
];

// Also exclude by name patterns (residential/home services)
export const EXCLUDED_NAME_PATTERNS = /\b(home|house|residential|apartment|condo|duplex|townhome|single.?family|estate|realty|realtor|property management|handyman|maid|cleaning service|lawn care|pest control|pool service|garage door|window cleaning|gutter cleaning|pressure wash|junk removal|moving|storage)\b/i;

export function classifyGooglePlace(types: string[], displayName: string): string {
  const name = displayName.toLowerCase();
  if (types.includes('electrician')) return 'Electrical';
  if (types.includes('plumber')) return 'Plumbing';
  if (types.includes('roofing_contractor')) return 'Roofing';
  if (types.includes('painter')) return 'Painting';
  if (types.includes('general_contractor')) return 'General Contractor';
  if (name.match(/hvac|heating.*cool|air condition/)) return 'HVAC';
  if (name.match(/landscap|lawn|tree serv/)) return 'Landscaping';
  if (name.match(/weld|fabricat/)) return 'Welding/Fabrication';
  if (name.match(/concrete|cement|ready.?mix/)) return 'Concrete';
  if (name.match(/demoli/)) return 'Demolition';
  if (name.match(/excavat|grading|earthwork/)) return 'Excavation';
  if (name.match(/pav|asphalt/)) return 'Paving';
  if (name.match(/mason|brick/)) return 'Masonry';
  if (name.match(/fence|fencing/)) return 'Fencing';
  if (name.match(/manufactur|industrial.*supply|production.*facility/)) return 'Manufacturing';
  if (name.match(/construct|contract|builder/)) return 'Construction';
  return 'Trade/Contractor';
}

export function isInBounds(
  lat: number,
  lng: number,
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number },
): boolean {
  return lat > bounds.swLat && lat < bounds.neLat && lng > bounds.swLng && lng < bounds.neLng;
}

export function filterAndMapPlace(
  place: {
    id?: string;
    displayName?: string;
    formattedAddress?: string;
    location?: google.maps.LatLng | null;
    types?: string[];
    rating?: number | null;
    userRatingCount?: number | null;
    photos?: Array<{ getURI(opts?: { maxWidth?: number }): string }> | null;
  },
  bounds: { swLat: number; swLng: number; neLat: number; neLng: number },
  seen: Set<string>,
): DiscoverResult | null {
  if (!place.id || !place.displayName) return null;
  if (EXCLUDED_CHAINS.test(place.displayName)) return null;
  if ((place.types ?? []).some((t) => EXCLUDED_PLACE_TYPES.includes(t))) return null;
  if (EXCLUDED_NAME_PATTERNS.test(place.displayName)) return null;

  const lat = place.location!.lat();
  const lng = place.location!.lng();

  if (!isInBounds(lat, lng, bounds)) return null;

  // Triple dedup: place_id, normalized name, coord proximity (~50m)
  if (seen.has(place.id)) return null;
  seen.add(place.id);

  const nameKey = place.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (seen.has(nameKey)) return null;
  seen.add(nameKey);

  const coordKey = `${Math.round(lat * 1000)}_${Math.round(lng * 1000)}`;
  if (seen.has(coordKey)) return null;
  seen.add(coordKey);

  return {
    placeId: place.id,
    displayName: place.displayName,
    address: place.formattedAddress ?? '',
    lat,
    lng,
    types: place.types ?? [],
    rating: place.rating ?? null,
    photoUri: place.photos?.[0]?.getURI({ maxWidth: 280 }) ?? null,
  };
}
