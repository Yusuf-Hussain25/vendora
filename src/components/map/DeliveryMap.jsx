"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";

const pin = (bg, svg, pulse = false) =>
  L.divIcon({
    className: "",
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    html: `<div style="position:relative;width:40px;height:40px;display:grid;place-items:center;border-radius:999px;background:${bg};color:#fff;box-shadow:0 4px 14px rgba(23,25,22,.3);border:2.5px solid #f7f5ef">
      ${pulse ? `<span style="position:absolute;inset:-8px;border-radius:999px;border:2px solid ${bg};animation:pulse-ring 1.8s cubic-bezier(.22,1,.36,1) infinite"></span>` : ""}
      ${svg}</div>`,
  });

const svg = (path) =>
  `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;

const icons = {
  store: pin("#171916", svg('<path d="M3 9l1-5h16l1 5"/><path d="M4 9v11h16V9"/><path d="M9 20v-6h6v6"/>')),
  home: pin("#0e3b2e", svg('<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>')),
  rider: pin("#b4552d", svg('<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l3 8"/><path d="M14 6h3"/>'), true),
};

function FitBounds({ points }) {
  const map = useMap();
  const key = points.map((p) => p.join(",")).join("|");
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [48, 48], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 14);
    // Refit only when the set of coordinates actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, map]);
  return null;
}

// store / home / rider are { lat, lng, label } or null
export default function DeliveryMap({ store, home, rider, className = "", interactive = true }) {
  const points = useMemo(() => [store, home, rider].filter(Boolean).map((p) => [p.lat, p.lng]), [store, home, rider]);
  const center = points[0] || [37.7749, -122.4194];

  return (
    <div className={`map-themed overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom={false}
        dragging={interactive}
        zoomControl={interactive}
        attributionControl
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {store && home && <Polyline positions={[[store.lat, store.lng], [home.lat, home.lng]]} pathOptions={{ color: "#0e3b2e", weight: 3, opacity: 0.75, dashArray: "6 8" }} />}
        {store && (
          <Marker position={[store.lat, store.lng]} icon={icons.store}>
            <Tooltip direction="top" offset={[0, -18]}>
              {store.label}
            </Tooltip>
          </Marker>
        )}
        {home && (
          <Marker position={[home.lat, home.lng]} icon={icons.home}>
            <Tooltip direction="top" offset={[0, -18]}>
              {home.label}
            </Tooltip>
          </Marker>
        )}
        {rider && (
          <Marker position={[rider.lat, rider.lng]} icon={icons.rider} zIndexOffset={1000}>
            <Tooltip direction="top" offset={[0, -18]} permanent>
              {rider.label}
            </Tooltip>
          </Marker>
        )}
        <FitBounds points={points} />
      </MapContainer>
    </div>
  );
}
