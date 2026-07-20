export default function GaugeLogo({
  className = "",
  size = 40,
  dark = false,
}: {
  className?: string;
  size?: number;
  dark?: boolean;
}) {
  return (
    <img
      src="/gauge-logo.png"
      alt="Gauge"
      width={size}
      height={size}
      className={`object-contain ${dark ? "invert" : ""} ${className}`}
      draggable={false}
    />
  );
}
