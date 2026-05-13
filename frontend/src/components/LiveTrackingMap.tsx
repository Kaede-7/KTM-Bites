// ============================================================
// LiveTrackingMap.tsx — Real-time GPS Tracking Map
// ============================================================
// Displays an OpenStreetMap with:
//   - Rider's live position (orange scooter marker)
//   - Customer's delivery address (dark house marker)
//   - OSRM road route between them (orange polyline)
//   - ETA badge (top center)
//   - Driver info card (bottom left)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../css/tracking-map.css';
import type { RiderLocation, RiderInfo } from '../api/orders';
import { geocodeAddress, KATHMANDU_CENTER, type LatLng } from '../api/geocode';

// ── Custom Marker Icons ──────────────────────────────────────

const riderIcon = L.divIcon({
  className: 'tracking-marker-rider',
  html: `<div class="marker-icon-rider">
    <span class="material-symbols-rounded">two_wheeler</span>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

const customerIcon = L.divIcon({
  className: 'tracking-marker-customer',
  html: `<div class="marker-icon-customer">
    <span class="material-symbols-rounded">home</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// ── Helper: Fetch OSRM Route ─────────────────────────────────

interface RouteData {
  coordinates: [number, number][];  // [lat, lng] pairs
  duration: number;                  // seconds
  distance: number;                  // meters
}

async function fetchRoute(from: LatLng, to: LatLng): Promise<RouteData | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?geometries=geojson&overview=full`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // OSRM returns [lng, lat] — we need [lat, lng] for Leaflet
      const coordinates: [number, number][] = route.geometry.coordinates.map(
        (coord: [number, number]) => [coord[1], coord[0]]
      );
      return {
        coordinates,
        duration: route.duration,
        distance: route.distance,
      };
    }
    return null;
  } catch (error) {
    console.error('OSRM route fetch error:', error);
    return null;
  }
}

// ── Map Auto-Fit Component ───────────────────────────────────

interface FitBoundsProps {
  riderPos: LatLng;
  customerPos: LatLng;
}

const FitBounds: React.FC<FitBoundsProps> = ({ riderPos, customerPos }) => {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (!hasFitted.current) {
      const bounds = L.latLngBounds(
        [riderPos.lat, riderPos.lng],
        [customerPos.lat, customerPos.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
      hasFitted.current = true;
    }
  }, [map, riderPos, customerPos]);

  return null;
};

// ── Smooth Map Panner ────────────────────────────────────────
// Flies the map to follow the rider's position on each update
const MapPanner: React.FC<{ position: LatLng }> = ({ position }) => {
  const map = useMap();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return; // Skip the initial render (FitBounds handles that)
    }
    map.flyTo([position.lat, position.lng], map.getZoom(), {
      duration: 2.5,
      easeLinearity: 0.2,
    });
  }, [position.lat, position.lng]);

  return null;
};

// ── Main Component ───────────────────────────────────────────

interface LiveTrackingMapProps {
  riderLocation: RiderLocation;
  riderInfo?: RiderInfo | null;
  deliveryAddress: string;
  deliveryCity: string;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  riderLocation,
  riderInfo,
  deliveryAddress,
  deliveryCity,
}) => {
  const [customerPos, setCustomerPos] = useState<LatLng | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [eta, setEta] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const riderPos: LatLng = { lat: riderLocation.lat, lng: riderLocation.lng };

  // Geocode the delivery address once
  useEffect(() => {
    let cancelled = false;
    const doGeocode = async () => {
      const coords = await geocodeAddress(deliveryAddress, deliveryCity);
      if (!cancelled) {
        setCustomerPos(coords);
        setLoading(false);
      }
    };
    doGeocode();
    return () => { cancelled = true; };
  }, [deliveryAddress, deliveryCity]);

  // Fetch OSRM route whenever rider position or customer position changes
  useEffect(() => {
    if (!customerPos) return;
    let cancelled = false;

    const updateRoute = async () => {
      const route = await fetchRoute(riderPos, customerPos);
      if (!cancelled && route) {
        setRouteCoords(route.coordinates);
        setEta(Math.ceil(route.duration / 60)); // Convert to minutes
      }
    };
    updateRoute();

    return () => { cancelled = true; };
  }, [riderPos.lat, riderPos.lng, customerPos]);

  // Loading state
  if (loading || !customerPos) {
    return (
      <div className="tracking-map-loading">
        <span className="material-symbols-rounded">map</span>
        Loading live map...
      </div>
    );
  }

  return (
    <div className="tracking-map-section">
      <div className="tracking-map-container">
        {/* ETA Badge */}
        {eta !== null && (
          <div className="tracking-map-eta">
            <span className="eta-dot" />
            <span>ETA: <span className="eta-value">{eta} min</span></span>
          </div>
        )}

        {/* Leaflet Map */}
        <MapContainer
          center={[riderPos.lat, riderPos.lng]}
          zoom={14}
          scrollWheelZoom={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Road Route (Polyline) */}
          {routeCoords.length > 0 && (
            <Polyline
              positions={routeCoords}
              pathOptions={{
                color: '#f28b46',
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          )}

          {/* Rider Marker */}
          <Marker position={[riderPos.lat, riderPos.lng]} icon={riderIcon} />

          {/* Customer Marker */}
          <Marker position={[customerPos.lat, customerPos.lng]} icon={customerIcon} />

          {/* Auto-fit bounds */}
          <FitBounds riderPos={riderPos} customerPos={customerPos} />

          {/* Smooth pan to follow rider */}
          <MapPanner position={riderPos} />
        </MapContainer>

        {/* Driver Info Card */}
        {riderInfo && (
          <div className="tracking-driver-card">
            <div className="tracking-driver-avatar">
              <span className="material-symbols-rounded">person</span>
            </div>
            <div className="tracking-driver-details">
              <div className="tracking-driver-name">{riderInfo.name}</div>
              <div className="tracking-driver-meta">
                {riderInfo.vehicle_type && (
                  <span className="driver-bike">
                    <span className="material-symbols-rounded">two_wheeler</span>
                    {riderInfo.vehicle_type}
                  </span>
                )}
                <span className="driver-phone">
                  <span className="material-symbols-rounded">call</span>
                  {riderInfo.phone ? riderInfo.phone : "No contact"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
