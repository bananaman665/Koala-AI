// Emoji mapping using Unicode code points for native platform rendering
// These will display as native Apple emoji on iOS/Mac, Android emoji on Android, etc.
export const emojiIcons = {
  // UI & Navigation
  ArrowLeft: '\u2190',
  ChevronDown: '\u25BC',
  ChevronRight: '\u25B6',
  ChevronLeft: '\u25C0',
  Home: '\uD83C\uDFE0',
  Folder: '\uD83D\uDCC1',
  Settings: '\uD83D\uDD27',
  Search: '\uD83D\uDD0D',
  Plus: '\u2795',
  X: '\u274C',
  Menu: '\u2630',

  // Media & Recording
  Mic: '\uD83C\uDFA4',
  Play: '\u25B6\uFE0F',
  Pause: '\u23F8',
  RotateCw: '\uD83D\uDD04',
  Download: '\u2B07\uFE0F',
  Upload: '\u2B06\uFE0F',
  Share2: '\uD83D\uDCE4',

  // Learning & Content
  BookOpen: '\uD83D\uDCDA',
  FileText: '\uD83D\uDCC4',
  MessageCircle: '\uD83D\uDCAC',
  Mail: '\uD83D\uDCE7',
  Layers: '\uD83D\uDCD1',

  // Status & Feedback
  Check: '\u2705',
  CheckCircle: '\u2705',
  CheckSquare: '\u2705',
  Clock: '\uD83D\uDCC0',
  Calendar: '\uD83D\uDCC5',
  Loader: '\u23F3',
  Heart: '\u2764\uFE0F',
  Star: '\u2B50',

  // Utilities
  Eye: '\uD83D\uDC41\uFE0F',
  EyeOff: '\uD83D\uDC41\u200D\uD83D\uDDE8',
  Lock: '\uD83D\uDD12',
  Info: '\u2139\uFE0F',
  HelpCircle: '\u2753',
  AlertCircle: '\u26A0\uFE0F',

  // Subjects & Education
  Calculator: '\uD83D\uDDEE',
  Atom: '\u2697\uFE0F',
  Beaker: '\uD83D\uDEE1',
  TestTube: '\uD83D\uDEC7',
  Microscope: '\uD83D\uDD2C',
  Dna: '\uD83D\uDEC7',
  Brain: '\uD83D\uDEAD',

  // Gamification & Progress
  Trophy: '\uD83C\uDFC6',
  Award: '\uD83C\uDFC6',
  Crown: '\uD83D\uDC51',
  Gem: '\uD83D\uDC8E',
  Flame: '\uD83D\uDD25',
  Zap: '\u26A1',
  Target: '\uD83C\uDFAF',
  TrendingUp: '\uD83D\uDCC8',

  // Social & Collaboration
  Users: '\uD83D\uDC65',
  User: '\uD83D\uDC64',
  Gift: '\uD83C\uDF81',
  Sparkles: '\u2728',

  // Action & Activity
  Edit2: '\u270F\uFE0F',
  Edit3: '\u270F\uFE0F',
  Pencil: '\u270F\uFE0F',
  Bookmark: '\uD83D\uDCD6',
  Video: '\uD83C\uDFA5',
  Lightbulb: '\uD83D\uDCA1',
  Sprout: '\uD83C\uDF31',
  Rocket: '\uD83D\uDE80',
  BarChart2: '\uD83D\uDCCA',
  Timer: '\u23F1\uFE0F',
  Loader2: '\u23F3',

  // Special
  Circle: '\u2B50',
  BookOpenmark: '\uD83D\uDCDA',
}

export type IconName = keyof typeof emojiIcons

// Helper function to get emoji for an icon name
export const getEmoji = (iconName: IconName | string): string => {
  return emojiIcons[iconName as IconName] || '•'
}
