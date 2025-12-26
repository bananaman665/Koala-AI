# Koala.ai Architecture Documentation

## Overview

Koala.ai is an AI-powered lecture transcription and note-taking application designed to help students record lectures, automatically transcribe audio, and generate structured study notes. The application is built as a full-stack TypeScript monorepo with mobile support.

## Tech Stack

### Frontend (Client)
- **Framework**: Next.js 14.2 with App Router
- **UI Library**: React 18.3
- **Language**: TypeScript 5.4 (strict mode)
- **Styling**: Tailwind CSS 3.4
- **State Management**:
  - React Context API (Auth, Theme)
  - Zustand 4.5 (Global state)
- **Mobile**: Capacitor 7 (iOS/Android deployment)
- **Authentication**: Supabase Auth
- **HTTP Client**: Fetch API with custom hooks

### Backend (MCP Server)
- **Runtime**: Node.js with Express.js 4.19
- **Language**: TypeScript 5.4 (strict mode)
- **AI Services**:
  - Groq (Whisper for transcription, Llama 3.1 for notes)
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Validation**: Zod 3.23
- **Logging**: Winston 3.13
- **File Upload**: Multer 1.4

### Database
- **Provider**: Supabase (PostgreSQL)
- **Features**:
  - Row Level Security (RLS) policies
  - Database triggers for automatic timestamps
  - Foreign key constraints
  - Indexed queries for performance

## Project Structure

```
Koala.ai/
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/           # Next.js 14 app router pages
│   │   │   ├── dashboard/ # Main dashboard (needs refactoring)
│   │   │   ├── login/     # Authentication pages
│   │   │   └── ...
│   │   ├── components/    # React components
│   │   │   ├── AudioPlayer.tsx
│   │   │   ├── LevelBadge.tsx
│   │   │   ├── AchievementBadge.tsx
│   │   │   └── ...
│   │   ├── contexts/      # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   │   ├── useAI.ts
│   │   │   ├── useLevel.ts
│   │   │   └── useLectureRecording.ts
│   │   ├── lib/           # Utility libraries
│   │   │   └── supabase.ts
│   │   └── store/         # Zustand stores
│   ├── android/           # Capacitor Android project
│   ├── ios/               # Capacitor iOS project
│   └── public/            # Static assets
│
├── mcp-server/            # Express.js backend API
│   ├── src/
│   │   ├── index.ts       # Main server & route handlers
│   │   ├── services/      # Business logic layer
│   │   │   ├── groq.ts    # AI transcription & note generation
│   │   │   ├── supabase.ts # Database & storage operations
│   │   │   └── database.ts # Database query helpers
│   │   ├── types/         # TypeScript type definitions
│   │   │   └── index.ts
│   │   └── utils/         # Shared utilities
│   │       ├── logger.ts
│   │       └── validators.ts
│   └── uploads/           # Temporary file storage
│
├── shared/                # Shared code between client & server
│   └── types/            # Shared TypeScript types
│
└── docs/                  # Documentation
    ├── SETUP.md
    ├── GROQ_SETUP.md
    ├── SUPABASE_DATABASE_SETUP.sql
    └── ...
```

## Architecture Patterns

### 1. Monorepo Structure
The project uses npm workspaces to manage three packages:
- `client`: Frontend application
- `mcp-server`: Backend API server
- `shared`: Shared TypeScript types and utilities

**Benefits**:
- Code sharing between frontend and backend
- Single dependency installation
- Unified TypeScript configuration
- Easier refactoring across packages

### 2. Service Layer Pattern
The backend uses a service layer to separate business logic from HTTP handlers:

```
HTTP Request → Route Handler → Service Layer → Database/External API
```

**Services**:
- `GroqService`: AI transcription and note generation
- `SupabaseService`: Database CRUD operations and file storage
- `DatabaseService`: Query building and data access

### 3. Context + Custom Hooks (Frontend)
State management follows React best practices:

- **Context API**: Cross-cutting concerns (auth, theme)
- **Custom Hooks**: Encapsulate complex logic and side effects
- **Zustand**: Performance-critical global state

### 4. Type Safety
- Zod schemas validate runtime data (API requests/responses)
- TypeScript provides compile-time type checking
- Shared types ensure frontend/backend consistency

## Data Flow

### Lecture Recording & Transcription Flow

