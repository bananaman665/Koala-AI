# Koala.ai Quick Reference

## 🚀 Quick Start Commands

```bash
# Complete setup (first time)
./setup.sh

# Start development
npm run dev

# Or start individually
npm run dev:client   # Frontend on :3000
npm run dev:server   # MCP Server on :3001
```

## 📁 Project Structure

```
koala.ai/
├── client/              Next.js frontend app
│   ├── src/
│   │   ├── app/        App router pages
│   │   ├── components/ React components
│   │   ├── lib/       Firebase & utilities
│   │   └── hooks/     Custom React hooks
│   └── public/        Static assets
│
├── mcp-server/         MCP server for Whisper
│   ├── src/
│   │   ├── index.ts   Server entry
│   │   ├── mcp/       MCP protocol implementation
│   │   ├── services/  Whisper, OpenAI, Firebase
│   │   └── utils/     Helpers & validators
│
├── firebase/           Firebase config
│   ├── firestore.rules
│   ├── storage.rules
│   └── firebase.json
│
└── shared/             Shared TypeScript types
    └── src/types.ts
```

## 🔑 Required Environment Variables

### client/.env.local
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
```

### mcp-server/.env
```env
PORT=3001
OPENAI_API_KEY=sk-...
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_STORAGE_BUCKET=
JWT_SECRET=
CORS_ORIGIN=http://localhost:3000
```

## 🛠️ Development Workflow

### 1. Initial Setup
```bash
./setup.sh                    # Run setup
# Fill in .env files
npm run dev                   # Start both servers
```

### 2. Create Firebase Project
- Go to console.firebase.google.com
- Enable Auth, Firestore, Storage
- Get config for .env files

### 3. Get OpenAI API Key
- Visit platform.openai.com/api-keys
- Create new key
- Add to mcp-server/.env

## 📋 Common Tasks

### Add New Component (Frontend)
```bash
cd client/src/components
# Create ComponentName/index.tsx
```

### Add New MCP Tool
```bash
cd mcp-server/src/mcp
# Edit tools.ts
```

### Update Shared Types
```bash
cd shared/src
# Edit types.ts
npm run build
```

### Deploy Firebase Rules
```bash
cd firebase
firebase deploy --only firestore:rules,storage:rules
```

## 🐛 Debugging

### Check Logs
```bash
# Frontend logs
cd client && npm run dev

# Backend logs
cd mcp-server && npm run dev

# Firebase logs
cd firebase && firebase functions:log
```

### Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Test authentication
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/lectures
```

## 📦 Dependencies

### Frontend
- Next.js 14 - React framework
- Firebase 10 - Auth, Firestore, Storage
- Tailwind CSS - Styling
- Zustand - State management

### Backend
- Express - HTTP server
- @modelcontextprotocol/sdk - MCP implementation
- OpenAI - Whisper & GPT APIs
- Firebase Admin - Server-side Firebase

## 🔒 Security Checklist

- [ ] All .env files in .gitignore
- [ ] Firebase rules deployed
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Authentication required for protected routes

## 🚢 Deployment Checklist

- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Environment variables set in production
- [ ] Firebase project in production mode
- [ ] OpenAI API limits reviewed
- [ ] Error monitoring configured

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `client/src/lib/firebase.ts` | Firebase initialization |
| `mcp-server/src/mcp/tools.ts` | MCP tool definitions |
| `shared/src/types.ts` | Shared TypeScript types |
| `firebase/firestore.rules` | Database security |
| `firebase/storage.rules` | Storage security |

## 💡 Tips

- Use TypeScript strictly - don't use `any`
- Share types from `shared/` package
- Keep components small and focused
- Write tests for MCP tools
- Document all API endpoints
- Use meaningful commit messages

## 🆘 Get Help

- Read SETUP.md for detailed setup
- Check component READMEs
- Review Firebase documentation
- Check OpenAI API docs

## 📊 Architecture Flow

```
User → Frontend (Next.js)
         ↓
    Firebase Auth
         ↓
    MCP Server (Express)
         ↓
    OpenAI Whisper API
         ↓
    Firebase Storage/Firestore
```

---

**Happy Coding! 🐨**
