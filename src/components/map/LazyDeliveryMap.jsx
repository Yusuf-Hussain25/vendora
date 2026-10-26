"use client";

import dynamic from "next/dynamic";

// Leaflet needs `window`, so the map only loads in the browser
const LazyDeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => <div className="skeleton w-full h-full !rounded-none" />,
});

export default LazyDeliveryMap;
