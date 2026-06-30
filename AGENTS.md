# Agent Context: Inkstream

## Project Overview
Inkstream — SvelteKit 5 AI chat platform using Clean Architecture. Supports streaming chat via OpenRouter (OpenAI-compatible API, any routed model), dual-mode auth (session cookie + Bearer API key), and MySQL persistence via Drizzle ORM.

## Tech Stack
- **Framework:** SvelteKit 5 (Runes syntax: `$state`, `$props`, `$bindable`, `$derived`)
- **UI:** Bulma CSS v1 (CDN in `app.html`)
- **Database:** MySQL + Drizzle ORM
- **Validation:** Zod (all API inputs validated via schemas)
- **AI:** OpenRouter (`https://openrouter.ai/api/v1` — chat completions + model catalog; PDFs via `file-parser` plugin)

## Architecture Rules (CRITICAL)

### 1. File Size Limit
No file exceeds **150 lines**. If a component grows, extract sub-components.

### 2. Clean Architecture Layers
```
src/lib/server/domain/       → Interfaces, types, errors (no implementation)
src/lib/server/infrastructure/ → Concrete implementations (AI providers, auth)
src/lib/server/repositories/   → Database access ONLY (Drizzle queries)
src/lib/server/services/       → Business logic orchestrators
src/lib/server/validation/     → Zod schemas
src/routes/api/v1/             → Thin API wrappers (format request/response only)
```

**Never** put raw SQL/Drizzle calls in routes. Routes delegate to Services.
**Never** put business logic in Repositories. Repositories do CRUD only.

### 3. Dependency Injection
Services receive dependencies via constructor:
```ts
new ConversationService(provider, chatRepo, messageRepo)
```
This enables swapping providers (OpenRouter → Anthropic → Local LLM) without touching service logic.

### 4. ChatProvider Interface
All AI providers MUST implement:
```ts
interface ChatProvider {
  streamResponse(messages, options?): AsyncGenerator<ChatStreamChunk>
  listModels(): Promise<readonly ChatModel[]>
}
```

## Environment Variables
Read from `.env` via `src/lib/server/env.ts` (uses `dotenv` for scripts, `$env/static/private` for SvelteKit server):

```env
DATABASE_URL=      # Preferred: mysql://USER:PASSWORD@HOST:PORT/DATABASE (URL-encode special characters in the password)
MYSQL_HOST=       # Fallback host if DATABASE_URL is unset
MYSQL_PORT=       # Fallback port
MYSQL_USER=       # Fallback user
MYSQL_PASSWORD=   # Fallback password
MYSQL_DATABASE=   # Fallback database name (default: ai_platform)
SESSION_SECRET=   # Cookie signing secret
OPENROUTER_API_KEY=           # OpenRouter API key (Bearer)
OPENROUTER_HTTP_REFERER=      # Optional HTTP-Referer header for OpenRouter
OPENROUTER_DEFAULT_MODEL=     # Default model id if client omits model (e.g. google/gemini-2.0-flash-001)
VISION_RELAY_ENABLED=         # true/false — summarize images for non-vision models
VISION_RELAY_MODEL=           # OpenRouter vision model for relay
VISION_RELAY_MAX_TOKENS=      # Max tokens for relay description
BRAVE_SEARCH_API_KEY=         # Optional; Brave Search API key — enables web_search and image_search tools
BRAVE_SEARCH_MAX_RESULTS=     # Optional; unique web results (default 20, max 30)
BRAVE_SEARCH_MAX_OUTPUT_CHARS=# Optional; cap web_search tool output (default 28000)
BRAVE_SEARCH_EXTRA_SNIPPETS=  # Optional; extra snippets per result for richer context (default true)
BRAVE_SEARCH_IMAGE_MAX_RESULTS=# Optional; images for image_search (default 16, max 50)
BRAVE_SEARCH_COUNTRY=         # Optional; 2-letter country code (default US)
BRAVE_SEARCH_LANG=            # Optional; search language (default en)
FETCH_URL_MAX_CHARS=          # Optional; chars per fetch_url chunk (default 12000, max 32768)
FETCH_URL_MAX_PAGE_CHARS=     # Optional; max page text extracted (default 200000)
NOMINATIM_BASE_URL=           # Optional; default https://nominatim.openstreetmap.org
OSRM_BASE_URL=                # Optional; default https://router.project-osrm.org
MAP_HTTP_USER_AGENT=          # Optional; required by Nominatim policy (default Inkstream/1.0)
ELEVENLABS_API_KEY=           # Optional; enables dashboard voice mode (streaming TTS)
ELEVENLABS_VOICE_ID=          # Optional voice id (default Rachel)
ELEVENLABS_MODEL_ID=          # Optional model (default eleven_flash_v2_5)
OPENROUTER_IMAGE_MODEL=       # Image model for generate_image tool (e.g. google/gemini-2.5-flash-image)
OPENROUTER_IMAGE_GEN_ENABLED= # true/false — enable generate_image tool (default true)
PISTON_URL=                   # Optional; Piston base URL (e.g. https://piston.paredes.cloud) — enables execute_python
PISTON_PYTHON_VERSION=        # Optional; installed Python semver (default 3.12.0)
PISTON_RUN_TIMEOUT_MS=        # Optional; max run stage ms sent to Piston (default 3000; server may cap lower)
PISTON_MAX_OUTPUT_CHARS=      # Optional; truncate tool result for the model (default 32768)
```

