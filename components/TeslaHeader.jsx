'use client';

import React, { useState, useEffect } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useAuth } from '../context/AuthContext';
import { 
  Wifi, 
  MapPin, 
  Maximize, 
  Minimize, 
  Bookmark, 
  Radio, 
  Car,
  Clock
} from 'lucide-react';

export default function TeslaHeader({ onOpenFavorites }) {
  const { gpsActive, gpsAccuracy } = useNavigation();
  const { user, savedPlaces } = useAuth();

  const [currentTime, setCurrentTime] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
      <header className="bg-[#12141c]/90 backdrop-blur-xl border border-tesla-border/80 rounded-2xl px-5 py-2.5 shadow-2xl flex items-center gap-5 text-white">
        {/* Car / App Identity */}
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-tesla-accent" />
          <span className="text-xs font-black tracking-widest uppercase text-white">TESLA NAV</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 border-x border-tesla-border/60 px-4">
          <Clock className="w-3.5 h-3.5 text-tesla-muted" />
          <span>{currentTime || '12:00'}</span>
        </div>

        {/* GPS Live Status */}
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              gpsActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px] font-semibold text-tesla-muted">
            {gpsActive ? `GPS აქტიური (${gpsAccuracy ? Math.round(gpsAccuracy) + 'მ' : '±5მ'})` : 'GPS ძიება...'}
          </span>
        </div>

        {/* Saved Places Modal Trigger */}
        <button
          onClick={onOpenFavorites}
          className="flex items-center gap-1.5 py-1 px-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition active:scale-95"
          title="შენახული ადგილები"
        >
          <Bookmark className="w-3.5 h-3.5 text-tesla-accent" />
          <span>ადგილები ({savedPlaces.length})</span>
        </button>

        {/* Fullscreen for Tesla in-car browser */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 text-tesla-muted hover:text-white rounded-lg hover:bg-white/5 transition"
          title="სრული ეკრანი (Fullscreen)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </header>
    </div>
  );
}
