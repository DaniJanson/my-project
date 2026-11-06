'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import SearchComponent from '../components/SearchComponent';
import TurnByTurnBanner from '../components/TurnByTurnBanner';
import TeslaHeader from '../components/TeslaHeader';
import KeepAlive from '../components/KeepAlive';
import FavoritesModal from '../components/FavoritesModal';

// Dynamically import MapComponent to prevent SSR issues with Google Maps
const MapComponent = dynamic(() => import('../components/MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#0a0b0e] flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 border-4 border-tesla-accent/20 border-t-tesla-accent rounded-full animate-spin" />
      <span className="text-xs font-semibold text-tesla-muted tracking-wider uppercase">
        რუკის ინიციალიზაცია...
      </span>
    </div>
  ),
});

export default function HomePage() {
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#0a0b0e]">
      {/* Fullscreen Google Maps Canvas */}
      <MapComponent />

      {/* Tesla Top Status Header */}
      <TeslaHeader onOpenFavorites={() => setIsFavoritesOpen(true)} />

      {/* Turn By Turn Navigation HUD */}
      <TurnByTurnBanner />

      {/* Search & Waypoints Floating Drawer */}
      <SearchComponent />

      {/* Anti-Sleep Keep-Alive Engine */}
      <KeepAlive />

      {/* Saved Places & Supabase Auth Modal */}
      <FavoritesModal
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
      />
    </main>
  );
}
