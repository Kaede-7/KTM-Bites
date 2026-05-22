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
import { geocodeAddress, type LatLng } from '../api/geocode';

// ── Custom Marker Icons ──────────────────────────────────────

// Note: riderIcon is now defined dynamically inside the component to support bearing rotation.


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
  const [bearing, setBearing] = useState<number>(90); // Default to pointing North (bearing 0 + 90deg offset = 90)

  const prevRiderPosRef = useRef<LatLng | null>(null);
  const riderPos: LatLng = { lat: riderLocation.lat, lng: riderLocation.lng };

  // Calculate and update bearing angle smoothly on rider position changes
  useEffect(() => {
    if (prevRiderPosRef.current) {
      const lat1 = prevRiderPosRef.current.lat;
      const lng1 = prevRiderPosRef.current.lng;
      const lat2 = riderLocation.lat;
      const lng2 = riderLocation.lng;

      const dy = lat2 - lat1;
      const dx = lng2 - lng1;

      // Threshold to avoid noisy rotation when standing still
      if (Math.abs(dy) > 0.00002 || Math.abs(dx) > 0.00002) {
        const angle = Math.atan2(dx, dy) * (180 / Math.PI);
        const targetRotation = angle + 90;
        
        setBearing(prev => {
          let diff = (targetRotation - prev) % 360;
          if (diff < -180) diff += 360;
          if (diff > 180) diff -= 360;
          return prev + diff;
        });
      }
    }
    prevRiderPosRef.current = { lat: riderLocation.lat, lng: riderLocation.lng };
  }, [riderLocation.lat, riderLocation.lng]);

  // Memoized rider icon to preserve CSS transition smoothness on rotation changes
  const dynamicRiderIcon = React.useMemo(() => {
    return L.divIcon({
      className: 'tracking-marker-rider',
      html: `<div class="marker-icon-rider" style="transform: rotate(${bearing}deg);">
        <span class="material-symbols-rounded">two_wheeler</span>
      </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });
  }, [bearing]);

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

        // Initialize bearing if not set yet and route contains coordinates
        if (!prevRiderPosRef.current && route.coordinates.length >= 2) {
          const lat1 = route.coordinates[0][0];
          const lng1 = route.coordinates[0][1];
          const lat2 = route.coordinates[1][0];
          const lng2 = route.coordinates[1][1];
          const dy = lat2 - lat1;
          const dx = lng2 - lng1;
          if (Math.abs(dy) > 0.00001 || Math.abs(dx) > 0.00001) {
            const angle = Math.atan2(dx, dy) * (180 / Math.PI);
            setBearing(angle + 90);
          }
        }
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
          <Marker position={[riderPos.lat, riderPos.lng]} icon={dynamicRiderIcon} />

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
              <div className="tracking-driver-name" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
                <span>{riderInfo.name}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f28b46', display: 'flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '1rem', color: '#f28b46' }}>star</span>
                  {typeof riderInfo.rating === 'number' ? riderInfo.rating.toFixed(1) : '0.0'} ({riderInfo.rating_count || 0})
                </span>
              </div>
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
