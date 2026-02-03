// Emoji mapping for icons throughout the app
export const emojiIcons = {
  // UI & Navigation
  ArrowLeft: '←',
  ChevronDown: '▼',
  ChevronRight: '▶',
  ChevronLeft: '◀',
  Home: '🏠',
  Folder: '📁',
  Settings: '⚙️',
  Search: '🔍',
  Plus: '➕',
  X: '❌',
  Menu: '☰',

  // Media & Recording
  Mic: '🎤',
  Play: '▶️',
  Pause: '⏸',
  RotateCw: '🔄',
  Download: '⬇️',
  Upload: '⬆️',
  Share2: '📤',

  // Learning & Content
  BookOpen: '📚',
  FileText: '📄',
  MessageCircle: '💬',
  Mail: '📧',
  Layers: '📑',

  // Status & Feedback
  Check: '✅',
  CheckCircle: '✅',
  CheckSquare: '✅',
  Clock: '⏰',
  Calendar: '📅',
  Loader: '⏳',
  Heart: '❤️',
  Star: '⭐',

  // Utilities
  Eye: '👁️',
  EyeOff: '👁️‍🗨️',
  Lock: '🔒',
  Info: 'ℹ️',
  HelpCircle: '❓',
  AlertCircle: '⚠️',

  // Subjects & Education
  Calculator: '🧮',
  Atom: '⚛️',
  Beaker: '🧪',
  TestTube: '🧬',
  Microscope: '🔬',
  Dna: '🧬',
  Brain: '🧠',

  // Gamification & Progress
  Trophy: '🏆',
  Award: '🎖️',
  Crown: '👑',
  Gem: '💎',
  Flame: '🔥',
  Zap: '⚡',
  Target: '🎯',
  TrendingUp: '📈',

  // Social & Collaboration
  Users: '👥',
  User: '👤',
  Gift: '🎁',
  Sparkles: '✨',

  // Action & Activity
  Edit2: '✏️',
  Edit3: '✏️',
  Pencil: '✏️',
  Bookmark: '🔖',
  Video: '🎥',
  Lightbulb: '💡',
  Sprout: '🌱',
  Rocket: '🚀',
  BarChart2: '📊',
  Timer: '⏱️',
  Mic: '🎤',
  Loader2: '⏳',

  // Special
  Circle: '⭐',
  BookOpenmark: '📚',
}

export type IconName = keyof typeof emojiIcons

// Helper function to get emoji for an icon name
export const getEmoji = (iconName: IconName | string): string => {
  return emojiIcons[iconName as IconName] || '•'
}
