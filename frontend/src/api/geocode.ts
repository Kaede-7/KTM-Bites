// ============================================================
// geocode.ts — Nominatim (OpenStreetMap) Geocoding Helper
// ============================================================
// Converts a text address (e.g. "Jhamsikhel, Kathmandu") into
// latitude/longitude coordinates using the free Nominatim API.
//
// Usage:
//   const coords = await geocodeAddress("Jhamsikhel, Kathmandu");
//   // { lat: 27.6756, lng: 85.3117 }
//
// Rules:
//   - Max 1 request per second (Nominatim policy)
//   - No API key needed
// ============================================================

export interface LatLng {
  lat: number;
  lng: number;
}

// Default fallback: Kathmandu city center
const KATHMANDU_CENTER: LatLng = { lat: 27.7172, lng: 85.3240 };

/**
 * Geocode a text address into { lat, lng } using Nominatim.
 * Falls back to Kathmandu center if the address cannot be found.
 */
export async function geocodeAddress(address: string, city = 'Kathmandu'): Promise<LatLng> {
  try {
    const query = encodeURIComponent(`${address}, ${city}, Nepal`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;

    const response = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent to identify your app
        'User-Agent': 'KTM-Bites-Delivery-App/1.0',
      },
    });

    const results = await response.json();

    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lng: parseFloat(results[0].lon),
      };
    }

    // If no results, return Kathmandu center
    console.warn(`Geocoding: No results for "${address}, ${city}". Using default.`);
    return KATHMANDU_CENTER;
  } catch (error) {
    console.error('Geocoding error:', error);
    return KATHMANDU_CENTER;
  }
}

export interface GeocodeSuggestion {
  display_name: string;
  name: string;
}

/**
 * Searches locations matching a query string in Kathmandu, Nepal.
 * Returns up to 5 matching places.
 */
export async function searchKathmanduLocations(query: string): Promise<GeocodeSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const formattedQuery = encodeURIComponent(`${query}, Kathmandu`);
    const url = `https://nominatim.openstreetmap.org/search?q=${formattedQuery}&format=json&limit=5&addressdetails=1`;

    const response = await fetch(url);
    const results = await response.json();
    if (!results || !Array.isArray(results)) return [];

    return results.map((item: any) => {
      const parts = item.display_name.split(',');
      const shortName = parts.slice(0, 3).join(',').trim();
      return {
        display_name: item.display_name,
        name: shortName
      };
    });
  } catch (error) {
    console.error('Failed to search locations:', error);
    return [];
  }
}

export { KATHMANDU_CENTER };

