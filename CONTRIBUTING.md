# Contributing to Koala.ai

Thank you for your interest in contributing to Koala.ai! This document provides guidelines and best practices for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Common Tasks](#common-tasks)

---

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Git**: Latest version
- **Supabase Account**: For database and storage
- **Groq API Key**: For AI transcription and note generation

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/koala-ai.git
   cd koala-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**

   Create `.env.local` files in both `client/` and `mcp-server/` directories:

   **client/.env.local:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   NEXT_PUBLIC_MCP_SERVER_URL=http://localhost:3001
   ```

   **mcp-server/.env:**
   ```env
   GROQ_API_KEY=your-groq-api-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_STORAGE_BUCKET=audio-recordings
   PORT=3001
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**

   Run the SQL setup script in your Supabase SQL editor:
   ```bash
   cat SUPABASE_DATABASE_SETUP.sql
   # Copy and paste into Supabase SQL Editor
   ```

5. **Start Development**
   ```bash
   npm run dev
   ```

   This starts both the frontend (`:3000`) and backend (`:3001`).

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Active development branch (if using)
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Creating a Feature Branch

```bash
git checkout -b feature/add-pdf-export
```

### Keeping Your Branch Updated

```bash
git checkout main
git pull origin main
git checkout feature/add-pdf-export
git rebase main
```

---

## Code Standards

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **No `any` Types**: Avoid using `any` - use proper types or `unknown`
- **Interfaces over Types**: Prefer interfaces for object shapes
- **Explicit Return Types**: Always specify return types for functions

**Good:**
```typescript
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

async function getUser(userId: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}
```

**Bad:**
```typescript
async function getUser(userId: any) {
  const data = await supabase.from('users').select('*').eq('id', userId).single();
  return data;
}
```

### React Components

- **Function Components**: Use function components with hooks
- **Component Size**: Keep components under 300 lines
- **Single Responsibility**: One component = one purpose
- **Props Interface**: Always define props interface

**Good:**
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ label, onClick, variant = 'primary', disabled = false }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant}`}
    >
      {label}
    </button>
  );
}
```

### File Naming Conventions

- **Components**: PascalCase - `AudioPlayer.tsx`, `LevelBadge.tsx`
- **Hooks**: camelCase with `use` prefix - `useAI.ts`, `useLectureRecording.ts`
- **Utilities**: camelCase - `validators.ts`, `logger.ts`
- **Services**: camelCase - `groq.ts`, `supabase.ts`
- **Types**: PascalCase - `User.ts`, `Lecture.ts`

### Code Organization

```typescript
// 1. Imports (external first, then internal)
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/Button';

// 2. Types/Interfaces
interface ComponentProps {
  // ...
}

// 3. Component
export function Component({ prop1, prop2 }: ComponentProps) {
  // 3a. Hooks
  const [state, setState] = useState();
  const router = useRouter();

  // 3b. Effects
  useEffect(() => {
    // ...
  }, []);

  // 3c. Event Handlers
  const handleClick = () => {
    // ...
  };

  // 3d. Render
  return (
    // ...
  );
}
```

### Documentation

- **JSDoc Comments**: All exported functions must have JSDoc
- **Complex Logic**: Add inline comments for non-obvious code
- **Examples**: Include usage examples in JSDoc

```typescript
/**
 * Transcribes audio file to text using Groq's Whisper model.
 *
 * @param audioFile - Audio file as Buffer or File object
 * @param language - ISO language code (e.g., 'en', 'es', 'fr')
 * @returns Transcription result with text, language, and duration
 *
 * @throws {Error} If transcription fails or API returns an error
 *
 * @example
 * ```typescript
 * const result = await transcribeAudio(buffer, 'en');
 * console.log(result.text);
 * ```
 */
async function transcribeAudio(audioFile: Buffer, language: string): Promise<TranscriptionResult> {
  // Implementation
}
```

### Error Handling

- **Try-Catch Blocks**: Use for all async operations
- **Specific Errors**: Throw descriptive error messages
- **Logging**: Log errors before throwing/handling

```typescript
async function fetchData(id: string): Promise<Data> {
  try {
    const { data, error } = await supabase
      .from('table')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Failed to fetch data', { id, error });
      throw new Error(`Data fetch failed: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('Unexpected error in fetchData', { error });
    throw error;
  }
}
```

### Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Validate inputs** - Use Zod or similar for runtime validation
3. **Sanitize user input** - Especially for database queries
4. **Use RLS policies** - Database-level security
5. **Rate limiting** - Implement for all public endpoints (TODO)

---

## Testing Guidelines

### Unit Tests (To Be Implemented)

- **File Naming**: `*.test.ts` or `*.spec.ts`
- **Location**: Co-located with source files or in `__tests__` directory
- **Coverage Target**: Aim for 80% code coverage

**Example:**
```typescript
// services/groq.test.ts
import { GroqService } from './groq';

