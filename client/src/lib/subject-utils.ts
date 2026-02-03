import { Calculator, Beaker, Atom, TestTube, Microscope, Dna, Zap, BookOpen } from 'lucide-react'

// Subject icon mapping
export const subjectIcons: Record<string, any> = {
  math: Calculator,
  science: Beaker,
  chemistry: TestTube,
  biology: Microscope,
  physics: Atom,
  genetics: Dna,
  engineering: Zap,
  literature: BookOpen,
  default: BookOpen,
}

// Subject color mapping
export const subjectColors: Record<string, { text: string; bg: string }> = {
  math: { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  science: { text: 'text-purple-600 dark:text-purple-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  chemistry: { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  biology: { text: 'text-green-600 dark:text-green-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  physics: { text: 'text-pink-600 dark:text-pink-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  genetics: { text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  engineering: { text: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  literature: { text: 'text-red-600 dark:text-red-400', bg: 'bg-gray-100 dark:bg-gray-700' },
  default: { text: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
}

export const getSubjectIcon = (subject?: string | null) => {
  if (!subject) return subjectIcons.default
  const iconComponent = subjectIcons[subject.toLowerCase()]
  return iconComponent || subjectIcons.default
}

export const getSubjectColor = (subject?: string | null) => {
  if (!subject) return subjectColors.default
  const colors = subjectColors[subject.toLowerCase()]
  return colors || subjectColors.default
}
