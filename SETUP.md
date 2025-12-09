# Development Setup Guide

Complete guide to setting up the Koala.ai development environment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 18.x ([Download](https://nodejs.org/))
- **npm** >= 9.x (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **VS Code** (recommended) ([Download](https://code.visualstudio.com/))

## Quick Start

### 1. Run Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This will:
- Check Node.js version
- Install all dependencies
- Create environment files

### 2. Firebase Project Setup

#### Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `koala-ai` (or your preferred name)
4. Disable Google Analytics (optional)
5. Click "Create project"

#### Enable Firebase Services

**Authentication:**
1. Go to Authentication → Get Started
2. Enable "Email/Password" sign-in method
3. (Optional) Enable Google sign-in

**Firestore Database:**
1. Go to Firestore Database → Create Database
2. Start in **production mode**
3. Choose a location close to your users
4. Click "Enable"

**Storage:**
1. Go to Storage → Get Started
2. Start in **production mode**
3. Click "Done"

#### Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" section
3. Click web icon (</>) to add a web app
4. Register app with nickname: "koala-ai-web"
5. Copy the Firebase configuration object

#### Set Up Firebase Admin SDK

1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file securely
4. Extract these values for `.env`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_PRIVATE_KEY`

### 3. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign up or log in
3. Go to [API Keys](https://platform.openai.com/api-keys)
4. Click "Create new secret key"
5. Copy the key (you won't see it again!)
6. Add to `mcp-server/.env`

### 4. Configure Environment Variables

#### Client (.env.local)

```bash
cd client
cp .env.example .env.local
```

Edit `client/.env.local`:

```env
# From Firebase Console → Project Settings → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123

# API URLs
NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

#### MCP Server (.env)

```bash
cd mcp-server
cp .env.example .env
```

Edit `mcp-server/.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# OpenAI (from platform.openai.com)
OPENAI_API_KEY=sk-proj-...

# Firebase Admin SDK (from service account JSON)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# Security
JWT_SECRET=generate-a-random-string-here
CORS_ORIGIN=http://localhost:3000
```

**Tip:** Generate JWT_SECRET with:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 5. Initialize Firebase CLI

```bash
cd firebase
npm install -g firebase-tools
firebase login
firebase use --add
```

Select your project and give it an alias (e.g., "default").

Deploy rules:
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Running the Application

### Development Mode

**Option 1: Run all services together**
```bash
npm run dev
```

**Option 2: Run services individually**

Terminal 1 - Frontend:
```bash
cd client
npm run dev
```

Terminal 2 - MCP Server:
```bash
cd mcp-server
npm run dev
```

### Access Points

- **Frontend:** http://localhost:3000
- **MCP Server:** http://localhost:3001
- **Firebase Emulator UI:** http://localhost:4000 (if running emulators)

## Testing the Setup

### 1. Test Frontend

1. Open http://localhost:3000
2. You should see the landing page
3. Try signing up with an email

### 2. Test MCP Server

```bash
curl http://localhost:3001/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 3. Test Firebase Connection

Check the browser console for any Firebase errors. If configured correctly, you should see no errors.

## Build for Production

```bash
# Build all packages
npm run build

# Or build individually
cd client && npm run build
cd mcp-server && npm run build
```

## Troubleshooting

### "Firebase API key is invalid"
- Double-check all Firebase config values in `client/.env.local`
- Make sure there are no extra spaces or quotes

### "OpenAI API key is invalid"
- Verify key at https://platform.openai.com/api-keys
- Make sure key starts with `sk-`
- Check for any extra whitespace

### "Cannot connect to MCP server"
- Ensure MCP server is running on port 3001
- Check `NEXT_PUBLIC_MCP_SERVER_URL` in client config
- Verify CORS settings in `mcp-server/.env`

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

### Firebase permission denied
- Check `firestore.rules` and `storage.rules`
- Ensure user is authenticated
- Verify user owns the resource

## Development Tools

### Recommended VS Code Extensions

- ESLint
- Prettier
- Firebase
- Tailwind CSS IntelliSense
- TypeScript Error Translator

### Firebase Emulators (Optional)

For local development without using production Firebase:

```bash
cd firebase
firebase emulators:start
```

Update URLs in `.env.local` to use emulator:
```env
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=localhost:9099
```

## Next Steps

1. ✅ Complete environment setup
2. 📖 Read the [Architecture Documentation](./docs/architecture.md)
3. 🎨 Explore the [Component Library](./client/src/components/)
4. 🔧 Review [MCP Server Tools](./mcp-server/README.md)
5. 🚀 Start building features!

## Getting Help

- Check the [main README](./README.md)
- Review component documentation
- Check Firebase documentation
- OpenAI API documentation

## Common Commands Reference

```bash
# Development
npm run dev                 # Start all services
npm run dev:client         # Start frontend only
npm run dev:server         # Start MCP server only

# Building
npm run build              # Build all packages
npm run build:client       # Build frontend
npm run build:server       # Build MCP server

# Testing
npm test                   # Run all tests
npm run test:client        # Test frontend
npm run test:server        # Test MCP server

# Linting
npm run lint               # Lint all packages
npm run type-check         # TypeScript type checking

# Firebase
firebase deploy            # Deploy all Firebase services
firebase emulators:start   # Start local emulators
```

---

**Ready to build something amazing! 🚀**
