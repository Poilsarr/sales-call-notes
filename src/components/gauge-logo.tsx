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
      src={dark ? "/gauge-logo-white.png" : "/gauge-logo.png"}
      alt="Gauge"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      draggable={false}
    />
  );
}
