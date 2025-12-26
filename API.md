# Koala.ai API Documentation

## Base URL

```
Development: http://localhost:3001
Production: https://your-api-domain.com
```

## Authentication

All protected endpoints require a user ID to be passed in the request headers:

```http
X-User-ID: <user-uuid>
```

The user ID is obtained from Supabase Auth on the client side. The backend trusts this header as database-level security is enforced through Supabase Row Level Security (RLS) policies.

## Response Format

All API responses follow a consistent structure:

### Success Response

```typescript
{
  "success": true,
  "data": any,           // Response payload
  "timestamp": string    // ISO 8601 timestamp
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "code": string,      // Machine-readable error code
    "message": string    // Human-readable error message
  },
  "timestamp": string    // ISO 8601 timestamp
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `MISSING_FILE` | No audio file provided | 400 |
| `INVALID_FORMAT` | Invalid audio format | 400 |
| `FILE_TOO_LARGE` | File exceeds size limit | 400 |
| `TRANSCRIPTION_FAILED` | Transcription process failed | 500 |
| `NOTES_GENERATION_FAILED` | Note generation failed | 500 |
| `LECTURE_NOT_FOUND` | Lecture ID not found | 404 |
| `GET_LECTURE_FAILED` | Failed to retrieve lecture | 500 |
| `SEARCH_FAILED` | Search query failed | 500 |
| `UNAUTHORIZED` | Missing or invalid user ID | 401 |
| `FORBIDDEN` | User lacks permission | 403 |
| `INVALID_REQUEST` | Invalid request parameters | 400 |
| `CLASS_NOT_FOUND` | Class not found | 404 |
| `ALREADY_MEMBER` | User already member of class | 409 |
| `FETCH_CLASSES_FAILED` | Failed to fetch classes | 500 |
| `CREATE_CLASS_FAILED` | Failed to create class | 500 |
| `JOIN_CLASS_FAILED` | Failed to join class | 500 |
| `LEAVE_CLASS_FAILED` | Failed to leave class | 500 |
| `FETCH_LECTURES_FAILED` | Failed to fetch lectures | 500 |
| `ADD_MEMBER_FAILED` | Failed to add member | 500 |
| `REMOVE_MEMBER_FAILED` | Failed to remove member | 500 |

---

## Endpoints

### Health Check

#### `GET /health`

Check server health status.

**Authentication:** Not required

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "version": "0.1.0"
}
```

---

## Transcription & Notes

### Transcribe Audio

#### `POST /api/transcribe`

Upload an audio file, transcribe it using Groq Whisper, and save the transcript.

**Authentication:** Required (via `userId` in body)

**Content-Type:** `multipart/form-data`

**Request Body:**
```typescript
{
  audio: File,              // Audio file (MP3, WAV, MP4, M4A, WebM)
  userId: string,           // UUID of the user
  lectureId: string,        // UUID of the lecture
  language?: string         // Language code (optional, auto-detect if omitted)
}
```

**File Constraints:**
- Maximum size: 25 MB (configurable via `MAX_AUDIO_FILE_SIZE`)
- Supported formats: MP3, WAV, MP4, M4A, WebM

**Response:**
```json
{
  "success": true,
  "data": {
    "lectureId": "uuid",
    "transcriptId": "uuid",
    "audioUrl": "https://...",
    "text": "Full transcript text...",
    "segments": [
      {
        "id": "seg-0",
        "text": "Segment text...",
        "start": 0.0,
        "end": 5.2,
        "confidence": 0.95
      }
    ],
    "language": "en",
    "duration": 300
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Missing file, invalid format, or file too large
- `500` - Transcription failed

**Example:**
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'lecture.mp3');
formData.append('userId', '123e4567-e89b-12d3-a456-426614174000');
formData.append('lectureId', '123e4567-e89b-12d3-a456-426614174001');
formData.append('language', 'en');

const response = await fetch('http://localhost:3001/api/transcribe', {
  method: 'POST',
  body: formData,
});
```

---

### Generate Notes

#### `POST /api/generate-notes`

Generate structured study notes from a transcript using Groq Llama 3.1.

