// India-only delivery: states/UTs, validators and city coordinates.
// The live list comes from /api/geo/states; this copy is the offline fallback and the server-side allow-list.

export const COUNTRY = "India";

export const STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
  "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal",
];

// Different sources spell a few names differently; map them onto the list above
const ALIASES = {
  "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
  "daman and diu": "Dadra and Nagar Haveli and Daman and Diu",
  "nct of delhi": "Delhi",
  "new delhi": "Delhi",
  "pondicherry": "Puducherry",
  "orissa": "Odisha",
  "jammu & kashmir": "Jammu and Kashmir",
  "andaman & nicobar islands": "Andaman and Nicobar Islands",
};

export function normaliseState(name = "") {
  const lower = name.trim().toLowerCase();
  if (ALIASES[lower]) return ALIASES[lower];
  return STATES.find((s) => s.toLowerCase() === lower) || null;
}

// 6-digit PIN code; the first digit is never 0
export const isPinCode = (value = "") => /^[1-9]\d{5}$/.test(String(value).trim());

// Indian mobile numbers: optional +91, then 10 digits starting 6-9
export function normalisePhone(value = "") {
  const digits = String(value).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "").replace(/^0(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : null;
}

// Centre of India, used when an address has no pin on the map yet
export const INDIA_CENTER = { lat: 22.9734, lng: 78.6569 };
