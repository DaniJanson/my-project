'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useNavigation } from '../context/NavigationContext';
import { 
  Navigation, 
  Layers, 
  Plus, 
  Minus, 
  Crosshair, 
  AlertCircle,
  Clock,
  Compass,
  Key
} from 'lucide-react';

// Sleek Tesla Automotive Dark Mode Map Styles
const TESLA_DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#12141a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#12141a' }, { weight: 3 }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#9ea5b9' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#e2e8f0' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }], // Turn off cluttered POI for driving
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#252936' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#181b24' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#cbd5e1' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#333b4e' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2430' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f1f5f9' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1d212b' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#090b10' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#475569' }],
  },
];

export default function MapComponent() {
  const {
    currentLocation,
    heading,
    speed,
    destination,
    waypoints,
    isNavigating,
    trafficEnabled,
    followCar,
    mapRef,
    toggleTraffic,
    recenterToCar,
    setRouteResult,
    setRouteStats,
  } = useNavigation();

  const mapContainerRef = useRef(null);
  const trafficLayerRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const waypointMarkersRef = useRef([]);
  const directionsRendererRef = useRef(null);
  const directionsServiceRef = useRef(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'your_google_maps_api_key_here';

  // 1. Initialize Google Maps
  useEffect(() => {
    if (!isKeyConfigured) {
      setIsDemoMode(true);
      return;
    }

    const loader = new Loader({
      apiKey: apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
    });

    loader
      .load()
      .then((google) => {
        if (!mapContainerRef.current) return;

        const initialCenter = currentLocation || { lat: 41.7151, lng: 44.8271 };

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialCenter,
          zoom: 15,
          tilt: 0, // Disabled 3D for Tesla GPU performance
          disableDefaultUI: true, // Clean screen for automotive
          gestureHandling: 'greedy', // Single-finger touch pan
          styles: TESLA_DARK_MAP_STYLES,
          backgroundColor: '#0a0b0e',
          clickableIcons: false,
          keyboardShortcuts: false,
          maxZoom: 19,
          minZoom: 4,
        });

        mapRef.current = map;

        // Initialize Traffic Layer
        const trafficLayer = new google.maps.TrafficLayer();
        trafficLayerRef.current = trafficLayer;
        if (trafficEnabled) {
          trafficLayer.setMap(map);
        }

        // Initialize Directions
        directionsServiceRef.current = new google.maps.DirectionsService();
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
          map: map,
          suppressMarkers: true, // Custom Tesla markers
          polylineOptions: {
            strokeColor: '#3e6ae1', // Tesla Electric Blue
            strokeWeight: 6,
            strokeOpacity: 0.9,
          },
        });

        // Initialize Vehicle Marker (Custom SVG arrow)
        const vehicleIcon = {
          path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#3e6ae1',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
          rotation: heading || 0,
        };

        const vehicleMarker = new google.maps.Marker({
          position: initialCenter,
          map: map,
          icon: vehicleIcon,
          title: 'ჩემი ავტომობილი (Tesla)',
          zIndex: 999,
        });
        vehicleMarkerRef.current = vehicleMarker;

        setMapLoaded(true);
      })
      .catch((err) => {
        console.error('Google Maps Load Error:', err);
        setApiError(err.message || 'Google Maps API ჩატვირთვა ვერ მოხერხდა.');
        setIsDemoMode(true);
      });
  }, [apiKey, isKeyConfigured]);

  // 2. Toggle Traffic Layer
  useEffect(() => {
    if (!trafficLayerRef.current || !mapRef.current) return;
    if (trafficEnabled) {
      trafficLayerRef.current.setMap(mapRef.current);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  }, [trafficEnabled]);

  // 3. Update Vehicle Marker & Position
  useEffect(() => {
    if (!vehicleMarkerRef.current || !currentLocation) return;

    const latLng = new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng);
    vehicleMarkerRef.current.setPosition(latLng);

    // Update vehicle orientation
    if (heading !== null && !isNaN(heading)) {
      const icon = vehicleMarkerRef.current.getIcon();
      if (icon && typeof icon === 'object') {
        vehicleMarkerRef.current.setIcon({
          ...icon,
          rotation: heading,
        });
      }
    }

    if (followCar && mapRef.current) {
      mapRef.current.panTo(latLng);
    }
  }, [currentLocation, heading, followCar]);

  // 4. Calculate Route when Destination or Waypoints change
  const calculateRoute = useCallback(() => {
    if (
      !mapLoaded ||
      !directionsServiceRef.current ||
      !directionsRendererRef.current ||
      !destination ||
      !destination.lat ||
      !destination.lng
    ) {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.set('directions', null);
      }
      return;
    }

    const origin = currentLocation
      ? new window.google.maps.LatLng(currentLocation.lat, currentLocation.lng)
      : new window.google.maps.LatLng(41.7151, 44.8271);

    const destLatLng = new window.google.maps.LatLng(destination.lat, destination.lng);

    const googleWaypoints = waypoints
      .filter((wp) => wp.lat && wp.lng)
      .map((wp) => ({
        location: new window.google.maps.LatLng(wp.lat, wp.lng),
        stopover: true,
      }));

    directionsServiceRef.current.route(
      {
        origin: origin,
        destination: destLatLng,
        waypoints: googleWaypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS,
        },
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          directionsRendererRef.current.setDirections(result);
          setRouteResult(result);

          // Calculate total distance and duration with live traffic
          let totalDistanceMeters = 0;
          let totalDurationSec = 0;
          let totalDurationTrafficSec = 0;
          const legs = result.routes[0]?.legs || [];

          legs.forEach((leg) => {
            totalDistanceMeters += leg.distance?.value || 0;
            totalDurationSec += leg.duration?.value || 0;
            totalDurationTrafficSec += leg.duration_in_traffic?.value || leg.duration?.value || 0;
          });

          const distanceKm = (totalDistanceMeters / 1000).toFixed(1);
          const durationMin = Math.round(totalDurationSec / 60);
          const trafficDurationMin = Math.round(totalDurationTrafficSec / 60);
          const delayMin = Math.max(0, trafficDurationMin - durationMin);

          setRouteStats({
            distance: `${distanceKm} კმ`,
            duration: `${durationMin} წთ`,
            durationInTraffic: `${trafficDurationMin} წთ`,
            delayMinutes: delayMin,
            congestion: delayMin > 10 ? 'მძიმე საცობი' : delayMin > 3 ? 'საშუალო საცობი' : 'თავისუფალი',
            summary: result.routes[0]?.summary || '',
            steps: legs.flatMap((l) => l.steps || []),
          });

          // Destination Marker
          if (destMarkerRef.current) {
            destMarkerRef.current.setMap(null);
          }
          destMarkerRef.current = new window.google.maps.Marker({
            position: destLatLng,
            map: mapRef.current,
            title: destination.name,
            icon: {
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#e82127', // Tesla Red pin
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 2,
              scale: 1.6,
              anchor: new window.google.maps.Point(12, 22),
            },
          });

          // Waypoint Markers
          waypointMarkersRef.current.forEach((m) => m.setMap(null));
          waypointMarkersRef.current = googleWaypoints.map((wp, idx) => {
            return new window.google.maps.Marker({
              position: wp.location,
              map: mapRef.current,
              label: {
                text: `${idx + 1}`,
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px',
              },
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 14,
                fillColor: '#3e6ae1',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              },
            });
          });

          // If not in active turn-by-turn navigation, fit route bounds
          if (!isNavigating && mapRef.current && result.routes[0]?.bounds) {
            mapRef.current.fitBounds(result.routes[0].bounds, {
              top: 80,
              right: 60,
              bottom: 80,
              left: 480, // Space for the side search panel
            });
          }
        } else {
          console.warn('Directions request failed status:', status);
        }
      }
    );
  }, [mapLoaded, destination, waypoints, currentLocation, isNavigating, mapRef, setRouteResult, setRouteStats]);

  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);

  // Zoom controls
  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 15) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.setZoom((mapRef.current.getZoom() || 15) - 1);
    }
  };

  return (
    <div className="relative w-full h-full bg-[#0a0b0e] overflow-hidden select-none">
      {/* Google Maps Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Demo Mode / API Key Warning Banner if key not yet added */}
      {isDemoMode && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0a0b0e]/95 p-6 text-center backdrop-blur-md">
          <div className="max-w-md w-full bg-[#16181f] border border-tesla-border rounded-2xl p-6 shadow-2xl">
            <div className="w-14 h-14 bg-tesla-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-tesla-accent">
              <Key className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Maps API გასაღები</h2>
            <p className="text-sm text-tesla-muted mb-4 leading-relaxed">
              Google Maps-ის რეალური რუკისა და ლაივ საცობების (Traffic Layer) სანახავად, ჩაწერეთ თქვენი{' '}
              <code className="text-tesla-accent bg-black/40 px-1.5 py-0.5 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>{' '}
              ფაილში <code className="text-slate-300">.env.local</code>.
            </p>
            <div className="bg-black/50 border border-tesla-border/50 rounded-xl p-3 text-left text-xs font-mono text-slate-300 space-y-1 mb-5">
              <p className="text-tesla-muted">// გაააქტიურეთ Google Console-ში:</p>
              <p className="text-emerald-400">✓ Maps JavaScript API</p>
              <p className="text-emerald-400">✓ Places API</p>
              <p className="text-emerald-400">✓ Directions API</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDemoMode(false)}
                className="flex-1 py-3 px-4 bg-tesla-card hover:bg-tesla-border border border-tesla-border text-white text-sm font-medium rounded-xl transition active:scale-95"
              >
                შეტყობინების დახურვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Touch UI: Right Side Quick Controls for Tesla Driver */}
      <div className="absolute right-6 bottom-8 z-20 flex flex-col gap-3">
        {/* Live Speed Display if moving */}
        {speed !== null && speed > 0 && (
          <div className="w-14 h-14 bg-tesla-card/90 backdrop-blur-md border border-tesla-border rounded-2xl flex flex-col items-center justify-center shadow-lg">
            <span className="text-base font-bold text-white leading-none">{speed}</span>
            <span className="text-[10px] font-semibold text-tesla-muted uppercase">კმ/სთ</span>
          </div>
        )}

        {/* Traffic Layer Toggle */}
        <button
          onClick={toggleTraffic}
          className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border transition-all duration-200 active:scale-95 shadow-xl ${
            trafficEnabled
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
              : 'bg-tesla-card/90 border-tesla-border text-slate-400 hover:text-white'
          }`}
          title="საცობების ფენა (Traffic Layer)"
        >
          <Layers className="w-6 h-6 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight">TRAFFIC</span>
        </button>

        {/* Recenter & Follow Car Button */}
        <button
          onClick={recenterToCar}
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-200 active:scale-95 shadow-xl ${
            followCar
              ? 'bg-tesla-accent border-tesla-accent text-white ring-2 ring-tesla-accent/40'
              : 'bg-tesla-card/90 border-tesla-border text-slate-400 hover:text-white'
          }`}
          title="ავტომობილის ცენტრირება"
        >
          <Crosshair className="w-7 h-7" />
        </button>

        {/* Zoom In */}
        <button
          onClick={handleZoomIn}
          className="w-14 h-14 bg-tesla-card/90 hover:bg-tesla-card border border-tesla-border text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-xl"
          title="გადიდება"
        >
          <Plus className="w-7 h-7" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={handleZoomOut}
          className="w-14 h-14 bg-tesla-card/90 hover:bg-tesla-card border border-tesla-border text-white rounded-2xl flex items-center justify-center active:scale-95 shadow-xl"
          title="დაპატარავება"
        >
          <Minus className="w-7 h-7" />
        </button>
      </div>
    </div>
  );
}
