import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Minus, Sliders } from 'lucide-react';

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
  const lowPreset = Math.max(1, Math.round(capacity * 0.25));
  const modPreset = Math.max(1, Math.round(capacity * 0.55));
  const highPreset = Math.max(1, Math.round(capacity * 0.85));

  return (
    <div className="mt-5 p-3.5 sm:p-4 rounded-2xl bg-white border border-black/[0.06] shadow-card flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-700 shrink-0">
          <Sliders className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-zinc-900">Live Simulator:</span>
        <Badge variant={isAutoSimulating ? 'low' : 'moderate'} dot={isAutoSimulating} className="font-semibold text-[10px] px-2 py-0.5">
          {isAutoSimulating ? 'AUTO LOOP' : 'PAUSED'}
        </Badge>
        <Button
          onClick={onToggleAutoSimulating}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1 rounded-lg"
        >
          {isAutoSimulating ? (
            <>
              <Pause className="w-3 h-3" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3 h-3" /> Resume
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end">
        <span className="text-[11px] font-semibold text-zinc-400 mr-1">Presets:</span>
        <div className="flex items-center gap-1 bg-zinc-100/80 p-0.5 rounded-xl border border-zinc-200/50">
          <button
            onClick={() => onSetOccupants(lowPreset)}
            className="px-2.5 py-1 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
          >
            Low ({lowPreset})
          </button>
          <button
            onClick={() => onSetOccupants(modPreset)}
            className="px-2.5 py-1 text-[10px] font-semibold text-zinc-700 hover:bg-zinc-200 rounded-lg transition-colors cursor-pointer"
          >
            Mod ({modPreset})
          </button>
          <button
            onClick={() => onSetOccupants(highPreset)}
            className="px-2.5 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            High ({highPreset})
          </button>
        </div>

        <div className="h-4 w-[1px] bg-zinc-200 mx-1 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Button
            onClick={onDecrement}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            title="Manual Exit (-1)"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            onClick={onIncrement}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-lg"
            title="Manual Check-In (+1)"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

