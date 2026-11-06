'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  MapPin, 
  Plus, 
  X, 
  Navigation, 
  Clock, 
  Route as RouteIcon, 
  Home, 
  Briefcase, 
  Zap, 
  Star,
  ChevronDown,
  ChevronUp,
  AlertTriangle
} from 'lucide-react';

export default function SearchComponent() {
  const {
    destination,
    waypoints,
    isNavigating,
    routeStats,
    setDestination,
    addWaypoint,
    removeWaypoint,
    clearNavigation,
    startNavigation,
    stopNavigation,
  } = useNavigation();

  const { savedPlaces, saveRecentRoute } = useAuth();

  const [inputQuery, setInputQuery] = useState(destination?.name || '');
  const [predictions, setPredictions] = useState([]);
  const [activeInputType, setActiveInputType] = useState('destination'); // 'destination' or 'waypoint'
  const [showWaypointsInput, setShowWaypointsInput] = useState(false);
  const [waypointQuery, setWaypointQuery] = useState('');
  const [waypointPredictions, setWaypointPredictions] = useState([]);
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);

  // Sync input value if destination was restored via URL/Storage
  useEffect(() => {
    if (destination?.name) {
      setInputQuery(destination.name);
    } else {
      setInputQuery('');
    }
  }, [destination]);

  // Initialize Places Autocomplete Service when Google API is available
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      // Dummy element for PlacesService if needed
      const dummyElem = document.createElement('div');
      placesServiceRef.current = new window.google.maps.places.PlacesService(dummyElem);
    }
  }, []);

  // Handle Autocomplete Search for Destination
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setInputQuery(val);

    if (!val.trim()) {
      setPredictions([]);
      return;
    }

    if (autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: val,
          componentRestrictions: { country: 'ge' }, // Default country Georgia, can be global
        },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
          } else {
            setPredictions([]);
          }
        }
      );
    } else {
      // Mock suggestions if Google API key is pending
      setPredictions([
        {
          place_id: 'mock-1',
          description: `${val} - რუსთაველის გამზირი, თბილისი`,
          structured_formatting: { main_text: val, secondary_text: 'თბილისი, საქართველო' },
        },
        {
          place_id: 'mock-2',
          description: `${val} - ჭავჭავაძის გამზირი, ვაკე`,
          structured_formatting: { main_text: val + ' (ვაკე)', secondary_text: 'თბილისი, საქართველო' },
        },
        {
          place_id: 'mock-3',
          description: `${val} - აღმაშენებლის ხეივანი`,
          structured_formatting: { main_text: val + ' (დიღომი)', secondary_text: 'თბილისი, საქართველო' },
        },
      ]);
    }
  };

  // Handle Autocomplete Search for Waypoint
  const handleWaypointSearchChange = (e) => {
    const val = e.target.value;
    setWaypointQuery(val);

    if (!val.trim()) {
      setWaypointPredictions([]);
      return;
    }

    if (autocompleteServiceRef.current) {
      autocompleteServiceRef.current.getPlacePredictions(
        { input: val },
        (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            setWaypointPredictions(results);
          }
        }
      );
    }
  };

  // Select a destination place
  const selectDestinationPlace = (place) => {
    setInputQuery(place.structured_formatting?.main_text || place.description);
    setPredictions([]);

    if (placesServiceRef.current && place.place_id && !place.place_id.startsWith('mock-')) {
      placesServiceRef.current.getDetails(
        { placeId: place.place_id, fields: ['geometry', 'formatted_address', 'name'] },
        (details, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details?.geometry?.location) {
            const destObj = {
              name: details.name || place.description,
              address: details.formatted_address,
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
              place_id: place.place_id,
            };
            setDestination(destObj);
            saveRecentRoute({
              destinationName: destObj.name,
              destinationLat: destObj.lat,
              destinationLng: destObj.lng,
            });
          }
        }
      );
    } else {
      // Demo / fallback coordinates (Tbilisi center offset)
      const mockLat = 41.7151 + (Math.random() - 0.5) * 0.05;
      const mockLng = 44.8271 + (Math.random() - 0.5) * 0.05;
      const destObj = {
        name: place.structured_formatting?.main_text || place.description,
        address: place.description,
        lat: mockLat,
        lng: mockLng,
        place_id: place.place_id,
      };
      setDestination(destObj);
    }
  };

  // Select a waypoint place
  const selectWaypointPlace = (place) => {
    setWaypointQuery('');
    setWaypointPredictions([]);
    setShowWaypointsInput(false);

    if (placesServiceRef.current && place.place_id && !place.place_id.startsWith('mock-')) {
      placesServiceRef.current.getDetails(
        { placeId: place.place_id, fields: ['geometry', 'name'] },
        (details, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details?.geometry?.location) {
            addWaypoint({
              name: details.name || place.description,
              lat: details.geometry.location.lat(),
              lng: details.geometry.location.lng(),
              place_id: place.place_id,
            });
          }
        }
      );
    } else {
      addWaypoint({
        name: place.description,
        lat: 41.72 + (Math.random() - 0.5) * 0.03,
        lng: 44.78 + (Math.random() - 0.5) * 0.03,
      });
    }
  };

  // Quick favorite select
  const handleQuickSelect = (place) => {
    setInputQuery(place.name);
    setDestination({
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      place_id: place.place_id,
    });
    setPredictions([]);
  };

  return (
    <div
      className={`absolute left-6 top-6 z-30 transition-all duration-300 ${
        isPanelCollapsed ? 'w-auto' : 'w-[420px]'
      }`}
    >
      <div className="bg-[#16181f]/95 backdrop-blur-xl border border-tesla-border rounded-2xl shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Panel Header */}
        <div className="px-5 py-3.5 border-b border-tesla-border/80 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-tesla-accent/20 flex items-center justify-center text-tesla-accent font-bold">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-none">Tesla Navigation</h1>
              <p className="text-[11px] text-tesla-muted">Live Traffic & Anti-Sleep</p>
            </div>
          </div>

          <button
            onClick={() => setIsPanelCollapsed((prev) => !prev)}
            className="p-1.5 text-tesla-muted hover:text-white rounded-lg hover:bg-white/5 transition"
            title={isPanelCollapsed ? 'გაშლა' : 'ჩაკეცვა'}
          >
            {isPanelCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>

        {/* Collapsed State Summary Pill */}
        {isPanelCollapsed ? (
          <div className="p-3 flex items-center gap-3">
            <button
              onClick={() => setIsPanelCollapsed(false)}
              className="flex items-center gap-2 px-3 py-2 bg-tesla-accent text-white rounded-xl text-xs font-semibold"
            >
              <Search className="w-4 h-4" />
              <span>{destination ? destination.name : 'ძიება'}</span>
            </button>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {/* 1. Destination Input */}
            <div className="relative">
              <div className="flex items-center bg-[#0a0b0e] border border-tesla-border rounded-xl px-3.5 py-2.5 focus-within:border-tesla-accent transition">
                <Search className="w-5 h-5 text-tesla-muted mr-3 flex-shrink-0" />
                <input
                  type="text"
                  value={inputQuery}
                  onChange={handleSearchChange}
                  placeholder="სად მიდიხართ? (დანიშნულება)..."
                  className="w-full bg-transparent text-sm text-white placeholder-tesla-muted focus:outline-none"
                />
                {inputQuery && (
                  <button
                    onClick={() => {
                      setInputQuery('');
                      setPredictions([]);
                      clearNavigation();
                    }}
                    className="p-1 text-tesla-muted hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {predictions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1c24] border border-tesla-border rounded-xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-tesla-border/40">
                  {predictions.map((p, idx) => (
                    <button
                      key={p.place_id || idx}
                      onClick={() => selectDestinationPlace(p)}
                      className="w-full px-4 py-3 text-left hover:bg-white/10 flex items-start gap-3 transition"
                    >
                      <MapPin className="w-4 h-4 text-tesla-accent mt-0.5 flex-shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-semibold text-white truncate">
                          {p.structured_formatting?.main_text || p.description}
                        </p>
                        <p className="text-[11px] text-tesla-muted truncate">
                          {p.structured_formatting?.secondary_text || p.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. Waypoints List (Intermediate Stops) */}
            {waypoints.length > 0 && (
              <div className="space-y-1.5 pl-2 border-l-2 border-tesla-accent/50 my-2">
                <p className="text-[11px] font-semibold text-tesla-muted uppercase tracking-wider">შუალედური გაჩერებები</p>
                {waypoints.map((wp, i) => (
                  <div key={wp.id || i} className="flex items-center justify-between bg-black/40 px-3 py-2 rounded-lg text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-4 h-4 rounded-full bg-tesla-accent/30 text-tesla-accent text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-slate-200 truncate">{wp.name}</span>
                    </div>
                    <button
                      onClick={() => removeWaypoint(i)}
                      className="p-1 text-slate-400 hover:text-red-400 transition"
                      title="გაჩერების წაშლა"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Waypoint Add Input */}
            {showWaypointsInput ? (
              <div className="relative">
                <div className="flex items-center bg-[#0a0b0e] border border-tesla-accent/50 rounded-xl px-3 py-2">
                  <Plus className="w-4 h-4 text-tesla-accent mr-2" />
                  <input
                    type="text"
                    value={waypointQuery}
                    onChange={handleWaypointSearchChange}
                    placeholder="გაჩერების დამატება (მაგ. Supercharger)..."
                    className="w-full bg-transparent text-xs text-white placeholder-tesla-muted focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setShowWaypointsInput(false);
                      setWaypointPredictions([]);
                    }}
                    className="p-1 text-tesla-muted hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {waypointPredictions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1c24] border border-tesla-border rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-tesla-border/40">
                    {waypointPredictions.map((wp, idx) => (
                      <button
                        key={wp.place_id || idx}
                        onClick={() => selectWaypointPlace(wp)}
                        className="w-full px-3 py-2.5 text-left hover:bg-white/10 flex items-center gap-2.5 transition text-xs"
                      >
                        <MapPin className="w-3.5 h-3.5 text-tesla-accent flex-shrink-0" />
                        <span className="truncate">{wp.description}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              destination && (
                <button
                  onClick={() => setShowWaypointsInput(true)}
                  className="w-full py-2 px-3 border border-dashed border-tesla-border/80 hover:border-tesla-accent/60 rounded-xl text-xs text-tesla-muted hover:text-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5 text-tesla-accent" />
                  <span>გაჩერების დამატება (Stop / Waypoint)</span>
                </button>
              )
            )}

            {/* 3. Quick Tap Favorites (Home, Work, Supercharger) */}
            {!destination && (
              <div>
                <p className="text-[11px] font-semibold text-tesla-muted uppercase tracking-wider mb-2">სწრაფი წვდომა</p>
                <div className="grid grid-cols-3 gap-2">
                  {savedPlaces.slice(0, 3).map((place) => {
                    const IconComp = place.category === 'home' ? Home : place.category === 'work' ? Briefcase : Zap;
                    return (
                      <button
                        key={place.id}
                        onClick={() => handleQuickSelect(place)}
                        className="p-2.5 bg-black/40 hover:bg-white/5 border border-tesla-border/70 rounded-xl flex flex-col items-center gap-1 text-center transition active:scale-95"
                      >
                        <IconComp className="w-4 h-4 text-tesla-accent" />
                        <span className="text-[11px] font-medium text-slate-200 truncate w-full">
                          {place.name.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Active Route Information & Live Traffic Summary */}
            {destination && routeStats && (
              <div className="bg-black/40 border border-tesla-border/70 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-black text-white">{routeStats.durationInTraffic}</span>
                    <span className="text-xs text-tesla-muted ml-2">({routeStats.distance})</span>
                  </div>
                  <div
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                      routeStats.delayMinutes > 10
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : routeStats.delayMinutes > 3
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{routeStats.congestion}</span>
                  </div>
                </div>

                {routeStats.delayMinutes > 0 && (
                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>საცობის გამო დაგვიანება: +{routeStats.delayMinutes} წთ</span>
                  </p>
                )}

                {/* Big Action Buttons */}
                <div className="flex gap-2 pt-1">
                  {!isNavigating ? (
                    <button
                      onClick={startNavigation}
                      className="flex-1 py-3 px-4 bg-tesla-accent hover:bg-blue-600 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-tesla-accent/30 transition"
                    >
                      <Navigation className="w-4 h-4 fill-current" />
                      <span>ნავიგაციის დაწყება</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopNavigation}
                      className="flex-1 py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <span>ნავიგაციის შეჩერება</span>
                    </button>
                  )}

                  <button
                    onClick={clearNavigation}
                    className="py-3 px-3 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition"
                    title="გასუფთავება"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
