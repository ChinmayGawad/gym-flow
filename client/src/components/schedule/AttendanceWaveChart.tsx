import React, { useState, useRef } from 'react';
import { HourlyPrediction } from '@/types/occupancy';
import { Skeleton } from '@/components/ui/skeleton';

interface AttendanceWaveChartProps {
  data: HourlyPrediction[];
  capacity: number;
  activeFilter?: 'all' | 'morning' | 'afternoon' | 'evening';
  isLoading?: boolean;
}

export const AttendanceWaveChart: React.FC<AttendanceWaveChartProps> = ({
  data,
  capacity,
  isLoading = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (isLoading) {
    return (
      <div className="w-full h-[290px] flex items-end justify-between gap-2 px-8 pb-8 pt-4">
        {[40, 55, 70, 60, 45, 50, 65, 55, 40, 50, 75, 90, 95, 100, 80, 60, 35].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton
              className="w-full max-w-[24px] rounded-t-lg"
              style={{ height: `${h}%` }}
            />
            <Skeleton className="h-2.5 w-6 rounded-xs" />
          </div>
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }


  // Chart coordinate space
  const width = 850;
  const height = 290;
  const paddingLeft = 40;
  const paddingRight = 24;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute 4 Y-axis steps
  const maxBenchmark = Math.max(capacity, ...data.map((d) => d.peopleCount));
  const step = Math.ceil(maxBenchmark / 4);
  const yAxisTicks = [0, step, step * 2, step * 3, step * 4];
  const maxTick = step * 4;

  // Calculate bar width and spacing
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(26, Math.max(12, slotWidth * 0.52));

  // Compute bar dimensions
  const bars = data.map((item, index) => {
    const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
    const barHeight = Math.max(5, (item.peopleCount / maxTick) * chartHeight);
    const y = paddingTop + chartHeight - barHeight;
    const centerX = paddingLeft + index * slotWidth + slotWidth / 2;

    const isHigh = item.percentage >= 75;
    const isModerate = item.percentage >= 40 && item.percentage < 75;

    return {
      ...item,
      x,
      y,
      barHeight,
      centerX,
      index,
      isHigh,
      isModerate,
    };
  });

  const activeBar = hoveredIndex !== null ? bars[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[340px] transition-all"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Horizontal Dashed Gridlines & Y-Axis Labels */}
        {yAxisTicks.map((val) => {
          const yPos = paddingTop + chartHeight - (val / maxTick) * chartHeight;
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#f0f0f0"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text
                x={paddingLeft - 10}
                y={yPos + 3.5}
                fontSize="10"
                fontWeight="500"
                fill="#a1a1aa"
                textAnchor="end"
                className="tabular-nums"
                fontFamily="system-ui, sans-serif"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Baseline Floor Line */}
        <line
          x1={paddingLeft}
          y1={paddingTop + chartHeight}
          x2={width - paddingRight}
          y2={paddingTop + chartHeight}
          stroke="#e4e4e7"
          strokeWidth="1"
        />

        {/* Vertical Bar Columns */}
        {bars.map((bar) => {
          const isHovered = hoveredIndex === bar.index;
          const barFill = isHovered
            ? bar.isHigh
              ? '#e11d48'
              : bar.isModerate
              ? '#18181b'
              : '#059669'
            : bar.isHigh
            ? '#fb7185'
            : bar.isModerate
            ? '#52525b'
            : '#34d399';

          return (
            <g
              key={bar.id}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHoveredIndex(bar.index)}
            >
              {/* Invisible wider hit area */}
              <rect
                x={paddingLeft + bar.index * slotWidth}
                y={paddingTop}
                width={slotWidth}
                height={chartHeight}
                fill="transparent"
              />

              {/* Hover Column Background Guide */}
              {isHovered && (
                <rect
                  x={paddingLeft + bar.index * slotWidth + 2}
                  y={paddingTop}
                  width={slotWidth - 4}
                  height={chartHeight}
                  fill="#18181b"
                  opacity="0.04"
                  rx="6"
                />
              )}

              {/* Minimalist Vertical Bar */}
              <rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={bar.barHeight}
                rx="4"
                fill={barFill}
                className="transition-colors duration-150"
              />

              {/* X-Axis Time Label */}
              <text
                x={bar.centerX}
                y={height - 14}
                fontSize="10"
                fontWeight={isHovered ? '700' : '500'}
                fill={isHovered ? '#09090b' : '#71717a'}
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                className="transition-colors duration-150 tabular-nums"
              >
                {bar.time}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Modern Tooltip */}
      {activeBar && (
        <div
          className="absolute pointer-events-none transition-all duration-75 ease-out z-20"
          style={{
            left: `${(activeBar.centerX / width) * 100}%`,
            top: `${(activeBar.y / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
          }}
        >
          <div className="bg-zinc-900 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-card-hover border border-zinc-800 whitespace-nowrap flex items-center gap-2">
            <span className="text-zinc-400 font-medium">{activeBar.time}:</span>
            <span className="font-bold text-white tabular-nums">
              {activeBar.peopleCount} people
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                activeBar.percentage >= 75
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  : activeBar.percentage >= 40
                  ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
              }`}
            >
              {activeBar.percentage}%
            </span>
          </div>
          <div className="w-2 h-2 bg-zinc-900 rotate-45 mx-auto -mt-1 border-r border-b border-zinc-800" />
        </div>
      )}
    </div>
  );
};

