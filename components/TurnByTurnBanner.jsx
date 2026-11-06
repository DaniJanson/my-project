'use client';

import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { 
  ArrowUpRight, 
  ArrowUpLeft, 
  ArrowUp, 
  CornerUpRight, 
  CornerUpLeft, 
  RotateCcw, 
  Flag,
  X,
  Compass
} from 'lucide-react';

export default function TurnByTurnBanner() {
  const { isNavigating, routeStats, destination, stopNavigation, clearNavigation } = useNavigation();

  if (!isNavigating || !routeStats || !destination) {
    return null;
  }

  const currentStep = routeStats.steps?.[0];
  const nextInstruction = currentStep?.instructions?.replace(/<[^>]+>/g, '') || `იმოძრავეთ ${destination.name}-ისკენ`;
  const stepDistance = currentStep?.distance?.text || '100 მ';

  // Determine turn icon
  const instructionLower = (nextInstruction || '').toLowerCase();
  let TurnIcon = ArrowUp;
  if (instructionLower.includes('მარჯვნივ') || instructionLower.includes('right')) {
    TurnIcon = CornerUpRight;
  } else if (instructionLower.includes('მარცხნივ') || instructionLower.includes('left')) {
    TurnIcon = CornerUpLeft;
  } else if (instructionLower.includes('წრიული') || instructionLower.includes('roundabout') || instructionLower.includes('მოტრიალება')) {
    TurnIcon = RotateCcw;
  }

  // Calculate arrival time
  const arrivalDate = new Date(Date.now() + (parseInt(routeStats.durationInTraffic) || 20) * 60 * 1000);
  const arrivalTimeStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-4 select-none">
      <div className="bg-[#12141c]/95 backdrop-blur-2xl border-2 border-tesla-accent/80 rounded-2xl shadow-2xl p-4 flex items-center justify-between text-white">
        {/* Turn Direction Icon */}
        <div className="w-14 h-14 rounded-2xl bg-tesla-accent flex items-center justify-center flex-shrink-0 shadow-lg shadow-tesla-accent/40 mr-4">
          <TurnIcon className="w-8 h-8 text-white stroke-[2.5]" />
        </div>

        {/* Turn Instructions */}
        <div className="flex-1 overflow-hidden mr-4">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-white">{stepDistance}</span>
            <span className="text-xs text-tesla-muted uppercase font-bold tracking-wider">შემდეგ მანევრამდე</span>
          </div>
          <p className="text-sm font-semibold text-slate-200 truncate mt-0.5 leading-snug">
            {nextInstruction}
          </p>
        </div>

        {/* ETA & End Button */}
        <div className="flex items-center gap-3 border-l border-tesla-border/80 pl-4 flex-shrink-0">
          <div className="text-right">
            <p className="text-base font-extrabold text-emerald-400">{arrivalTimeStr}</p>
            <p className="text-[11px] text-tesla-muted font-medium">{routeStats.durationInTraffic} • {routeStats.distance}</p>
          </div>

          <button
            onClick={stopNavigation}
            className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 flex items-center justify-center transition active:scale-95"
            title="ნავიგაციის დასრულება"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
