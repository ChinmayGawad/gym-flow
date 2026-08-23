import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Minus, Sliders, X } from 'lucide-react';

interface OccupancySimulatorControlProps {
  isAutoSimulating: boolean;
  capacity?: number;
  onToggleAutoSimulating: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetOccupants: (count: number) => void;
}

export const OccupancySimulatorControl: React.FC<OccupancySimulatorControlProps> = ({
  isAutoSimulating,
  capacity = 30,
  onToggleAutoSimulating,
  onIncrement,
  onDecrement,
  onSetOccupants,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const lowPreset = Math.max(1, Math.round(capacity * 0.25));
  const modPreset = Math.max(1, Math.round(capacity * 0.55));
  const highPreset = Math.max(1, Math.round(capacity * 0.85));

  return (
    <>
      {/* Floating Bottom-Right Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40">
        {!isOpen ? (
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-900 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 text-white text-xs font-bold shadow-card-hover backdrop-blur-md border border-white/10 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Open Live Gym Simulation Controls"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Simulate</span>
            {isAutoSimulating && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>
        ) : (
          /* Expanded Floating Simulator Control Card */
          <div className="w-[320px] sm:w-[350px] p-4 rounded-2xl bg-white/95 dark:bg-[#131418]/95 backdrop-blur-xl border border-black/[0.1] dark:border-white/[0.1] shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200">
                  <Sliders className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />
                </div>
                <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">
                  Live Gym Simulator
                </h4>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto Loop Status & Toggle */}
            <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Auto Live Loop:</span>
                <Badge
                  variant={isAutoSimulating ? 'low' : 'moderate'}
                  dot={isAutoSimulating}
                  className="text-[10px] px-2 py-0.5"
                >
                  {isAutoSimulating ? 'RUNNING' : 'PAUSED'}
                </Badge>
              </div>

              <Button
                onClick={onToggleAutoSimulating}
                size="sm"
                variant="outline"
                className="h-7 px-2.5 text-xs font-bold gap-1 rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              >
                {isAutoSimulating ? (
                  <>
                    <Pause className="w-3 h-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Start
                  </>
                )}
              </Button>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 mb-3">
              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 block">
                Crowd Density Presets:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => onSetOccupants(lowPreset)}
                  className="py-1.5 px-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 rounded-xl border border-emerald-200/70 dark:border-emerald-800/60 transition-colors text-center cursor-pointer"
                >
                  Low ({lowPreset})
                </button>
                <button
                  onClick={() => onSetOccupants(modPreset)}
                  className="py-1.5 px-2 text-xs font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200/80 dark:hover:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors text-center cursor-pointer"
                >
                  Mod ({modPreset})
                </button>
                <button
                  onClick={() => onSetOccupants(highPreset)}
                  className="py-1.5 px-2 text-xs font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100/80 dark:hover:bg-rose-900/50 rounded-xl border border-rose-200/70 dark:border-rose-800/60 transition-colors text-center cursor-pointer"
                >
                  High ({highPreset})
                </button>
              </div>
            </div>

            {/* Manual Step Increments */}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Manual Floor Ticks:
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={onDecrement}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-bold rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 gap-1"
                  title="Member Exit (-1)"
                >
                  <Minus className="w-3 h-3" />
                  Exit (-1)
                </Button>
                <Button
                  onClick={onIncrement}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2.5 text-xs font-bold rounded-lg border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 gap-1"
                  title="Member Entry (+1)"
                >
                  <Plus className="w-3 h-3" />
                  Entry (+1)
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
