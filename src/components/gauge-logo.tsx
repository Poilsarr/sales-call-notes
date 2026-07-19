import Image from "next/image";

export default function GaugeLogo({
  className = "",
  size = 32,
  dark = false,
}: {
  className?: string;
  size?: number;
  dark?: boolean;
}) {
  return (
    <Image
      src="/gauge-logo.png"
      alt="Gauge"
      width={size}
      height={size}
      className={`object-contain ${dark ? "mix-blend-multiply" : ""} ${className}`}
      draggable={false}
      style={{ width: size, height: size }}
    />
  );
}