describe('GroqService', () => {
  describe('transcribeAudio', () => {
    it('should transcribe audio successfully', async () => {
      const service = new GroqService();
      const result = await service.transcribeAudio(mockBuffer, 'en');

      expect(result.text).toBeDefined();
      expect(result.language).toBe('en');
    });

    it('should throw error for invalid audio', async () => {
      const service = new GroqService();

      await expect(
        service.transcribeAudio(invalidBuffer, 'en')
      ).rejects.toThrow('Transcription failed');
    });
  });
});
```

### Integration Tests (To Be Implemented)

- Test API endpoints end-to-end
- Use Supertest for HTTP testing
- Mock external services (Groq, Supabase)

### Component Tests (To Be Implemented)

- Use React Testing Library
- Test user interactions, not implementation details
- Test accessibility

---

## Commit Message Format

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring (no feature change)
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, or tooling changes
- `perf`: Performance improvements

### Examples

```
feat(transcription): add support for multiple audio formats

Added support for MP3, WAV, M4A, and WebM formats.
Updated validation logic and error messages.

Closes #123
```

```
fix(api): handle empty transcript edge case

Fixed crash when transcript text is empty.
Now returns appropriate error message to client.

Fixes #456
```

```
docs(contributing): add testing guidelines

Added comprehensive testing guidelines including
unit, integration, and component testing examples.
```

### Commit Message Guidelines

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- First line: max 72 characters
- Body: wrap at 72 characters
- Reference issues and PRs where applicable

---

## Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run linter** (when configured)
   ```bash
   npm run lint
   ```

3. **Run tests** (when implemented)
   ```bash
   npm test
   ```

4. **Build successfully**
   ```bash
   npm run build
   ```

### PR Checklist

- [ ] Code follows project style guidelines
- [ ] All new functions have JSDoc comments
- [ ] No TypeScript `any` types introduced
- [ ] Tests added/updated (when testing is implemented)
- [ ] Documentation updated (if applicable)
- [ ] No console.log statements left in code
- [ ] Commit messages follow conventional commits format
- [ ] Branch is up-to-date with main
- [ ] Build passes without errors

### PR Title Format

Use the same format as commit messages:

```
feat(dashboard): add lecture filtering
fix(auth): resolve token refresh bug
docs(api): update endpoint documentation
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## How to Test
1. Step 1
2. Step 2
3. Expected result

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
Related to #456
```

### Review Process

1. At least one approval required (when team grows)
2. All CI checks must pass (when CI is set up)
3. Address all review comments
4. Squash commits before merging (if requested)

---

## Project Structure

Understanding the codebase structure:

```
Koala.ai/
├── client/                    # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # React components
│   │   ├── contexts/         # React Context providers
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # Utility libraries
│   │   └── store/            # Zustand stores
│   └── public/               # Static assets
│
├── mcp-server/               # Express.js backend
│   └── src/
│       ├── index.ts          # Main server file
│       ├── services/         # Business logic
│       ├── types/            # TypeScript types
│       └── utils/            # Utilities
│
├── shared/                   # Shared code
│   └── types/               # Shared TypeScript types
│
└── docs/                    # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    └── SETUP.md
```

---

## Common Tasks

### Adding a New API Endpoint

1. **Define types** in `shared/src/types/index.ts`
2. **Create validator** in `mcp-server/src/utils/validators.ts`
3. **Add route handler** in `mcp-server/src/index.ts`
4. **Update API docs** in `API.md`
5. **Add JSDoc comments**

### Adding a New Component

1. **Create component file** in `client/src/components/`
2. **Define props interface**
3. **Implement component**
4. **Add to exports** (if creating a component library)
5. **Update documentation**

### Adding a New Service Method

1. **Add method** to appropriate service class
2. **Add JSDoc comment** with usage example
3. **Add error handling**
4. **Add logging**
5. **Update tests** (when implemented)

### Database Schema Changes

1. **Write migration SQL** in a new file
2. **Test locally** in Supabase SQL editor
3. **Update** `SUPABASE_DATABASE_SETUP.sql`
4. **Document changes** in PR description
5. **Update TypeScript types**

### Updating Dependencies

```bash
# Check outdated packages
npm outdated

# Update a specific package
npm update package-name

# Update all packages (carefully!)
npm update

# After updating, test thoroughly
npm run build
npm run dev
```

---

## Getting Help

- **Documentation**: Check `ARCHITECTURE.md`, `API.md`, and `SETUP.md`
- **Issues**: Search existing issues or create a new one
- **Questions**: Open a discussion or issue with the `question` label

---

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other contributors

### Unacceptable Behavior

- Harassment or discriminatory comments
- Personal attacks
- Spam or off-topic comments
- Publishing others' private information

---

## License

By contributing to Koala.ai, you agree that your contributions will be licensed under the same license as the project.

---

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes (for significant contributions)
- README acknowledgments (for major features)

---

Thank you for contributing to Koala.ai! 🎉
