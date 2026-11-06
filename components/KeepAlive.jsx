'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { ShieldCheck, ShieldAlert, Zap } from 'lucide-react';

export default function KeepAlive() {
  const { keepAliveActive, toggleKeepAlive } = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const wakeLockRef = useRef(null);

  // 1. Silent Web Audio API Buffer Generator (Synthetic Fallback)
  const startWebAudioSilence = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        audioCtxRef.current = new AudioCtx();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create an oscillator connected to a gain node of 0.0001 (inaudible) to prevent sleep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.00001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
    } catch (e) {
      console.warn('Web Audio KeepAlive warning:', e);
    }
  }, []);

  // 2. HTML5 Silent Audio Loop
  const playAudio = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      audioRef.current.volume = 0.01; // Non-zero volume to satisfy Chromium media session
      await audioRef.current.play();
      setIsPlaying(true);
      startWebAudioSilence();
    } catch (err) {
      // Autoplay blocked: wait for first user touch/tap
      setIsPlaying(false);
    }
  }, [startWebAudioSilence]);

  // 3. Screen WakeLock API
  const requestWakeLock = useCallback(async () => {
    if (typeof window !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => {
          setWakeLockActive(false);
        });
      } catch (err) {
        console.warn('Wake Lock request warning:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (!keepAliveActive) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
      setIsPlaying(false);
      setWakeLockActive(false);
      return;
    }

    // Try starting right away
    playAudio();
    requestWakeLock();

    // Auto-unlock on first user interaction anywhere on the screen
    const handleFirstInteraction = () => {
      playAudio();
      requestWakeLock();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction, { passive: true });
    window.addEventListener('touchstart', handleFirstInteraction, { passive: true });

    // Handle tab visibility change (Tesla browser backgrounding)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && keepAliveActive) {
        playAudio();
        requestWakeLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (audioRef.current) audioRef.current.pause();
      if (wakeLockRef.current) wakeLockRef.current.release().catch(() => {});
    };
  }, [keepAliveActive, playAudio, requestWakeLock]);

  return (
    <>
      {/* Hidden audio element for browser media priority */}
      <audio
        ref={audioRef}
        src="/silent.wav"
        loop
        playsInline
        preload="auto"
        className="hidden"
      />

      {/* Tesla Status Pill (Top Right) */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <button
          onClick={toggleKeepAlive}
          onMouseEnter={() => setShowStatusTooltip(true)}
          onMouseLeave={() => setShowStatusTooltip(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl backdrop-blur-xl border text-xs font-semibold shadow-lg transition active:scale-95 ${
            keepAliveActive && (isPlaying || wakeLockActive)
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-400'
              : keepAliveActive
              ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
              : 'bg-black/60 border-tesla-border text-tesla-muted'
          }`}
          title="Tesla Keep-Alive Anti-Sleep"
        >
          <Zap className={`w-3.5 h-3.5 ${isPlaying ? 'fill-current animate-pulse' : ''}`} />
          <span className="hidden sm:inline">
            {keepAliveActive ? (isPlaying ? 'Keep-Alive: Active' : 'Keep-Alive: Ready') : 'Keep-Alive: Off'}
          </span>
        </button>

        {showStatusTooltip && (
          <div className="absolute right-0 top-12 w-64 bg-[#16181f] border border-tesla-border rounded-xl p-3 text-[11px] text-slate-300 shadow-2xl z-50">
            <p className="font-bold text-white mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anti-Sleep მექანიზმი</span>
            </p>
            <p className="leading-relaxed text-tesla-muted">
              უკრავს უხმო აუდიო ფონურ ნაკადს (Silent Loop), რათა Tesla-ს სისტემამ არ გათიშოს ტაბი RAM-ის დაზოგვისას.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
