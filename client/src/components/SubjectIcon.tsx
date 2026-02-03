'use client'

import {
  Calculator,
  Beaker,
  Atom,
  Microscope,
  Zap,
  Dna,
  Wrench,
  BookOpen,
  type LucideIcon,
} from 'lucide-react'
import { getSubjectIcon } from '@/lib/subject-utils'

interface SubjectIconProps {
  subject?: string | null
  size?: number
  className?: string
}

// Map icon names to actual icon components
const iconMap: Record<string, LucideIcon> = {
  Calculator,
  Beaker,
  Atom,
  Microscope,
  Zap,
  Dna,
  Wrench,
  BookOpen,
}

export function SubjectIcon({ subject, size = 20, className = '' }: SubjectIconProps) {
  const iconName = getSubjectIcon(subject)
  const IconComponent = iconMap[iconName] || BookOpen

  return <IconComponent size={size} className={className} />
}
