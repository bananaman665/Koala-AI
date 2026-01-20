export function NoLecturesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Microphone pole */}
      <rect x="55" y="30" width="3" height="50" fill="#0066FF" opacity="0.2" rx="1.5" />

      {/* Microphone head - background */}
      <ellipse cx="56.5" cy="28" rx="10" ry="8" fill="#0066FF" opacity="0.1" />

      {/* Microphone head - middle */}
      <ellipse cx="56.5" cy="28" rx="8" ry="6" fill="#0066FF" opacity="0.2" />

      {/* Microphone head - front */}
      <ellipse cx="56.5" cy="28" rx="6" ry="4" fill="#0066FF" opacity="0.3" />

      {/* Sound waves */}
      <path
        d="M 45 50 Q 40 45 40 55 Q 40 65 45 60"
        stroke="#6366F1"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
      />
      <path
        d="M 68 50 Q 73 45 73 55 Q 73 65 68 60"
        stroke="#6366F1"
        strokeWidth="1.5"
        fill="none"
        opacity="0.2"
      />

      {/* Recording indicator */}
      <circle cx="56.5" cy="75" r="8" fill="#EC4899" opacity="0.2" />
      <circle cx="56.5" cy="75" r="6" fill="#EC4899" opacity="0.3" />
      <circle cx="56.5" cy="75" r="4" fill="#EC4899" opacity="0.4" />

      {/* Record button */}
      <circle cx="56.5" cy="90" r="12" fill="#0066FF" />
      <circle cx="56.5" cy="90" r="10" fill="#0052CC" />
      <circle cx="56.5" cy="90" r="5" fill="white" />
    </svg>
  )
}
