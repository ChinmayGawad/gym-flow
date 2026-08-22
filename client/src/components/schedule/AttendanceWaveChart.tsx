import React, { useState, useRef } from 'react';
import { HourlyPrediction } from '@/types/occupancy';

interface AttendanceWaveChartProps {
  data: HourlyPrediction[];
  capacity: number;
  activeFilter: 'all' | 'morning' | 'afternoon' | 'evening';
}

export const AttendanceWaveChart: React.FC<AttendanceWaveChartProps> = ({
  data,
  capacity,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return null;
  }

  // Chart coordinate space
  const width = 850;
  const height = 300;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Compute 4 Y-axis steps (e.g. 0, 10, 20, 30 for capacity 30)
  const maxBenchmark = Math.max(capacity, ...data.map((d) => d.peopleCount));
  const step = Math.ceil(maxBenchmark / 4);
  const yAxisTicks = [0, step, step * 2, step * 3, step * 4];
  const maxTick = step * 4;

  // Calculate bar width and spacing
  const slotWidth = chartWidth / data.length;
  const barWidth = Math.min(28, Math.max(12, slotWidth * 0.55));

  // Compute bar dimensions
  const bars = data.map((item, index) => {
    const x = paddingLeft + index * slotWidth + (slotWidth - barWidth) / 2;
    const barHeight = Math.max(4, (item.peopleCount / maxTick) * chartHeight);
    const y = paddingTop + chartHeight - barHeight;
    const centerX = paddingLeft + index * slotWidth + slotWidth / 2;

    return {
      ...item,
      x,
      y,
      barHeight,
      centerX,
      index,
    };
  });

  const activeBar = hoveredIndex !== null ? bars[hoveredIndex] : null;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto max-h-[360px] transition-all"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {/* Horizontal Dashed Gridlines & Y-Axis Labels */}
        {yAxisTicks.map((val) => {
          const yPos = paddingTop + chartHeight - (val / maxTick) * chartHeight;
          return (
            <g key={val}>
              {/* Dashed Gridline */}
              <line
                x1={paddingLeft}
                y1={yPos}
                x2={width - paddingRight}
                y2={yPos}
                stroke="#e8e8e8"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              {/* Y-Axis Tick Number */}
              <text
                x={paddingLeft - 12}
                y={yPos + 3.5}
                fontSize="11"
                fontWeight="500"
                fill="#888888"
                textAnchor="end"
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
          stroke="#dedede"
          strokeWidth="1"
        />

        {/* Vertical Bar Columns */}
        {bars.map((bar) => {
          const isHovered = hoveredIndex === bar.index;

          return (
            <g
              key={bar.id}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredIndex(bar.index)}
            >
              {/* Invisible wider hit area for easy hover/tap */}
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
                  fill="#0d9488"
                  opacity="0.06"
                  rx="4"
                />
              )}

              {/* Teal/Emerald Vertical Bar Column */}
              <rect
                x={bar.x}
                y={bar.y}
                width={barWidth}
                height={bar.barHeight}
                rx="3.5"
                fill={isHovered ? '#00796b' : '#009688'}
                className="transition-colors duration-150"
              />

              {/* X-Axis Time Label */}
              <text
                x={bar.centerX}
                y={height - 15}
                fontSize="10.5"
                fontWeight={isHovered ? '700' : '500'}
                fill={isHovered ? '#171717' : '#777777'}
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                className="transition-colors duration-150"
              >
                {bar.time}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {activeBar && (
        <div
          className="absolute pointer-events-none transition-all duration-100 ease-out z-20"
          style={{
            left: `${(activeBar.centerX / width) * 100}%`,
            top: `${(activeBar.y / height) * 100}%`,
            transform: 'translate(-50%, -125%)',
          }}
        >
          <div className="bg-[#171717] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xl border border-[#333333] whitespace-nowrap flex items-center gap-1.5">
            <span className="text-[#999999] font-medium">{activeBar.time}:</span>
            <span className="font-extrabold text-white">
              {activeBar.peopleCount} people
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                activeBar.percentage >= 75
                  ? 'bg-red-900 text-red-200'
                  : activeBar.percentage >= 40
                  ? 'bg-amber-900 text-amber-200'
                  : 'bg-emerald-900 text-emerald-200'
              }`}
            >
              {activeBar.percentage}%
            </span>
          </div>
          <div className="w-2 h-2 bg-[#171717] rotate-45 mx-auto -mt-1 border-r border-b border-[#333333]" />
        </div>
      )}
    </div>
  );
};