**Authentication:** Required (via `userId` in body)

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  lectureId: string,        // UUID of the lecture
  userId: string,           // UUID of the user
  transcript: string,       // Full transcript text
  options?: {
    style?: "detailed" | "concise" | "outline",
    includeTimestamps?: boolean
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "lectureId": "uuid",
    "notesId": "uuid",
    "notes": {
      "title": "Lecture Title",
      "summary": "Brief summary...",
      "mainTopics": [
        {
          "topic": "Topic 1",
          "subtopics": ["Subtopic 1", "Subtopic 2"],
          "keyPoints": ["Point 1", "Point 2"]
        }
      ],
      "keyTerms": [
        {
          "term": "Term 1",
          "definition": "Definition..."
        }
      ],
      "metadata": {
        "style": "detailed",
        "includeTimestamps": false,
        "generatedBy": "groq/llama-3.1-70b-versatile",
        "processingTime": 3500
      }
    }
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `500` - Notes generation failed (AI service error, parsing error, etc.)

**Example:**
```javascript
const response = await fetch('http://localhost:3001/api/generate-notes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    lectureId: '123e4567-e89b-12d3-a456-426614174001',
    userId: '123e4567-e89b-12d3-a456-426614174000',
    transcript: 'Today we will discuss quantum mechanics...',
    options: {
      style: 'detailed',
      includeTimestamps: false
    }
  }),
});
```

---

### Get Lecture

#### `GET /api/lectures/:id`

Retrieve a lecture with its transcript and notes.

**Authentication:** Not required (RLS enforced at database level)

**URL Parameters:**
- `id` - Lecture UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "lecture": {
      "id": "uuid",
      "course_id": "uuid",
      "user_id": "uuid",
      "title": "Lecture Title",
      "date": "2025-01-15",
      "audio_url": "https://...",
      "duration": 3600,
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:30:00.000Z"
    },
    "transcript": {
      "id": "uuid",
      "lecture_id": "uuid",
      "user_id": "uuid",
      "content": "...",
      "status": "completed",
      "created_at": "2025-01-15T10:15:00.000Z"
    },
    "notes": {
      "id": "uuid",
      "lecture_id": "uuid",
      "user_id": "uuid",
      "content": {...},
      "created_at": "2025-01-15T10:30:00.000Z"
    }
  },
  "timestamp": "2025-01-15T10:35:00.000Z"
}
```

**Error Responses:**
- `404` - Lecture not found
- `500` - Database error

---

### Search Transcripts

#### `POST /api/search`

Search through user's transcripts with optional filters.

**Authentication:** Required (via `userId` in body)

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  userId: string,           // UUID of the user
  query: string,            // Search query
  filters?: {
    courseId?: string,      // Filter by course
    dateFrom?: string,      // ISO date
    dateTo?: string,        // ISO date
    hasNotes?: boolean      // Only lectures with notes
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "query": "quantum mechanics",
    "results": [
      {
        "lecture_id": "uuid",
        "title": "Quantum Mechanics 101",
        "date": "2025-01-15",
        "transcript_excerpt": "...quantum mechanics...",
        "relevance_score": 0.95
      }
    ],
    "count": 1
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `500` - Search failed

---

## Class Management

### Get User's Classes

#### `GET /api/classes`

Retrieve all classes owned by or enrolled by the user.

**Authentication:** Required (via `X-User-ID` header)

**Headers:**
```http
X-User-ID: <user-uuid>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "owner_id": "uuid",
      "name": "Introduction to Computer Science",
      "code": "CS101",
      "professor": "Dr. Smith",
      "description": "Fundamentals of programming...",
      "color": "blue",
      "created_at": "2025-01-01T00:00:00.000Z",
      "class_memberships": [
        {
          "user_id": "uuid",
          "role": "student"
        }
      ]
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `500` - Database error

---

### Create Class

#### `POST /api/classes`

Create a new class.

**Authentication:** Required (via `X-User-ID` header)

**Headers:**
```http
X-User-ID: <user-uuid>
```

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  name: string,              // Class name (required)
  code: string,              // Class code, e.g., "CS101" (required)
  professor: string,         // Professor name (required)
  description?: string,      // Class description
  color?: string            // Color theme (default: "blue")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Introduction to Computer Science",
    "code": "CS101",
    "professor": "Dr. Smith",
    "description": "Fundamentals of programming...",
    "color": "blue",
    "created_at": "2025-01-15T10:30:00.000Z"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `500` - Database error

---

### Search Class by Code

#### `GET /api/classes/search?code=<code>`

Search for a class by its unique code.

**Authentication:** Not required

**Query Parameters:**
- `code` - Class code (case-insensitive)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "owner_id": "uuid",
    "name": "Introduction to Computer Science",
    "code": "CS101",
    "professor": "Dr. Smith",
    "description": "Fundamentals of programming...",
    "color": "blue",
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `400` - Missing or invalid class code
- `404` - Class not found
- `500` - Database error

**Example:**
```javascript
const response = await fetch('http://localhost:3001/api/classes/search?code=CS101');
```

---

### Join Class

#### `POST /api/classes/:classId/join`

Join an existing class as a student.

**Authentication:** Required (via `X-User-ID` header)

**Headers:**
```http
X-User-ID: <user-uuid>
```

**URL Parameters:**
- `classId` - Class UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "class_id": "uuid",
    "user_id": "uuid",
    "role": "student",
    "joined_at": "2025-01-15T10:30:00.000Z"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `409` - Already a member of this class
- `500` - Database error

---

### Leave Class

#### `DELETE /api/classes/:classId/leave`

