'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  savedPlaces: [],
  recentRoutes: [],
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  addSavedPlace: async () => {},
  deleteSavedPlace: async () => {},
  saveRecentRoute: async () => {},
  refreshSavedPlaces: async () => {},
});

const DEFAULT_SAMPLE_PLACES = [
  {
    id: 'default-home',
    name: 'სახლი (Home)',
    category: 'home',
    address: 'Rustaveli Avenue, Tbilisi',
    lat: 41.6979,
    lng: 44.7993,
    icon: 'home',
  },
  {
    id: 'default-work',
    name: 'სამსახური (Office)',
    category: 'work',
    address: 'Vake Park, Chavchavadze Ave, Tbilisi',
    lat: 41.7107,
    lng: 44.7578,
    icon: 'briefcase',
  },
  {
    id: 'default-charger',
    name: 'Tesla Supercharger',
    category: 'favorite',
    address: 'Tbilisi Mall Supercharger',
    lat: 41.8025,
    lng: 44.7725,
    icon: 'zap',
  },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [recentRoutes, setRecentRoutes] = useState([]);

  // Load local saved places fallback
  const loadLocalPlaces = () => {
    try {
      const stored = localStorage.getItem('tesla_saved_places');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return DEFAULT_SAMPLE_PLACES;
  };

  const saveLocalPlaces = (places) => {
    try {
      localStorage.setItem('tesla_saved_places', JSON.stringify(places));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  const loadLocalRecentRoutes = () => {
    try {
      const stored = localStorage.getItem('tesla_recent_routes');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return [];
  };

  const saveLocalRecentRoutes = (routes) => {
    try {
      localStorage.setItem('tesla_recent_routes', JSON.stringify(routes.slice(0, 10)));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  };

  // Fetch saved places from Supabase or fallback
  const fetchSavedPlaces = async (currentUser) => {
    if (!currentUser) {
      setSavedPlaces(loadLocalPlaces());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_places')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        setSavedPlaces(data);
      } else {
        // If Supabase has no places yet, seed with defaults or local
        const local = loadLocalPlaces();
        setSavedPlaces(local);
      }
    } catch (err) {
      console.warn('Supabase fetch places error (fallback to local):', err?.message);
      setSavedPlaces(loadLocalPlaces());
    }
  };

  const fetchRecentRoutes = async (currentUser) => {
    if (!currentUser) {
      setRecentRoutes(loadLocalRecentRoutes());
      return;
    }

    try {
      const { data, error } = await supabase
        .from('recent_routes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      if (data) setRecentRoutes(data);
    } catch (err) {
      console.warn('Supabase fetch recent routes error (fallback):', err?.message);
      setRecentRoutes(loadLocalRecentRoutes());
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (mounted) {
          if (!error && initialSession) {
            setSession(initialSession);
            setUser(initialSession.user);
            await fetchSavedPlaces(initialSession.user);
            await fetchRecentRoutes(initialSession.user);
          } else {
            setSavedPlaces(loadLocalPlaces());
            setRecentRoutes(loadLocalRecentRoutes());
          }
        }
      } catch (err) {
        console.warn('Supabase session init warning:', err?.message);
        if (mounted) {
          setSavedPlaces(loadLocalPlaces());
          setRecentRoutes(loadLocalRecentRoutes());
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    let subscription;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user || null);
        await fetchSavedPlaces(newSession?.user);
        await fetchRecentRoutes(newSession?.user);
      });
      subscription = data?.subscription;
    } catch (err) {
      console.warn('Auth state change listener error:', err?.message);
    }

    return () => {
      mounted = false;
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setUser(null);
    setSession(null);
    setSavedPlaces(loadLocalPlaces());
    setRecentRoutes(loadLocalRecentRoutes());
  };

  const addSavedPlace = async (place) => {
    const newPlace = {
      name: place.name || 'ახალი ადგილი',
      category: place.category || 'favorite',
      address: place.address || '',
      lat: Number(place.lat),
      lng: Number(place.lng),
      place_id: place.place_id || null,
      icon: place.icon || (place.category === 'home' ? 'home' : place.category === 'work' ? 'briefcase' : 'star'),
    };

    if (user) {
      try {
        const { data, error } = await supabase
          .from('saved_places')
          .insert([{ ...newPlace, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        setSavedPlaces((prev) => [data, ...prev]);
        return data;
      } catch (err) {
        console.warn('Supabase save error, falling back to local:', err?.message);
      }
    }

    // Local fallback
    const localPlace = {
      ...newPlace,
      id: 'local-' + Date.now(),
      created_at: new Date().toISOString(),
    };
    const updated = [localPlace, ...savedPlaces];
    setSavedPlaces(updated);
    saveLocalPlaces(updated);
    return localPlace;
  };

  const deleteSavedPlace = async (id) => {
    if (user && !id.startsWith('local-') && !id.startsWith('default-')) {
      try {
        const { error } = await supabase.from('saved_places').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.warn('Supabase delete error:', err?.message);
      }
    }

    const updated = savedPlaces.filter((p) => p.id !== id);
    setSavedPlaces(updated);
    saveLocalPlaces(updated);
  };

  const saveRecentRoute = async (route) => {
    const newRoute = {
      origin_name: route.originName || 'მიმდინარე ლოკაცია',
      origin_lat: route.originLat || 0,
      origin_lng: route.originLng || 0,
      destination_name: route.destinationName,
      destination_lat: route.destinationLat,
      destination_lng: route.destinationLng,
      waypoints: route.waypoints || [],
      created_at: new Date().toISOString(),
    };

    if (user) {
      try {
        await supabase.from('recent_routes').insert([{ ...newRoute, user_id: user.id }]);
      } catch (err) {
        console.warn('Supabase recent route error:', err?.message);
      }
    }

    const updated = [newRoute, ...recentRoutes.filter((r) => r.destination_name !== route.destinationName)].slice(0, 10);
    setRecentRoutes(updated);
    saveLocalRecentRoutes(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        savedPlaces,
        recentRoutes,
        signIn,
        signUp,
        signOut,
        addSavedPlace,
        deleteSavedPlace,
        saveRecentRoute,
        refreshSavedPlaces: () => fetchSavedPlaces(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
