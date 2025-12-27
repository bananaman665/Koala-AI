# Koala.ai - AI Lecture Notes App

An intelligent lecture recording app that uses Groq's Whisper AI for transcription and Llama 3.3 70B for AI-powered note generation.

## 🏗️ Project Structure

```
koala.ai/
├── client/              # Frontend Next.js 14 application (React 18, TypeScript, Tailwind)
├── mcp-server/          # Express.js MCP server for AI processing
└── shared/              # Shared TypeScript types and utilities
```

## 🚀 Features

- 🎙️ **Record Lectures** - Web and native mobile recording (iOS & Android via Capacitor)
- 📝 **AI Transcription** - Groq Whisper AI for 95%+ accurate transcription
- 🤖 **Smart Notes** - Llama 3.3 70B generates structured study notes automatically
- 📚 **Course Management** - Organize recordings by courses and lectures
- 👥 **Shared Classes** - Collaborate with classmates on notes and materials
- 🎮 **Gamification** - XP, levels, achievements, and streaks to stay motivated
- 🎯 **Study Modes** - Flashcards and learn modes for active recall
- 📊 **Analytics** - Track study patterns and progress
- 🌙 **Dark Mode** - Full dark mode support
- 📱 **Mobile Apps** - Native iOS and Android apps

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14.2 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: React Context + Zustand
- **Mobile**: Capacitor 7 (iOS & Android)
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth (JWT, OAuth)

### Backend
- **MCP Server**: Express.js + TypeScript
- **AI Services**: Groq API
  - Whisper for transcription
  - Llama 3.3 70B for note generation
- **Storage**: Supabase Storage
- **Database**: Supabase PostgreSQL

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- **Supabase account** ([supabase.com](https://supabase.com))
- **Groq API key** ([console.groq.com](https://console.groq.com))

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Install client dependencies
cd client
npm install

# Install MCP server dependencies
cd ../mcp-server
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Run the database migration from `docs/SUPABASE_SETUP.md`
3. Enable authentication providers (Email, Google, GitHub)
4. Create a storage bucket named `audio-recordings` (public)
5. Copy your project URL and anon key

### 3. Groq API Setup

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create a new API key
3. Copy the API key for your `.env` files

### 4. Environment Configuration

**Client** (`client/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
```

**MCP Server** (`mcp-server/.env`):
```bash
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

### 5. Run Development Servers

```bash
# Terminal 1: Run frontend (http://localhost:3000)
cd client
npm run dev

# Terminal 2: Run MCP server (http://localhost:3001)
cd mcp-server
npm run dev
```

### 6. Mobile Development (Optional)

```bash
# Install Capacitor dependencies
cd client
npm install

# iOS development
npx cap sync ios
npx cap open ios

# Android development
npx cap sync android
npx cap open android
```

See `docs/MOBILE_SETUP.md` for detailed mobile setup instructions.

## 📚 Documentation

- [Architecture Overview](./docs/ARCHITECTURE.md)
- [API Documentation](./docs/API.md)
- [Supabase Setup](./docs/SUPABASE_SETUP.md)
- [Mobile Setup](./docs/MOBILE_SETUP.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License