Leave a class you're a member of.

**Authentication:** Required (via `X-User-ID` header)

**Headers:**
```http
X-User-ID: <user-uuid>
```

**URL Parameters:**
- `classId` - Class UUID

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Left class successfully"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `500` - Database error

---

### Get Class Lectures

#### `GET /api/classes/:classId/lectures`

Get all lectures for a specific class.

**Authentication:** Not required (RLS enforced at database level)

**URL Parameters:**
- `classId` - Class UUID

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "class_id": "uuid",
      "user_id": "uuid",
      "title": "Lecture 1: Introduction",
      "date": "2025-01-15",
      "audio_url": "https://...",
      "duration": 3600,
      "created_at": "2025-01-15T10:00:00.000Z",
      "courses": {
        "name": "Computer Science 101",
        "code": "CS101",
        "color": "blue"
      },
      "transcripts": [
        { "id": "uuid" }
      ],
      "notes": [
        { "id": "uuid" }
      ]
    }
  ],
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `500` - Database error

---

### Add Member to Class

#### `POST /api/classes/:classId/members`

Add a member to a class (owner only).

**Authentication:** Required (via `X-User-ID` header)

**Authorization:** Class owner only

**Headers:**
```http
X-User-ID: <user-uuid>
```

**URL Parameters:**
- `classId` - Class UUID

**Content-Type:** `application/json`

**Request Body:**
```typescript
{
  memberId: string,          // UUID of user to add
  role?: "student" | "ta"   // Role (default: "student")
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "class_id": "uuid",
    "user_id": "uuid",
    "role": "student",
    "joined_at": "2025-01-15T10:30:00.000Z"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `403` - Not the class owner
- `409` - User already a member
- `500` - Database error

---

### Remove Member from Class

#### `DELETE /api/classes/:classId/members/:memberId`

Remove a member from a class (owner only).

**Authentication:** Required (via `X-User-ID` header)

**Authorization:** Class owner only

**Headers:**
```http
X-User-ID: <user-uuid>
```

**URL Parameters:**
- `classId` - Class UUID
- `memberId` - UUID of user to remove

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Member removed successfully"
  },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

**Error Responses:**
- `401` - Missing user ID
- `403` - Not the class owner
- `500` - Database error

---

## Rate Limits

Currently, there are no rate limits implemented. This should be added before production deployment.

**Recommended limits:**
- Transcription: 10 requests/minute per user
- Notes generation: 20 requests/minute per user
- Search: 60 requests/minute per user
- Other endpoints: 100 requests/minute per user

---

## CORS

The API accepts requests from:
- Development: `http://localhost:3000`
- Production: Configurable via `CORS_ORIGIN` environment variable

Credentials are supported for cookie-based authentication (if implemented).

---

## File Upload Limits

| Endpoint | Max File Size | Supported Formats |
|----------|---------------|-------------------|
| `/api/transcribe` | 25 MB | MP3, WAV, MP4, M4A, WebM |

---

## AI Service Details

### Transcription (Groq Whisper)

- **Model:** `whisper-large-v3`
- **Provider:** Groq
- **Language:** Auto-detect or specified
- **Output:** JSON with timestamps and segments

### Note Generation (Groq Llama)

- **Model:** `llama-3.1-70b-versatile`
- **Provider:** Groq
- **Temperature:** 0.7
- **Max Tokens:** 4000
- **Output:** Structured JSON with topics, summaries, and key terms

---

## Database Schema Reference

### Lectures Table

```sql
lectures (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  user_id UUID REFERENCES users(id),
  title TEXT,
  date DATE,
  audio_url TEXT,
  duration INTEGER,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Transcripts Table

```sql
transcripts (
  id UUID PRIMARY KEY,
  lecture_id UUID REFERENCES lectures(id),
  user_id UUID REFERENCES users(id),
  content TEXT,
  status VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Classes Table

```sql
classes (
  id UUID PRIMARY KEY,
  owner_id UUID REFERENCES users(id),
  name TEXT,
  code TEXT UNIQUE,
  professor TEXT,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Class Memberships Table

```sql
class_memberships (
  id UUID PRIMARY KEY,
  class_id UUID REFERENCES classes(id),
  user_id UUID REFERENCES users(id),
  role VARCHAR,
  joined_at TIMESTAMP,
  UNIQUE(class_id, user_id)
)
```

---

## WebSocket Support (Future)

Currently, all operations are synchronous HTTP requests. Future versions may support WebSocket connections for:
- Real-time transcription progress
- Collaborative note-taking
- Live lecture features

---

## Versioning

Current API version: **v1** (implicit, no version prefix)

Future versions will use URL prefix: `/api/v2/...`

---

## Support & Issues

For API issues or questions:
- GitHub Issues: https://github.com/your-username/koala-ai/issues
- Documentation: See ARCHITECTURE.md for system design details
