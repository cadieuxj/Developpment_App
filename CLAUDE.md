# Sovereign AI - Architectural Context

## ROLE
You are a Principal Software Architect and Full-Stack Engineer. Your mission is to build "Sovereign AI," a multi-tenant, AI-native IDE and development platform.

## ARCHITECTURAL STACK (2025/2026 Standards)

### Frontend & Framework
- **Framework**: Next.js 15 (App Router) with React Server Components (RSC) and Server Actions
- **Styling**: Tailwind CSS + Shadcn UI
- **Editor**: Monaco Editor (@monaco-editor/react) with Virtual File System (VFS)

### Backend & Database
- **Database**: PostgreSQL (via Neon/Supabase) with pgvector for RAG
- **ORM**: Drizzle ORM (optimized for serverless)
- **Authentication**: Clerk (Multi-tenant/B2B Organization support)
- **Async Processing**: BullMQ + Upstash Redis for heavy media (video/audio) generation

### AI & Compute Infrastructure
- **Compute/Sandbox**: E2B Code Interpreter SDK for stateful, sandboxed Python/JS execution
- **AI Gateway**: Portkey/Helicone Gateway (unified API, caching, and cost tracking)

### External Integrations
- **GitHub**: GitHub App model (not OAuth) for repository access
- **Vercel**: REST API for programmatic deployments
- **Wrike**: Bi-directional API for project management sync

## CORE FEATURES TO IMPLEMENT

### 1. AI-Native IDE
A browser-based Monaco editor with:
- IntelliSense (via .d.ts injection)
- Integrated "Run" buttons (Code Lenses)
- Code execution in E2B sandbox

### 2. Orchestrated Kanban
- Drag-and-drop board using dnd-kit
- Tickets store "AI Context" (JSONB) to feed agentic workflows
- Real-time updates across multi-tenant workspace

### 3. Wrike Bi-Directional Sync
- **Outgoing**: Creating or moving a card in our Kanban triggers Wrike Task creation/update via Webhooks
- **Incoming**: Updating a task in Wrike reflects instantly on our platform's board

### 4. Programmatic DevOps
- "Deploy" button using Vercel API
- Creates projects, links GitHub repos
- Injects encrypted environment variables

### 5. Financial Governance
- Real-time token usage tracking
- USD cost tracking per project
- Uses Portkey/Helicone metadata headers

## SECURITY CONSTRAINTS

### Database Security
- **RLS**: Strictly enforce Row Level Security on all PostgreSQL tables using `tenant_id`
- **Least Privilege**: Use the GitHub App model to limit repository access
- **Secrets**: All API keys injected into Vercel must use the `type: "encrypted"` flag

### Multi-Tenancy
- Every table MUST have a `tenant_id` (references organizations)
- Server Actions MUST validate tenant access before mutations
- API routes MUST check organization membership

## DATABASE SCHEMA

### Core Tables
1. **organizations** - Tenant root (synced with Clerk)
2. **projects** - AI projects with VFS state and settings
3. **tasks** - Kanban tickets with AI context (JSONB)
4. **ai_logs** - Token usage, cost tracking, and AI interaction history
5. **files** - Virtual File System entries
6. **deployments** - Vercel deployment tracking
7. **wrike_sync_state** - Bi-directional sync metadata

### Key Relationships
```
organizations (1) -> (N) projects
organizations (1) -> (N) tasks
projects (1) -> (N) files
projects (1) -> (N) deployments
projects (1) -> (N) ai_logs
tasks (1) -> (1) wrike_sync_state (optional)
```

## IMPLEMENTATION PHASES

### Phase 1: Foundation (Current)
- ✓ Setup Next.js 15 with App Router
- ✓ Configure Clerk Auth with multi-tenant support
- ✓ Create Drizzle/Postgres schema (Organizations, Projects, Tasks, AI_Logs, Files)
- ✓ Build Data Access Layer (DAL) with type-safe queries

### Phase 2: AI-Native IDE
- Build Monaco Editor with VFS integration
- Implement E2B Sandbox execution
- Create Code Lenses for "Run" buttons
- Add IntelliSense via .d.ts injection

### Phase 3: Orchestrated Kanban
- Implement dnd-kit drag-and-drop board
- Build Server Actions for task mutations
- Create Wrike API integration (bi-directional)
- Add real-time updates (optimistic UI)

### Phase 4: DevOps Automation
- Setup BullMQ worker for media tasks
- Build Vercel API integration (deployments)
- Implement GitHub App authentication
- Create deployment pipeline UI

### Phase 5: AI Gateway & Analytics
- Integrate Portkey for AI routing
- Build cost-analytics dashboards
- Implement token usage tracking
- Create financial governance reports

## DEVELOPMENT GUIDELINES

### Code Organization
```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── editor/            # Monaco Editor components
│   └── kanban/            # Kanban board components
├── lib/
│   ├── db/                # Drizzle schema + DAL
│   ├── actions/           # Server Actions
│   ├── integrations/      # External API clients
│   └── utils/             # Shared utilities
└── types/                 # TypeScript definitions
```

### Best Practices
- **Server Components First**: Use RSC by default, Client Components only when needed
- **Server Actions**: Prefer Server Actions over API routes for mutations
- **Type Safety**: Leverage Drizzle's type inference, no `any` types
- **Error Handling**: Always wrap async operations in try-catch
- **Validation**: Use Zod schemas for all external inputs
- **Caching**: Utilize Next.js 15 caching strategies (unstable_cache, revalidateTag)

## ENVIRONMENT VARIABLES

Required environment variables (store in `.env.local`):
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# E2B Sandbox
E2B_API_KEY=...

# Portkey/Helicone
PORTKEY_API_KEY=...
PORTKEY_VIRTUAL_KEY=...

# GitHub App
GITHUB_APP_ID=...
GITHUB_APP_PRIVATE_KEY=...

# Vercel API
VERCEL_API_TOKEN=...

# Wrike API
WRIKE_API_TOKEN=...
WRIKE_WEBHOOK_SECRET=...

# Upstash Redis
UPSTASH_REDIS_URL=...
UPSTASH_REDIS_TOKEN=...
```

## NEXT STEPS

1. Configure Clerk middleware for multi-tenant routing
2. Set up Drizzle migrations workflow
3. Build the first Server Action (create project)
4. Implement the Monaco Editor with VFS
5. Create the Kanban board UI

---

**Last Updated**: 2026-01-19
**Current Phase**: Phase 1 - Foundation
