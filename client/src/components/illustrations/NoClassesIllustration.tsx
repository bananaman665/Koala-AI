export function NoClassesIllustration() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* People group background */}
      <circle cx="40" cy="45" r="16" fill="#6366F1" opacity="0.15" />
      <circle cx="60" cy="35" r="14" fill="#0066FF" opacity="0.15" />
      <circle cx="80" cy="45" r="16" fill="#6366F1" opacity="0.15" />

      {/* People group middle */}
      <circle cx="40" cy="45" r="13" fill="#6366F1" opacity="0.25" />
      <circle cx="60" cy="35" r="11" fill="#0066FF" opacity="0.25" />
      <circle cx="80" cy="45" r="13" fill="#6366F1" opacity="0.25" />

      {/* Connection lines */}
      <line x1="52" y1="43" x2="68" y2="37" stroke="#0066FF" strokeWidth="1.5" opacity="0.3" />
      <line x1="68" y1="37" x2="80" y2="43" stroke="#0066FF" strokeWidth="1.5" opacity="0.3" />
      <line x1="40" y1="58" x2="60" y2="48" stroke="#0066FF" strokeWidth="1.5" opacity="0.3" />
      <line x1="60" y1="48" x2="80" y2="58" stroke="#0066FF" strokeWidth="1.5" opacity="0.3" />

      {/* Bodies */}
      <rect x="33" y="62" width="14" height="20" rx="3" fill="#6366F1" opacity="0.2" />
      <rect x="53" y="52" width="14" height="22" rx="3" fill="#0066FF" opacity="0.2" />
      <rect x="73" y="62" width="14" height="20" rx="3" fill="#6366F1" opacity="0.2" />

      {/* Plus icon */}
      <circle cx="60" cy="88" r="12" fill="#0066FF" />
      <line x1="60" y1="82" x2="60" y2="94" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="54" y1="88" x2="66" y2="88" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