```
1. User Records Audio
   └─> useLectureRecording hook
       └─> Capacitor Voice Recorder (mobile) OR MediaRecorder (web)

2. Upload Audio File
   └─> POST /upload-audio
       └─> Multer middleware (validate size/format)
           └─> SupabaseService.uploadAudioFile()
               └─> Supabase Storage
                   └─> Returns public URL

3. Start Transcription
   └─> POST /transcribe
       └─> GroqService.transcribeAudio()
           └─> Groq Whisper API
               └─> Returns transcript text
                   └─> SupabaseService.createTranscript()
                       └─> Save to database

4. Generate Notes
   └─> POST /generate-notes
       └─> GroqService.generateNotes()
           └─> Groq Llama 3.1 (with prompt template)
               └─> Returns formatted notes
                   └─> SupabaseService.updateTranscript()
                       └─> Update database with notes
```

### Authentication Flow

```
1. User Login/Signup
   └─> Supabase Auth (client-side)
       └─> Returns JWT access token + refresh token
           └─> Stored in AuthContext
               └─> Auto-refresh on expiration

2. API Request
   └─> Client includes JWT in Authorization header
       └─> Backend trusts X-User-ID header (validated by Supabase RLS)
           └─> Database queries filtered by user_id
```

## Database Schema

### Core Tables

**users** (managed by Supabase Auth)
- `id` (UUID, primary key)
- `email` (unique)
- `created_at` (timestamp)

**courses**
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `name` (text)
- `description` (text)
- `color` (text, hex color code)
- `created_at` (timestamp, auto)
- `updated_at` (timestamp, auto)

**lectures**
- `id` (UUID, primary key)
- `course_id` (UUID, foreign key → courses.id)
- `user_id` (UUID, foreign key → users.id)
- `title` (text)
- `date` (date)
- `audio_url` (text, Supabase Storage URL)
- `duration` (integer, seconds)
- `created_at` (timestamp, auto)
- `updated_at` (timestamp, auto)

**transcripts**
- `id` (UUID, primary key)
- `lecture_id` (UUID, foreign key → lectures.id)
- `user_id` (UUID, foreign key → users.id)
- `content` (text, raw transcript)
- `notes` (text, AI-generated notes)
- `status` (enum: 'pending', 'processing', 'completed', 'failed')
- `created_at` (timestamp, auto)
- `updated_at` (timestamp, auto)

**user_progress** (gamification)
- `id` (UUID, primary key)
- `user_id` (UUID, foreign key → users.id)
- `experience_points` (integer)
- `level` (integer)
- `streak_count` (integer)
- `last_activity` (timestamp)
- `achievements` (jsonb, array of achievement IDs)

### Row Level Security (RLS)

All tables have RLS policies ensuring users can only access their own data:

```sql
CREATE POLICY "Users can only view their own data"
ON courses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own data"
ON courses FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Similar policies for UPDATE and DELETE
```

## AI Integration

### Transcription (Groq Whisper)

```typescript
// Input: Audio file URL
// Output: Raw text transcript

Model: whisper-large-v3
Language: Auto-detect
Response Format: JSON with timestamps
```

**Error Handling**:
- Retry failed requests up to 3 times
- Fallback to simplified prompt on timeout
- Store partial transcripts on interruption

### Note Generation (Groq Llama 3.1)

```typescript
// Input: Transcript text
// Output: Structured study notes

Model: llama-3.1-70b-versatile
Temperature: 0.7
Max Tokens: 4000
```

**Prompt Template**:
```
You are an expert note-taker. Transform this lecture transcript into
structured study notes with:
- Main topics and subtopics
- Key concepts and definitions
- Important examples
- Summary points

Transcript: {transcript}
```

## Performance Considerations

### Frontend Optimizations
- **Code Splitting**: Next.js automatic route-based splitting
- **Image Optimization**: Next.js Image component with lazy loading
- **Bundle Size**: Tree-shaking and dynamic imports
- **Caching**: SWR for data fetching (planned)

### Backend Optimizations
- **Database Indexing**: Indexed on user_id, course_id, lecture_id
- **Connection Pooling**: Supabase handles connection pooling
- **File Storage**: Direct upload to Supabase Storage (no server streaming)
- **API Response Size**: Paginated queries (to be implemented)

### Known Performance Issues
1. **Large Dashboard Component**: 4,791 lines causes slow initial render
2. **No Request Pagination**: All records fetched at once
3. **Missing Caching**: API responses not cached
4. **Console Logging**: Production code has debug logs

