import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Plus, Minus, RotateCcw } from 'lucide-react';

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
    <div className="mt-5 p-4 rounded-xl bg-white border border-[#dedede] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-2">
        <span className="font-bold text-gym-dark">Simulation Mode:</span>
        <Badge variant={isAutoSimulating ? 'low' : 'moderate'} className="font-semibold text-[10px]">
          {isAutoSimulating ? 'ACTIVE (5s Interval)' : 'PAUSED'}
        </Badge>
        <Button
          onClick={onToggleAutoSimulating}
          variant="outline"
          size="sm"
          className="h-7 px-2.5 text-[11px] gap-1"
        >
          {isAutoSimulating ? (
            <>
              <Pause className="w-3 h-3" /> Pause Loop
            </>
          ) : (
            <>
              <Play className="w-3 h-3" /> Resume Loop
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
        <span className="font-bold text-gym-dark mr-1">Test Presets:</span>
        <Button
          onClick={() => onSetOccupants(lowPreset)}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px] text-[#277a3e] border-[#c2e4c8] hover:bg-[#e5f4e8]"
        >
          Low ({lowPreset})
        </Button>
        <Button
          onClick={() => onSetOccupants(modPreset)}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px] text-[#555] border-[#dedede] hover:bg-[#eeeeee]"
        >
          Mod ({modPreset})
        </Button>
        <Button
          onClick={() => onSetOccupants(highPreset)}
          variant="outline"
          size="sm"
          className="h-7 px-2 text-[10px] text-[#9b3131] border-[#f0c4c4] hover:bg-[#f7e4e4]"
        >
          High ({highPreset})
        </Button>

        <div className="h-4 w-[1px] bg-[#dedede] mx-1 hidden sm:block" />

        <div className="flex items-center gap-1">
          <Button
            onClick={onDecrement}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            title="Manual Check-Out (-1)"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Button
            onClick={onIncrement}
            variant="outline"
            size="icon"
            className="h-7 w-7 rounded-md"
            title="Manual Check-In (+1)"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
