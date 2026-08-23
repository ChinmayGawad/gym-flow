import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Plus,
  Minus,
  Check,
  ShieldCheck,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';

interface CapacitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCapacity: number;
  onSaveCapacity: (newCapacity: number) => Promise<void> | void;
  gymName?: string;
}

const PRESET_CAPACITIES = [
  { label: 'Compact / Standard', value: 30, desc: 'Boutique fitness & studio' },
  { label: 'Medium Gym', value: 60, desc: 'Standard commercial floor' },
  { label: 'Large Facility', value: 100, desc: 'Multi-floor fitness center' },
  { label: 'Flagship Gym', value: 150, desc: 'High-traffic premier club' },
  { label: 'Mega Center', value: 300, desc: 'Enterprise arena & sports hub' },
];

export const CapacitySettingsModal: React.FC<CapacitySettingsModalProps> = ({
  isOpen,
  onClose,
  currentCapacity,
  onSaveCapacity,
  gymName = 'GymFlow Fitness',
}) => {
  const [capacity, setCapacity] = useState<number>(currentCapacity || 30);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCapacity(currentCapacity || 30);
      setFeedback(null);
    }
  }, [isOpen, currentCapacity]);

  const handleAdjust = (delta: number) => {
    setCapacity((prev) => Math.max(10, Math.min(2000, prev + delta)));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveCapacity(capacity);
      setFeedback(`Capacity updated to ${capacity} occupants!`);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch {
      setFeedback('Failed to update capacity.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate live threshold breakdown
  const lowMax = Math.max(1, Math.floor(capacity * 0.39));
  const modMin = Math.ceil(capacity * 0.4);
  const modMax = Math.floor(capacity * 0.74);
  const highMin = Math.ceil(capacity * 0.75);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white dark:bg-[#131418] border border-black/[0.08] dark:border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-zinc-900 dark:text-white tracking-tight">
                  Facility Capacity Scale
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">
                  Set max concurrent members for {gymName}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60 text-[10px] font-bold gap-1 px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 text-amber-700 dark:text-amber-400" />
              Owner
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {/* Main Capacity Stepper */}
          <div className="space-y-2.5">
            <Label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center justify-between">
              <span>Concurrent Facility Capacity</span>
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 normal-case">
                Default: 30 people
              </span>
            </Label>

            <div className="flex items-center justify-between gap-3 p-3 bg-zinc-50/80 dark:bg-zinc-900/80 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              {/* Stepper Down */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdjust(-10)}
                  disabled={capacity <= 10}
                  className="h-8 px-2 text-xs font-bold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"
                  title="Decrease by 10"
                >
                  -10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAdjust(-1)}
                  disabled={capacity <= 10}
                  className="h-8 w-8 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"
                  title="Decrease by 1"
                >
                  <Minus className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Number Input / Display */}
              <div className="flex flex-col items-center">
                <Input
                  type="number"
                  min={10}
                  max={2000}
                  value={capacity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val)) setCapacity(Math.max(10, Math.min(2000, val)));
                  }}
                  className="w-24 text-center text-3xl font-black h-10 border-none bg-transparent shadow-none focus-visible:ring-0 text-zinc-900 dark:text-white p-0 tabular-nums"
                />
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest -mt-1">
                  People Max
                </span>
              </div>

              {/* Stepper Up */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleAdjust(1)}
                  disabled={capacity >= 2000}
                  className="h-8 w-8 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"
                  title="Increase by 1"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdjust(10)}
                  disabled={capacity >= 2000}
                  className="h-8 px-2 text-xs font-bold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-xl"
                  title="Increase by 10"
                >
                  +10
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Facility Presets */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              Quick Presets:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_CAPACITIES.map((preset) => {
                const isSelected = capacity === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCapacity(preset.value)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-xs'
                        : 'border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-900 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold tabular-nums">{preset.value} People</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white dark:text-zinc-900" />}
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 font-medium truncate ${
                        isSelected ? 'text-zinc-300 dark:text-zinc-700' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {preset.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Threshold Brackets Preview */}
          <div className="p-3.5 bg-zinc-50/70 dark:bg-zinc-900/60 rounded-xl border border-zinc-200/60 dark:border-zinc-800 space-y-2">
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
              Thresholds for {capacity} capacity:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">
                  Low (&lt;40%)
                </span>
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 mt-0.5 block tabular-nums">
                  0 – {lowMax}
                </span>
                <span className="text-[9px] text-emerald-700 dark:text-emerald-400 block">0–5 min wait</span>
              </div>

              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700">
                <span className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 block uppercase">
                  Mod (40-74%)
                </span>
                <span className="text-xs font-black text-zinc-950 dark:text-zinc-100 mt-0.5 block tabular-nums">
                  {modMin} – {modMax}
                </span>
                <span className="text-[9px] text-zinc-600 dark:text-zinc-400 block">10 min wait</span>
              </div>

              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-800/60">
                <span className="text-[10px] font-bold text-rose-800 dark:text-rose-300 block uppercase">
                  High (≥75%)
                </span>
                <span className="text-xs font-black text-rose-950 dark:text-rose-100 mt-0.5 block tabular-nums">
                  {highMin}+
                </span>
                <span className="text-[9px] text-rose-700 dark:text-rose-400 block">15–25 min wait</span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50 text-center">
              {feedback}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs rounded-xl h-9 px-4 border-zinc-200 dark:border-zinc-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs font-bold rounded-xl h-9 px-5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 gap-1.5 shadow-xs"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Save Capacity
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