## Security Architecture

### Authentication & Authorization
- **JWT-based auth**: Supabase Auth handles token lifecycle
- **Row Level Security**: Database-level access control
- **API Security**: CORS configured, but could be stricter

### Data Protection
- **Environment Variables**: Secrets stored in .env (gitignored)
- **HTTPS Only**: Production enforces HTTPS
- **File Upload Validation**: Size limits and format checking
- **SQL Injection**: Protected by Supabase parameterized queries

### Current Security Gaps
1. **No Rate Limiting**: API endpoints unprotected from abuse
2. **Header Trust**: X-User-ID header not cryptographically verified
3. **Missing CSRF Protection**: No CSRF tokens for mutations
4. **Permissive CORS**: Should restrict to specific domains

## Deployment Architecture

### Frontend Deployment (Vercel - Recommended)
```
User → Vercel CDN → Next.js App → API Routes
```

### Backend Deployment (Railway/Render - Recommended)
```
Client → Load Balancer → Express Server → Supabase
                                        → Groq API
```

### Database (Supabase Cloud)
```
Application → Supabase PostgREST → PostgreSQL
            → Supabase Storage → S3-compatible storage
```

### Mobile Deployment
- **iOS**: App Store via Xcode
- **Android**: Google Play via Android Studio

## Monitoring & Observability

### Current State
- **Logging**: Winston logger in backend (JSON format)
- **Error Tracking**: Console errors only (no Sentry/etc)
- **Analytics**: Not implemented
- **Monitoring**: Not implemented

### Recommended Additions
- Error tracking: Sentry or Rollbar
- Analytics: Posthog or Mixpanel
- APM: Datadog or New Relic
- Log aggregation: Logtail or Papertrail

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start all services
npm run dev  # Runs client + mcp-server concurrently

# Individual services
cd client && npm run dev       # Next.js on :3000
cd mcp-server && npm run dev   # Express on :3001
```

### Testing Strategy (To Be Implemented)
- **Unit Tests**: Jest for services and utilities
- **Integration Tests**: Supertest for API endpoints
- **Component Tests**: React Testing Library
- **E2E Tests**: Playwright or Cypress

## Future Architecture Improvements

### Short-term
1. Split dashboard component into smaller modules
2. Add request/response caching layer
3. Implement API versioning (v1, v2)
4. Add comprehensive test coverage
5. Set up CI/CD pipeline

### Medium-term
6. Migrate to tRPC for type-safe API calls
7. Implement real-time updates (WebSockets/SSE)
8. Add Redis for caching and session management
9. Optimize bundle size with analysis
10. Implement progressive web app (PWA) features

### Long-term
11. Microservices architecture for scalability
12. Separate transcription service
13. Add support for video lectures
14. Implement collaborative note-taking
15. Multi-language support (i18n)

## Cost Optimization Strategy

The entire stack is designed to run on free tiers:

- **Supabase Free Tier**: 500MB database, 1GB storage, 50k monthly active users
- **Groq Free Tier**: Generous API limits for transcription/AI
- **Vercel Free Tier**: Unlimited personal projects, 100GB bandwidth
- **Railway/Render Free Tier**: 500 hours/month

**Scaling Path**: When limits are hit, costs are still minimal due to efficient architecture.

## Key Design Decisions

### Why Next.js App Router?
- Server components reduce client bundle size
- Built-in API routes eliminate need for separate server (though we use one for AI)
- File-based routing simplifies navigation
- Excellent developer experience

### Why Supabase over Firebase?
- PostgreSQL over NoSQL (better for relational data)
- Built-in RLS provides database-level security
- More cost-effective at scale
- Better TypeScript support

### Why Groq over OpenAI?
- Faster inference (especially for Whisper)
- More generous free tier
- Competitive quality for transcription
- Cost-effective for high-volume use

### Why Monorepo?
- Code sharing between client and server
- Single source of truth for types
- Simplified dependency management
- Better for a small team or solo developer

## Conclusion

Koala.ai is architected as a modern, cost-effective full-stack TypeScript application optimized for rapid development and easy deployment. The separation of concerns, type safety, and service-oriented design provide a solid foundation for future growth and feature additions.

The main areas for architectural improvement are testing infrastructure, component granularity, and production-grade monitoring/observability.
