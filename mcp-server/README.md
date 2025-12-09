# Koala.ai MCP Server

Custom Model Context Protocol server for handling lecture transcription and AI-powered note generation.

## Features

- 🎯 MCP Protocol Implementation
- 🎙️ **Groq Whisper Integration** (FREE API)
- 🤖 **Groq Llama 3.1** AI-Powered Note Generation (FREE)
- 🗄️ **Supabase** - Auth + PostgreSQL + Storage (ALL FREE)
- 🔐 Row Level Security & Authentication
- 📊 Logging & Monitoring

## Tech Stack

- **AI Services:** Groq (Whisper + Llama 3.1 70B) - Free tier
- **Backend:** Supabase (Auth + PostgreSQL + Storage) - Free tier
- **Server:** Express.js + MCP Protocol
- **100% FREE** within generous usage limits!

## Tools Exposed

### 1. `transcribe_audio`
Transcribes audio files using Groq Whisper API (whisper-large-v3).

**Input:**
```json
{
  "audioUrl": "string",
  "language": "string (optional)",
  "lectureId": "string"
}
```

### 2. `generate_notes`
Generates structured notes from transcription using Groq Llama 3.1 70B.

**Input:**
```json
{
  "transcript": "string",
  "lectureId": "string",
  "options": {
    "style": "detailed | concise | bullet",
    "includeTimestamps": boolean
  }
}
```

### 3. `get_lecture_info`
Retrieves lecture metadata and status.

**Input:**
```json
{
  "lectureId": "string"
}
```

### 4. `search_transcripts`
Searches across all user transcripts.

**Input:**
```json
{
  "query": "string",
  "userId": "string",
  "limit": number
}
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your credentials
```

3. Run development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/transcribe` - Upload and transcribe audio
- `POST /api/generate-notes` - Generate notes from transcript
- `GET /api/lectures/:id` - Get lecture information
- `POST /api/search` - Search transcripts

## Architecture

```
src/
├── index.ts              # Server entry point (Express + MCP)
├── mcp/
│   ├── server.ts        # MCP server implementation
│   └── tools.ts         # MCP tool definitions
├── services/
│   ├── groq.ts          # Groq API service (Whisper + Llama)
│   ├── database.ts      # Supabase PostgreSQL client
│   └── supabase.ts      # Supabase Storage service
└── utils/
    ├── logger.ts        # Winston logger
    └── validators.ts    # Zod input validation
```

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Client (Next.js)                   │
│         Supabase Auth (Google Sign-In)          │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│          MCP Server (Express)                   │
├─────────────────────────────────────────────────┤
│  Groq API          │       Supabase              │
│  - Whisper         │  - Auth                     │
│  - Llama 3.1       │  - PostgreSQL               │
│                    │  - Storage                  │
└─────────────────────────────────────────────────┘
```

**Why this architecture?**
- ✅ **100% Free** within generous limits
- ✅ Single platform (Supabase) for all backend needs
- ✅ PostgreSQL > Firestore (more powerful, SQL queries)
- ✅ Groq provides fast, free AI processing
- ✅ Simpler than managing multiple platforms
