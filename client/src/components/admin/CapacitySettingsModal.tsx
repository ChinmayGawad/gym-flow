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
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border-[#dedede] rounded-2xl">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#eee] bg-[#fafafa]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gym-dark text-white flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-extrabold text-gym-dark">
                  Facility Capacity Manager
                </DialogTitle>
                <DialogDescription className="text-xs text-gym-subtle mt-0.5">
                  Set max concurrent members for {gymName}
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-[10px] font-bold gap-1 px-2 py-0.5">
              <ShieldCheck className="w-3 h-3 text-amber-700" />
              Gym Owner
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* Main Capacity Stepper */}
          <div className="space-y-3">
            <Label className="text-xs font-bold text-gym-dark flex items-center justify-between">
              <span>Concurrent Gym Capacity</span>
              <span className="text-[11px] font-normal text-gym-subtle">
                Baseline default: 30 people
              </span>
            </Label>

            <div className="flex items-center justify-between gap-3 p-3 bg-[#f8f8f8] rounded-xl border border-[#e5e5e5]">
              {/* Stepper Down */}
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAdjust(-10)}
                  disabled={capacity <= 10}
                  className="h-8 px-2 text-xs font-bold border-[#dedede] bg-white text-gym-dark hover:bg-[#eee]"
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
                  className="h-8 w-8 border-[#dedede] bg-white text-gym-dark hover:bg-[#eee]"
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
                  className="w-24 text-center text-2xl font-black h-10 border-none bg-transparent shadow-none focus-visible:ring-0 text-gym-dark p-0"
                />
                <span className="text-[10px] font-semibold text-gym-subtle uppercase tracking-wider -mt-1">
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
                  className="h-8 w-8 border-[#dedede] bg-white text-gym-dark hover:bg-[#eee]"
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
                  className="h-8 px-2 text-xs font-bold border-[#dedede] bg-white text-gym-dark hover:bg-[#eee]"
                  title="Increase by 10"
                >
                  +10
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Facility Presets */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-gym-dark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gym-subtle" />
              Quick Facility Presets:
            </Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_CAPACITIES.map((preset) => {
                const isSelected = capacity === preset.value;
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setCapacity(preset.value)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'border-gym-dark bg-gym-dark text-white shadow-sm'
                        : 'border-[#dedede] bg-white hover:border-[#bbb] text-gym-dark'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">{preset.value} People</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <span
                      className={`text-[10px] block mt-0.5 font-medium truncate ${
                        isSelected ? 'text-[#ddd]' : 'text-gym-subtle'
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
          <div className="p-3.5 bg-[#f9f9f9] rounded-xl border border-[#eaeaea] space-y-2">
            <span className="text-[11px] font-bold text-gym-dark flex items-center gap-1">
              <Info className="w-3 h-3 text-gym-subtle" />
              Dynamic Occupancy Thresholds for {capacity} Capacity:
            </span>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-green-50 border border-green-200">
                <span className="text-[10px] font-bold text-green-800 block uppercase">
                  Low (&lt;40%)
                </span>
                <span className="text-xs font-black text-green-900 mt-0.5 block">
                  0 – {lowMax}
                </span>
                <span className="text-[9px] text-green-700 block">0–5 min wait</span>
              </div>

              <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-800 block uppercase">
                  Mod (40-74%)
                </span>
                <span className="text-xs font-black text-slate-900 mt-0.5 block">
                  {modMin} – {modMax}
                </span>
                <span className="text-[9px] text-slate-700 block">10 min wait</span>
              </div>

              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                <span className="text-[10px] font-bold text-red-800 block uppercase">
                  High (≥75%)
                </span>
                <span className="text-xs font-black text-red-900 mt-0.5 block">
                  {highMin}+
                </span>
                <span className="text-[9px] text-red-700 block">15–25 min wait</span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="p-2.5 rounded-lg bg-green-50 text-green-800 text-xs font-semibold border border-green-200 text-center">
              {feedback}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs rounded-[9px] h-9 border-[#dedede]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="text-xs font-bold rounded-[9px] h-9 px-5 bg-gym-dark hover:bg-[#333] text-white gap-1.5"
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
