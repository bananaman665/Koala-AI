# Koala.ai - AI Lecture Notes App

An intelligent meeting and lecture recording app that uses OpenAI Whisper for transcription and AI-powered note generation.

## 🏗️ Project Structure

```
koala.ai/
├── client/              # Frontend React/Next.js application
├── mcp-server/         # Custom MCP server for Whisper integration
├── firebase/           # Firebase configuration and Cloud Functions
├── shared/             # Shared TypeScript types and utilities
└── docs/               # Documentation
```

## 🚀 Features

- 🎙️ Record lectures and meetings
- 📝 AI-powered transcription using OpenAI Whisper
- 🤖 Intelligent note generation with structured summaries
- 🔥 Firebase backend for authentication and storage
- 🔌 MCP server architecture for extensibility

## 📋 Prerequisites

- Node.js >= 18.x
- npm or yarn
- Firebase account
- OpenAI API key

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install

# Install MCP server dependencies
cd ../mcp-server
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` in each directory and fill in your credentials:

- `client/.env.local` - Frontend environment variables
- `mcp-server/.env` - MCP server and OpenAI configuration
- `firebase/.env` - Firebase configuration

### 3. Firebase Setup

```bash
cd firebase
npm install -g firebase-tools
firebase login
firebase init
```

### 4. Run Development Servers

```bash
# Terminal 1: Run frontend
cd client
npm run dev

# Terminal 2: Run MCP server
cd mcp-server
npm run dev
```

## 📚 Documentation

- [Architecture Overview](./docs/architecture.md)
- [MCP Server Guide](./mcp-server/README.md)
- [Frontend Guide](./client/README.md)
- [Firebase Setup](./firebase/README.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License