Use **`DATABASE_URL`** when you want one connection string everywhere (local `.env` and production). If it is unset, the discrete `MYSQL_*` variables are used as before.

## Deployment (Docker / Coolify)

- **Image:** build from the repo root [`Dockerfile`](Dockerfile) (Node 20 Alpine, multi-stage: `npm ci` → `npm run build` → `npm prune --omit=dev`; runtime `CMD ["node","build"]`).
- **Port:** `@sveltejs/adapter-node` listens on **`PORT`** (default `3000` in the image). Coolify sets `PORT` automatically.
- **Env:** pass the same secrets as in `.env` (including `DATABASE_URL` or `MYSQL_*`, `SESSION_SECRET`, `OPENROUTER_API_KEY`, …).
- **Migrations:** run `npm run db:migrate` or `npm run db:push` once against that database (Coolify “deploy command”, SSH, or CI)—the container entrypoint does not migrate by default.
- **Health check:** `GET /health` returns `200` with `{ "status": "ok" }` (no auth). Use this path in Coolify or load balancer probes.

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(36) PK | UUID |
| email | varchar(255) | UNIQUE |
| name | varchar(255) | nullable |
| api_key | varchar(255) | nullable, used for Bearer auth |
| tts_voice_id | varchar(64) | nullable, ElevenLabs voice for TTS |
| created_at | timestamp | auto |

### conversations
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(36) PK | UUID |
| user_id | varchar(36) | FK to users |
| title | varchar(255) | auto from first prompt |
| created_at | timestamp | auto |
| updated_at | timestamp | auto |

### messages
| Column | Type | Notes |
|--------|------|-------|
| id | varchar(36) PK | UUID |
| conversation_id | varchar(36) | FK |
| role | varchar(20) | user/assistant/system |
| content | text | |
| created_at | timestamp | auto |

## Authentication

### Dual-Mode Resolution (src/lib/server/infrastructure/auth.ts)
1. Check `Authorization: Bearer <api_key>` header
2. Fall back to `session` cookie (contains user ID)

### Login Flow
- `POST /api/v1/auth/login` with `{ email }` → sets session cookie
- `POST /api/v1/auth/logout` → clears cookie
- Dashboard redirects unauthenticated users to `/login`

## API Endpoints

| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /api/v1/auth/login | No | Set session cookie |
| POST | /api/v1/auth/logout | Yes | Clear session |
| GET | /api/v1/conversations | Yes | List user's conversations |
| POST | /api/v1/conversations | Yes | Create conversation |
| GET | /api/v1/conversations/:id/messages | Yes | Get messages |
| POST | /api/v1/chat | Yes | Streaming chat (SSE) |
| GET | /api/v1/models | Yes | List available AI models |
| GET | /api/v1/tts/voices | Yes | List ElevenLabs voices (voice mode) |
| GET | /api/v1/tts/voices/:id/preview | Yes | Play ElevenLabs sample preview MP3 |
| PATCH | /api/v1/profile/tts-voice | Yes | Save user TTS voice preference |

