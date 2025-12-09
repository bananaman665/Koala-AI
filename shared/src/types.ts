// User Types
export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  updatedAt: Date;
  plan: 'free' | 'pro' | 'enterprise';
  usageQuota: {
    monthlyMinutes: number;
    usedMinutes: number;
  };
}

// Lecture Types
export interface Lecture {
  id: string;
  userId: string;
  title: string;
  courseCode?: string;
  professor?: string;
  recordedAt: Date;
  duration: number; // in seconds
  audioUrl: string;
  status: LectureStatus;
  transcriptId?: string;
  notesId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type LectureStatus = 
  | 'recording'
  | 'uploading'
  | 'uploaded'
  | 'transcribing'
  | 'generating_notes'
  | 'completed'
  | 'failed';

// Transcript Types
export interface Transcript {
  id: string;
  lectureId: string;
  userId: string;
  text: string;
  language: string;
  segments: TranscriptSegment[];
  wordCount: number;
  confidence?: number;
  createdAt: Date;
}

export interface TranscriptSegment {
  id: string;
  text: string;
  start: number; // timestamp in seconds
  end: number;
  speaker?: string;
  confidence?: number;
}

// Notes Types
export interface Notes {
  id: string;
  lectureId: string;
  userId: string;
  title: string;
  summary: string;
  keyPoints: string[];
  topics: Topic[];
  assignments: string[];
  vocabulary: VocabularyItem[];
  questions: string[];
  metadata: NotesMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface Topic {
  name: string;
  explanation: string;
  timestamp?: number;
  importance: 'high' | 'medium' | 'low';
  subtopics?: string[];
}

export interface VocabularyItem {
  term: string;
  definition: string;
  context?: string;
  timestamp?: number;
}

export interface NotesMetadata {
  style: 'detailed' | 'concise' | 'bullet';
  includeTimestamps: boolean;
  generatedBy: string; // AI model used
  processingTime: number; // in milliseconds
}

// MCP Server Types
export interface TranscribeRequest {
  audioUrl: string;
  language?: string;
  lectureId: string;
  userId: string;
}

export interface TranscribeResponse {
  lectureId: string;
  transcriptId: string;
  text: string;
  segments: TranscriptSegment[];
  language: string;
  duration: number;
}

export interface GenerateNotesRequest {
  transcript: string;
  lectureId: string;
  userId: string;
  options?: {
    style?: 'detailed' | 'concise' | 'bullet';
    includeTimestamps?: boolean;
    topics?: string[];
  };
}

export interface GenerateNotesResponse {
  lectureId: string;
  notesId: string;
  notes: Notes;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Recording Types
export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number;
  error?: string;
}

// Search Types
export interface SearchResult {
  lectureId: string;
  title: string;
  snippet: string;
  relevance: number;
  timestamp?: number;
  recordedAt: Date;
}

export interface SearchRequest {
  query: string;
  userId: string;
  filters?: {
    dateFrom?: Date;
    dateTo?: Date;
    courseCode?: string;
    tags?: string[];
  };
  limit?: number;
  offset?: number;
}
