export function NoCoursesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Book stack - background layer */}
      <rect x="20" y="50" width="70" height="45" rx="6" fill="#0066FF" opacity="0.1" />

      {/* Book stack - middle layer */}
      <rect x="25" y="45" width="70" height="45" rx="6" fill="#0066FF" opacity="0.15" />

      {/* Book stack - front layer */}
      <rect x="30" y="40" width="70" height="45" rx="6" fill="#0066FF" opacity="0.2" />

      {/* Plus icon */}
      <circle cx="85" cy="30" r="18" fill="#0066FF" opacity="0.3" />
      <line x1="85" y1="22" x2="85" y2="38" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="77" y1="30" x2="93" y2="30" stroke="#0066FF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}
