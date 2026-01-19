# Sovereign AI

A multi-tenant, AI-native IDE and development platform built with Next.js 15, React Server Components, and modern AI infrastructure.

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React Server Components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Clerk (Multi-tenant/B2B)
- **Styling**: Tailwind CSS + Shadcn UI
- **Editor**: Monaco Editor with Virtual File System
- **AI Compute**: E2B Code Interpreter SDK
- **AI Gateway**: Portkey/Helicone
- **Async Processing**: BullMQ + Upstash Redis

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm/yarn
- PostgreSQL database (Neon/Supabase recommended)
- Required API keys (see `.env.example`)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

4. Generate and push the database schema:

```bash
npm run db:push
```

5. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

The platform uses a comprehensive multi-tenant schema with strict Row Level Security (RLS):

### Core Tables

- **organizations** - Tenant root (synced with Clerk)
- **projects** - AI projects with VFS state and settings
- **files** - Virtual File System entries
- **tasks** - Kanban tickets with AI context (JSONB)
- **ai_logs** - Token usage and cost tracking
- **deployments** - Vercel deployment tracking
- **wrike_sync_state** - Bi-directional sync metadata

All tables enforce tenant isolation via `tenant_id` foreign keys.

## Project Structure

```
src/
├── app/                    # Next.js 15 App Router
│   ├── (auth)/            # Auth routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # Shadcn UI components
│   ├── editor/            # Monaco Editor components
│   └── kanban/            # Kanban board components
├── lib/
│   ├── db/                # Drizzle schema + DAL
│   │   ├── schema.ts      # Database schema
│   │   ├── dal.ts         # Data Access Layer
│   │   └── index.ts       # DB connection
│   ├── actions/           # Server Actions
│   ├── integrations/      # External API clients
│   └── utils/             # Shared utilities
└── types/                 # TypeScript definitions
```

## Data Access Layer (DAL)

The DAL provides type-safe, multi-tenant database operations:

```typescript
import { dal } from "@/lib/db/dal";

// All DAL methods enforce tenant isolation
const projects = await dal.projects.getAllByTenant(tenantId);
const project = await dal.projects.getById(projectId, tenantId);
```

## Development Phases

### ✅ Phase 1: Foundation (Current)
- Next.js 15 setup with App Router
- Drizzle/Postgres schema
- Data Access Layer with type-safe queries
- Multi-tenant architecture

### Phase 2: AI-Native IDE
- Monaco Editor with VFS integration
- E2B Sandbox execution
- Code Lenses for "Run" buttons
- IntelliSense via .d.ts injection

### Phase 3: Orchestrated Kanban
- dnd-kit drag-and-drop board
- Wrike API integration (bi-directional)
- Real-time updates

### Phase 4: DevOps Automation
- BullMQ worker for media tasks
- Vercel API integration
- GitHub App authentication
- Deployment pipeline UI

### Phase 5: AI Gateway & Analytics
- Portkey integration
- Cost-analytics dashboards
- Token usage tracking
- Financial governance reports

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:generate` - Generate migrations
- `npm run db:migrate` - Run migrations
- `npm run db:push` - Push schema to database
- `npm run db:studio` - Open Drizzle Studio

## Documentation

See [CLAUDE.md](./CLAUDE.md) for comprehensive architectural context and implementation guidelines.

## License

Proprietary - All rights reserved
