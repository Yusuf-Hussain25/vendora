import "server-only";
import { normaliseState, STATES } from "@/lib/india";

const DAY = 86400;
const UA = { "User-Agent": "Vendora/2.0 (portfolio marketplace; github.com/Yusuf-Hussain25/vendora)" };

async function withTimeout(promise, ms = 5000) {
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);
}

// States and union territories, from the CountriesNow API (cached for a day), falling back to the bundled list
export async function getStates() {
  try {
    const res = await withTimeout(
      fetch("https://countriesnow.space/api/v0.1/countries/states", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "India" }),
        next: { revalidate: DAY },
      })
    );
    const data = await res.json();
    const names = [...new Set((data?.data?.states || []).map((s) => normaliseState(s.name)).filter(Boolean))];
    if (names.length >= 28) return { states: names.sort(), source: "countriesnow" };
  } catch {
    // network trouble: fall through to the bundled list
  }
  return { states: STATES, source: "bundled" };
}

export async function getCities(state) {
  const valid = normaliseState(state);
  if (!valid) return [];
  try {
    const res = await withTimeout(
      fetch("https://countriesnow.space/api/v0.1/countries/state/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: "India", state: valid }),
        next: { revalidate: DAY },
      })
    );
    const data = await res.json();
    return [...new Set((data?.data || []).map((c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "")))].sort();
  } catch {
    return [];
  }
}

// India Post PIN code directory: district, state and the post-office localities for a PIN
export async function lookupPinCode(pin) {
  try {
    const res = await withTimeout(fetch(`https://api.postalpincode.in/pincode/${pin}`, { next: { revalidate: DAY } }));
    const [result] = await res.json();
    if (result?.Status !== "Success" || !result.PostOffice?.length) return null;
    const first = result.PostOffice[0];
    return {
      pin,
      city: first.District,
      state: normaliseState(first.State) || first.State,
      localities: [...new Set(result.PostOffice.map((p) => p.Name))].slice(0, 12),
    };
  } catch {
    return null;
  }
}

// Approximate map position for a PIN code (OpenStreetMap Nominatim), so riders and the
// tracking map know roughly where to go even if the shopper didn't share a GPS pin.
export async function geocodePinCode(pin) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${pin}&country=India&format=json&limit=1`;
    // Only called when an address is saved, so skip the data cache (it could hold on to an empty answer)
    const res = await withTimeout(fetch(url, { headers: UA, cache: "no-store" }), 5000);
    const [hit] = await res.json();
    return hit ? { lat: Number(hit.lat), lng: Number(hit.lon) } : null;
  } catch (error) {
    console.warn(`Couldn't place PIN ${pin} on the map:`, error.message);
    return null;
  }
}