### Chat Stream Format
Server-Sent Events (SSE). Each line: `data: {"type":"chunk","content":"..."}\n\n`
Final chunk: `data: {"type":"done","conversationId":"..."}\n\n`

## Common Tasks

### Add a New AI Provider
1. Create class in `src/lib/server/infrastructure/` implementing `ChatProvider`
2. Implement `streamResponse()` and `listModels()`
3. Swap injection in `src/routes/api/v1/chat/+server.ts`
4. Update `src/routes/api/v1/models/+server.ts` if provider-specific logic needed

### Add a New Database Entity
1. Add table to `src/lib/server/db/schema.ts`
2. Run `npm run db:push`
3. Create repository in `src/lib/server/repositories/`
4. Add types to `src/lib/server/domain/` if needed

### Add a New API Endpoint
1. Create `+server.ts` in `src/routes/api/v1/<resource>/`
2. Use Zod schema from `src/lib/server/validation/`
3. Delegate to a Service or Repository
4. Return `json()` or `error()` from `@sveltejs/kit`

### Modify the Dashboard UI
- Main page: `src/routes/dashboard/+page.svelte`
- Sub-components: `ConversationSidebar.svelte`, `ChatMessageList.svelte`, `ChatInput.svelte`, `ModelSelector.svelte`
- Data loading: `+page.server.ts` (server-side load)
- Dark theme colors: `#181825` (bg), `#1e1e2e` (panels), `#252537` (inputs), `#313244` (borders), `#45475a` (assistant msg), `#cdd6f4` (text), `#a6adc8` (muted)

## Commands
```bash
npm run dev          # Dev server
npm run build        # Production build
npm run check        # TypeScript + Svelte check
npm run db:push      # Push schema to MySQL
npm run db:generate  # Generate Drizzle migrations
npm run db:migrate   # Run migrations
npm run db:studio    # Drizzle Studio GUI
npm run vision:ping  # OpenRouter vision relay smoke test (OPENROUTER_API_KEY)
npm run image:ping   # Image generation smoke test (OPENROUTER_API_KEY, OPENROUTER_IMAGE_MODEL)
npm run piston:ping  # Piston Python execute_python smoke test (PISTON_URL)
```
- The app uses `type: "module"` in package.json (ESM only)
- No file should exceed 150 lines — extract components/functions when growing
- All API inputs validated with Zod before processing
- `DomainError` class used for business logic errors (carries HTTP status)
- `handleDomainError()` converts DomainErrors to SvelteKit `error()` responses
- `.env` is gitignored — never commit it

## Cursor Cloud specific instructions

### MySQL setup
MySQL 8 must be running locally before starting the dev server. In the Cloud Agent VM:
```bash
sudo mkdir -p /var/run/mysqld && sudo chown mysql:mysql /var/run/mysqld
sudo mysqld --user=mysql --daemonize
```
The root password is set to `devpassword` and the database is `ai_platform`.
Use `DATABASE_URL=mysql://root:devpassword@127.0.0.1:3306/ai_platform` in `.env` to override any injected `MYSQL_*` env vars that point to an external host.

After starting MySQL, run `npm run db:push` to ensure the schema is up to date.

### Environment variables
The VM has secrets injected for `OPENROUTER_API_KEY`, `MYSQL_*`, `BRAVE_SEARCH_API_KEY`, `PISTON_URL`, and Telegram vars. The `.env` file must set `DATABASE_URL` (pointing to local MySQL) and `SESSION_SECRET` at minimum. Env vars injected at the OS level are NOT overridden by `dotenv` — `DATABASE_URL` is used because `resolveMysqlConn()` checks it first.

### Running the app
- `npm run dev -- --host 0.0.0.0` starts Vite on port 5173.
- `npm run check` runs TypeScript + Svelte diagnostics (zero errors expected).
- `npm run build` produces a production build.
- Health check: `GET /health` returns `{"status":"ok"}`.
- Login uses email + password (`POST /api/v1/auth/signup` then `/login`).

### Gotchas
- MySQL TCP connection via `127.0.0.1` works; socket-based `localhost` may fail in this container environment.
- The `MYSQL_PORT` injected secret is `33066` (remote); the local MySQL listens on default `3306`. Always use `DATABASE_URL` in `.env` to avoid confusion.
