// Marketplace departments. Icons are lucide-react names (see components/ui/CategoryIcon).
export const CATEGORIES = [
  { slug: "fashion", name: "Fashion", icon: "Shirt", blurb: "Everyday wear, shoes and bags", hue: "#f472b6" },
  { slug: "grocery", name: "Grocery", icon: "Apple", blurb: "Fresh produce and pantry staples", hue: "#4ade80" },
  { slug: "electronics", name: "Electronics", icon: "Smartphone", blurb: "Phones, laptops and gear", hue: "#60a5fa" },
  { slug: "home", name: "Home & Kitchen", icon: "Sofa", blurb: "Furniture, decor and cookware", hue: "#fbbf24" },
  { slug: "beauty", name: "Beauty", icon: "Sparkles", blurb: "Skincare, makeup and fragrance", hue: "#c084fc" },
  { slug: "accessories", name: "Accessories", icon: "Watch", blurb: "Watches, jewellery and eyewear", hue: "#2dd4bf" },
  { slug: "sports", name: "Sports", icon: "Dumbbell", blurb: "Training kit and outdoor gear", hue: "#fb923c" },
];

export const categoryBySlug = (slug) => CATEGORIES.find((c) => c.slug === slug);

export const SIZE_PRESETS = {
  apparel: ["XS", "S", "M", "L", "XL"],
  shoes: ["6", "7", "8", "9", "10", "11"],
};

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "popular", label: "Best selling" },
];

export const ORDER_STATUSES = [
  { value: "PLACED", label: "Order placed", short: "Placed", tone: "info" },
  { value: "CONFIRMED", label: "Confirmed by store", short: "Confirmed", tone: "info" },
  { value: "PACKED", label: "Packed, waiting for a rider", short: "Packed", tone: "warning" },
  { value: "OUT_FOR_DELIVERY", label: "Out for delivery", short: "On the way", tone: "accent" },
  { value: "DELIVERED", label: "Delivered", short: "Delivered", tone: "success" },
  { value: "CANCELLED", label: "Cancelled", short: "Cancelled", tone: "danger" },
];

export const statusMeta = (value) => ORDER_STATUSES.find((s) => s.value === value) || ORDER_STATUSES[0];

// The happy-path order a status moves through (cancel is a side exit)
export const STATUS_FLOW = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
