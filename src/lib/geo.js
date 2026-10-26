// Straight-line distance in km between two { lat, lng } points
export function distanceKm(a, b) {
  if (a?.lat == null || b?.lat == null) return null;
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export const formatKm = (km) => (km == null ? "" : km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`);

export const lerp = (a, b, t) => ({ lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t });
