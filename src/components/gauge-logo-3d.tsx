"use client";

/**
 * Pure-CSS 3D Gauge logo loader — enlarged hexagonal "coin" that spins on its
 * Y-axis (weightless float) and sits centered on the app's charcoal surface.
 * No WebGL / Three.js deps — builds instantly anywhere.
 */

const BLOBS: [string, string, string][] = [
  ["-32%", "28%", "34px"],
  ["26%", "40%", "26px"],
  ["38%", "-6%", "24px"],
  ["0%", "-4%", "38px"],
  ["-36%", "-22%", "28px"],
  ["8%", "-40%", "32px"],
  ["36%", "-36%", "24px"],
  ["0%", "32%", "20px"],
];

function Face({
  rotateY,
  translateZ,
}: {
  rotateY: string;
  translateZ: string;
}) {
  return (
    <div
      className="absolute inset-0 rounded-[14px] bg-[#16161b] border border-white/5"
      style={{
        transform: `rotateY(${rotateY}) translateZ(${translateZ})`,
        backfaceVisibility: "hidden",
      }}
    />
  );
}

export default function GaugeLogo3D({ size = 300 }: { size?: number }) {
  // 6 prism side faces
  const sides = Array.from({ length: 6 }, (_, i) => i * 60);

  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
        perspective: "1000px",
      }}
    >
      <div className="gauge-spin w-full h-full relative" style={{ transformStyle: "preserve-3d" }}>
        {/* Front + back faces */}
        <Face rotateY="0deg" translateZ="26px" />
        <Face rotateY="180deg" translateZ="26px" />

        {/* 6 side faces forming the hexagonal prism edge */}
        {sides.map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-1/2 bg-[#1c1c22] border-x border-white/5"
            style={{
              width: `${size / 3}px`,
              height: `${size - 52}px`,
              transform: `translate(-50%, -50%) rotateY(${deg}deg) translateZ(${size / 2 - 8}px)`,
              backfaceVisibility: "hidden",
            }}
          />
        ))}

        {/* Interior brand blobs on the front face */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{ transform: "translate(-50%, -50%) translateZ(27px)" }}
        >
          {BLOBS.map(([x, y, d], i) => (
            <span
              key={i}
              className="absolute rounded-full bg-[#0c0c10]"
              style={{
                width: d,
                height: d,
                left: x,
                top: y,
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
          {/* brand-tinted ring */}
          <span
            className="absolute rounded-full border-2 border-[#F26522]/40"
            style={{
              width: size * 0.9,
              height: size * 0.9,
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .gauge-spin {
          animation: gauge-rotate 6s linear infinite, gauge-float 3s ease-in-out infinite;
        }
        @keyframes gauge-rotate {
          from {
            transform: rotateX(12deg) rotateY(0deg);
          }
          to {
            transform: rotateX(12deg) rotateY(360deg);
          }
        }
        @keyframes gauge-float {
          0%,
          100% {
            margin-top: -10px;
          }
          50% {
            margin-top: 10px;
          }
        }
      `}</style>
    </div>
  );
}
