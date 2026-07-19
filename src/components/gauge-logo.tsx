export default function GaugeLogo({ className = "", size = 32 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon outline */}
      <path
        d="M50 5 L93 27.5 L93 72.5 L50 95 L7 72.5 L7 27.5 Z"
        fill="white"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Organic blobs */}
      <circle cx="38" cy="38" r="11" fill="currentColor" />
      <circle cx="60" cy="30" r="7.5" fill="currentColor" />
      <circle cx="70" cy="50" r="6" fill="currentColor" />
      <ellipse cx="50" cy="55" rx="10" ry="8" fill="currentColor" />
      <circle cx="33" cy="58" r="7" fill="currentColor" />
      <circle cx="42" cy="72" r="8" fill="currentColor" />
      <circle cx="60" cy="70" r="5.5" fill="currentColor" />
      <circle cx="50" cy="38" r="4.5" fill="currentColor" />
      <circle cx="27" cy="42" r="5" fill="currentColor" />
      <circle cx="66" cy="40" r="3.5" fill="currentColor" />
      <ellipse cx="30" cy="68" rx="4" ry="3.5" fill="currentColor" />
      <circle cx="55" cy="82" r="4" fill="currentColor" />
    </svg>
  );
}
