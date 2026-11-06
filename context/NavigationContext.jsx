'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const NavigationContext = createContext(null);

const DEFAULT_CENTER = {
  lat: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT) || 41.7151,
  lng: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG) || 44.8271,
};

const STORAGE_KEY = 'tesla_nav_state';

export function NavigationProvider({ children }) {
  // Vehicle / GPS State
  const [currentLocation, setCurrentLocation] = useState(DEFAULT_CENTER);
  const [heading, setHeading] = useState(0);
  const [speed, setSpeed] = useState(null); // km/h
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [gpsActive, setGpsActive] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  // Navigation Route State
  const [destination, setDestination] = useState(null);
  const [waypoints, setWaypoints] = useState([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [routeResult, setRouteResult] = useState(null);
  const [routeStats, setRouteStats] = useState(null);

  // Map Controls State
  const [trafficEnabled, setTrafficEnabled] = useState(true);
  const [followCar, setFollowCar] = useState(true);
  const [mapZoom, setMapZoom] = useState(15);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [keepAliveActive, setKeepAliveActive] = useState(true);

  // References for Google Map objects
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);
  const isRestoredRef = useRef(false);

  // 1. Geolocation Watcher (Continuous Real-Time GPS Tracking for Tesla)
  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation API არ არის მხარდაჭერილი ამ ბრაუზერში.');
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 1000,
      timeout: 10000,
    };

    const handleSuccess = (pos) => {
      const { latitude, longitude, heading: h, speed: s, accuracy } = pos.coords;
      const coords = { lat: latitude, lng: longitude };

      setCurrentLocation(coords);
      setGpsAccuracy(accuracy);
      setGpsActive(true);
      setGpsError(null);

      if (h !== null && !isNaN(h)) {
        setHeading(h);
      }
      if (s !== null && !isNaN(s)) {
        // Convert m/s to km/h
        setSpeed(Math.round(s * 3.6));
      }

      // If followCar is active and map is loaded, update center
      if (followCar && mapRef.current) {
        mapRef.current.panTo(coords);
      }
    };

    const handleError = (err) => {
      console.warn('Geolocation watch error:', err.message);
      setGpsActive(false);
      // Don't overwrite error with minor timeout warnings if we already have a location
      if (!currentLocation) {
        setGpsError('GPS სიგნალის მიღება ვერ მოხერხდა: ' + err.message);
      }
    };

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions);

    // Continuous tracking
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [followCar]);

  // 2. Anti-Refresh System: Restore state on initial mount
  useEffect(() => {
    if (typeof window === 'undefined' || isRestoredRef.current) return;
    isRestoredRef.current = true;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlDestName = urlParams.get('dest');
      const urlDlat = urlParams.get('dlat');
      const urlDlng = urlParams.get('dlng');
      const urlWp = urlParams.get('wp');
      const urlNav = urlParams.get('nav');

      if (urlDestName && urlDlat && urlDlng) {
        const restoredDest = {
          name: decodeURIComponent(urlDestName),
          lat: parseFloat(urlDlat),
          lng: parseFloat(urlDlng),
        };
        setDestination(restoredDest);

        if (urlWp) {
          try {
            const parsedWp = JSON.parse(decodeURIComponent(urlWp));
            if (Array.isArray(parsedWp)) setWaypoints(parsedWp);
          } catch (e) {
            console.warn('Failed to parse waypoints from URL:', e);
          }
        }

        if (urlNav === '1') {
          setIsNavigating(true);
        }
        return;
      }

      // Fallback to localStorage if URL params are empty
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const state = JSON.parse(cached);
        if (state.destination) {
          setDestination(state.destination);
        }
        if (state.waypoints && Array.isArray(state.waypoints)) {
          setWaypoints(state.waypoints);
        }
        if (state.isNavigating) {
          setIsNavigating(true);
        }
        if (state.mapZoom) {
          setMapZoom(state.mapZoom);
        }
        if (state.mapCenter) {
          setMapCenter(state.mapCenter);
        }
      }
    } catch (e) {
      console.warn('Error restoring anti-refresh state:', e);
    }
  }, []);

  // 3. Anti-Refresh System: Sync state to localStorage & URL search params
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      // Save full state to localStorage
      const stateToPersist = {
        destination,
        waypoints,
        isNavigating,
        mapZoom,
        mapCenter,
        updatedAt: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToPersist));

      // Sync with URL Query Params for crash/refresh survival
      const params = new URLSearchParams();
      if (destination && destination.lat && destination.lng) {
        params.set('dest', destination.name || 'დანიშნულება');
        params.set('dlat', destination.lat.toString());
        params.set('dlng', destination.lng.toString());
        if (waypoints.length > 0) {
          params.set('wp', JSON.stringify(waypoints));
        }
        if (isNavigating) {
          params.set('nav', '1');
        }
      }

      const queryString = params.toString();
      const newUrl = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
      window.history.replaceState({ path: newUrl }, '', newUrl);
    } catch (e) {
      console.warn('Error saving anti-refresh state:', e);
    }
  }, [destination, waypoints, isNavigating, mapZoom, mapCenter]);

  // Actions
  const handleSetDestination = useCallback((dest) => {
    setDestination(dest);
    if (!dest) {
      setIsNavigating(false);
      setRouteResult(null);
      setRouteStats(null);
    }
  }, []);

  const handleAddWaypoint = useCallback((wp) => {
    setWaypoints((prev) => [...prev, { ...wp, id: wp.id || 'wp-' + Date.now() }]);
  }, []);

  const handleRemoveWaypoint = useCallback((index) => {
    setWaypoints((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleClearNavigation = useCallback(() => {
    setDestination(null);
    setWaypoints([]);
    setIsNavigating(false);
    setRouteResult(null);
    setRouteStats(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleStartNavigation = useCallback(() => {
    if (destination) {
      setIsNavigating(true);
      setFollowCar(true);
    }
  }, [destination]);

  const handleStopNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  const toggleTraffic = useCallback(() => {
    setTrafficEnabled((prev) => !prev);
  }, []);

  const toggleFollowCar = useCallback(() => {
    setFollowCar((prev) => {
      const next = !prev;
      if (next && mapRef.current && currentLocation) {
        mapRef.current.panTo(currentLocation);
      }
      return next;
    });
  }, [currentLocation]);

  const toggleKeepAlive = useCallback(() => {
    setKeepAliveActive((prev) => !prev);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentLocation,
        heading,
        speed,
        gpsAccuracy,
        gpsActive,
        gpsError,
        destination,
        waypoints,
        isNavigating,
        routeResult,
        routeStats,
        trafficEnabled,
        followCar,
        mapZoom,
        mapCenter,
        keepAliveActive,
        mapRef,
        setDestination: handleSetDestination,
        addWaypoint: handleAddWaypoint,
        removeWaypoint: handleRemoveWaypoint,
        clearNavigation: handleClearNavigation,
        startNavigation: handleStartNavigation,
        stopNavigation: handleStopNavigation,
        toggleTraffic,
        toggleFollowCar,
        toggleKeepAlive,
        setMapZoom,
        setMapCenter,
        setRouteResult,
        setRouteStats,
        recenterToCar: () => {
          if (mapRef.current && currentLocation) {
            mapRef.current.panTo(currentLocation);
            mapRef.current.setZoom(16);
            setFollowCar(true);
          }
        },
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
