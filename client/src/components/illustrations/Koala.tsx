export function KoalaIllustration() {
  return (
    <svg
      viewBox="0 0 200 240"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      {/* Body */}
      <ellipse cx="100" cy="160" rx="45" ry="55" fill="#8B7D6B" />

      {/* Head */}
      <circle cx="100" cy="80" r="55" fill="#9B8D7E" />

      {/* Left Ear */}
      <circle cx="50" cy="35" r="25" fill="#9B8D7E" />
      <circle cx="50" cy="35" r="18" fill="#E8DCC8" />

      {/* Right Ear */}
      <circle cx="150" cy="35" r="25" fill="#9B8D7E" />
      <circle cx="150" cy="35" r="18" fill="#E8DCC8" />

      {/* Snout */}
      <circle cx="100" cy="95" r="35" fill="#E8DCC8" />

      {/* Left Eye */}
      <circle cx="75" cy="65" r="10" fill="#2C2C2C" />
      <circle cx="77" cy="62" r="3" fill="white" />

      {/* Right Eye */}
      <circle cx="125" cy="65" r="10" fill="#2C2C2C" />
      <circle cx="127" cy="62" r="3" fill="white" />

      {/* Nose */}
      <ellipse cx="100" cy="95" rx="6" ry="8" fill="#2C2C2C" />

      {/* Mouth */}
      <path d="M 100 95 Q 95 105 90 103" stroke="#2C2C2C" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 100 95 Q 105 105 110 103" stroke="#2C2C2C" strokeWidth="2" fill="none" strokeLinecap="round" />

      {/* Left Arm */}
      <ellipse cx="65" cy="150" rx="20" ry="40" fill="#8B7D6B" transform="rotate(-25 65 150)" />

      {/* Right Arm */}
      <ellipse cx="135" cy="150" rx="20" ry="40" fill="#8B7D6B" transform="rotate(25 135 150)" />

      {/* Left Foot */}
      <ellipse cx="75" cy="210" rx="22" ry="25" fill="#8B7D6B" />

      {/* Right Foot */}
      <ellipse cx="125" cy="210" rx="22" ry="25" fill="#8B7D6B" />
    </svg>
  )
}
