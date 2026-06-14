interface UsageDisplayProps {
  used: number;
  limit: number | "unlimited";
  label: string;
  unit: string;
}

export default function UsageDisplay({ used, limit, label, unit }: UsageDisplayProps) {
  if (limit === "unlimited") {
    return (
      <div>
        <div className="flex justify-between text-xs text-white/40 mb-2">
          <span>{label}</span>
          <span>{used} {unit} / Unlimited</span>
        </div>
      </div>
    );
  }

  const pct = (used / limit) * 100;
  const barColor =
    pct > 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-linear-indigo";
  const textColor =
    pct > 100 ? "text-red-400" : pct >= 80 ? "text-amber-400" : "text-white/40";

  return (
    <div>
      <div className="flex justify-between text-xs mb-2">
        <span className="text-white/40">{label}</span>
        <span className={textColor}>
          {used} / {limit} {unit}
        </span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-300`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}
