
// Subject icon mapping - maps subjects to lucide-react icon names
export const subjectIcons: Record<string, string> = {
  math: 'Calculator',
  science: 'Beaker',
  chemistry: 'Atom',
  biology: 'Microscope',
  physics: 'Zap',
  genetics: 'Dna',
  engineering: 'Wrench',
  literature: 'BookOpen',
  default: 'BookOpen',
}

// Subject color mapping
export const subjectColors: Record<string, { text: string; bg: string }> = {
  math: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  science: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  chemistry: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  biology: { text: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  physics: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  genetics: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  engineering: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  literature: { text: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' },
  default: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
}

export const getSubjectIcon = (subject?: string | null): string => {
  if (!subject) return subjectIcons.default
  const iconName = subjectIcons[subject.toLowerCase()]
  return iconName || subjectIcons.default
}

export const getSubjectColor = (subject?: string | null) => {
  if (!subject) return subjectColors.default
  const colors = subjectColors[subject.toLowerCase()]
  return colors || subjectColors.default
}
