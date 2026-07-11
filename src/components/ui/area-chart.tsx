"use client";

interface AreaChartProps {
  data: { label: string; value: number }[];
  className?: string;
  color?: string;
  height?: number;
  showLabels?: boolean;
}

export function AreaChart({
  data,
  className,
  color = "#5e6ad2",
  height = 160,
  showLabels = true,
}: AreaChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-xs text-white/30 border border-dashed border-white/10 rounded-xl"
        style={{ height }}
      >
        No data yet
      </div>
    );
  }

  const values = data.map((d) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values);
  const range = max - min || 1;
  const width = 100;
  const padX = 2;
  const chartWidth = width - padX * 2;
  const stepX = chartWidth / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = padX + i * stepX;
    const y = height - ((d.value - min) / range) * (height - 24) - 12;
    return { x, y, label: d.label, value: d.value };
  });

  const areaPath = [
    `M ${points[0].x} ${height}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height}`,
    "Z",
  ].join(" ");

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#areaGradient)" />
        <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2" fill={color} />
        ))}
      </svg>
      {showLabels && (
        <div className="flex justify-between mt-2 text-[10px] text-white/30 px-1">
          {data.slice(0, Math.min(data.length, 6)).map((d, i) => (
            <span key={i}>{d.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
