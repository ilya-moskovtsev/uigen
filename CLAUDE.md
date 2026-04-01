# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack on port 3000
npm run dev:daemon   # Start dev server in background, logs to logs.txt
npm run build        # Production build
npm run lint         # Run ESLint
npm run test         # Run vitest unit tests
npm run db:reset     # Reset SQLite database to clean state
```

No single-test command is exposed in package.json; run `npx vitest run <path>` to target a specific test file.

**Environment variables** (`.env`):
- `ANTHROPIC_API_KEY` — optional; without it the app uses a mock provider that returns predefined components
- `JWT_SECRET` — optional; defaults to `"development-secret-key"`

## Architecture

UIGen is a Next.js 15 (App Router) application where users describe React components in natural language and get a live preview. The two main areas are the **chat interface** and the **preview/code editor**, split by resizable panels in `src/app/main-content.tsx`.

### Data flow: chat → file system → preview

1. User submits a message via `ChatInterface` → `ChatContext.handleSubmit`
2. `POST /api/chat` streams a response from Claude (or mock) using Vercel AI SDK's `streamText`
3. Claude calls one of two tools: **`str_replace_editor`** (create/view/edit file content) or **`file_manager`** (rename/delete)
4. Tool calls are routed through `FileSystemContext.handleToolCall`, which mutates the in-memory **virtual file system**
5. `PreviewFrame` renders an `<iframe srcdoc>` built by the JSX transformer from the virtual FS state
6. After streaming ends, the project (messages + serialized FS) is auto-saved to SQLite via Prisma

### Virtual file system (`src/lib/file-system.ts`)

All files live in memory — nothing is written to disk. The FS is a `Map<string, FileNode>` tree. It serializes to/from JSON for database storage and iframe transmission. AI tools interact with it via `viewFile()`, `replaceInFile()`, `insertInFile()`.

### Preview rendering (`src/components/preview/PreviewFrame.tsx` + `src/lib/transform/jsx-transformer.ts`)

Babel standalone transforms JSX → JS in the browser. An import map pointing to `esm.sh` is injected so React components can import npm packages. Tailwind CSS is detected and injected automatically. The entry point is auto-detected (`App.jsx`, `App.tsx`, `index.jsx`, or `index.tsx`).

### AI integration (`src/app/api/chat/route.ts`, `src/lib/provider.ts`)

- Model: `claude-haiku-4-5` (real) or mock provider (fallback)
- Anthropic prompt caching is enabled for cost efficiency
- The AI system prompt (`src/lib/prompts/generation.tsx`) instructs Claude to always create `/App.jsx` as the entry point and use Tailwind CSS for styling, with `@/` import aliases for cross-file imports

### Authentication (`src/lib/auth.ts`)

JWT sessions (HS256, 7-day expiry) stored in httpOnly cookies. `src/middleware.ts` protects `/[projectId]` routes and `/api/*` routes. Anonymous users can use the app; their work is tracked in localStorage (`src/lib/anon-work-tracker.ts`) until they sign up.

### State management

Two React contexts own all client state:
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`) — AI messages, streaming status, input
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) — virtual FS state, selected file, tool-call handler

### Database

Prisma + SQLite. Two models:
- `User` — email/password (bcrypt), owns projects
- `Project` — stores `messages` (JSON array) and `data` (serialized virtual FS) as string columns

### Testing

Tests live alongside source in `__tests__/` subdirectories. Coverage areas: `src/components/chat/__tests__/`, `src/components/editor/__tests__/`, `src/lib/__tests__/`, `src/lib/transform/__tests__/`. Test environment is jsdom (configured in `vitest.config.mts`).

## Notes

- The database schema is defined in `prisma/schema.prisma`. Reference it anytime you need to understand the structure of data stored in the database.

## Preferences

- Use comments sparingly. Only comment complex code.
