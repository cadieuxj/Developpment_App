# Sovereign AI

> **A production-ready, multi-tenant, AI-native IDE and development platform**

Build, deploy, and manage AI-powered applications with an integrated code editor, automated CI/CD, real-time cost tracking, and seamless third-party integrations.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-Proprietary-red)](./LICENSE)

---

## 🚨 First Time Setup

If you're seeing **"Organization not found"** when accessing the dashboard, you need to sync your Clerk organization to the database.

**Quick fix:**
```bash
npm run org:create <your-clerk-org-id> "Your Organization Name"
```

See [SETUP.md](./SETUP.md) for detailed setup instructions.

---

## 🌟 Features

### 🎨 AI-Native IDE
- **Monaco Editor** with full IntelliSense support
- **Virtual File System (VFS)** with hierarchical navigation
- **E2B Code Interpreter** for secure, sandboxed code execution (Python, JavaScript, TypeScript)
- **Real-time output** with logs, errors, and execution metrics
- **Multi-file project management** with language detection

### 📋 Orchestrated Kanban
- **Drag-and-drop** task board powered by dnd-kit
- **4 status columns**: To Do, In Progress, Review, Done
- **Priority-based color coding**: Low, Medium, High, Urgent
- **AI Context Storage** (JSONB) for agentic workflows
- **Wrike bi-directional sync** with webhook integration

### 🚀 Programmatic DevOps
- **One-click Vercel deployments** via REST API
- **GitHub App integration** for repository access (not OAuth)
- **Encrypted environment variables** with automatic injection
- **Build log tracking** and error diagnostics
- **Deployment history** with status monitoring

### 💰 Financial Governance
- **Real-time cost tracking** per project and organization
- **Token usage analytics** with model-level breakdowns
- **Historical cost charts** (30-day trends)
- **AI request monitoring** with Portkey/Helicone integration
- **Budget alerts** and financial reporting

### 🔗 Integration Hub
- **GitHub** - Automated repository access and webhooks
- **Vercel** - Programmatic deployments and domain management
- **Wrike** - Bi-directional task synchronization
- **Portkey AI Gateway** - Unified API with cost tracking and caching

---

## 🏗️ Architecture

### Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | Next.js 15 (App Router) with React Server Components |
| **Language** | TypeScript 5.7 |
| **Database** | PostgreSQL (Neon/Supabase) with pgvector |
| **ORM** | Drizzle ORM (serverless-optimized) |
| **Authentication** | Clerk (Multi-tenant/B2B Organizations) |
| **Styling** | Tailwind CSS + Shadcn UI |
| **Editor** | Monaco Editor (@monaco-editor/react) |
| **Code Execution** | E2B Code Interpreter SDK |
| **AI Gateway** | Portkey/Helicone |
| **Async Processing** | BullMQ + Upstash Redis |
| **Drag & Drop** | dnd-kit |

### Database Schema

The platform enforces **strict Row Level Security (RLS)** with tenant isolation via `tenant_id`:

- **organizations** - Multi-tenant root
- **projects** - AI projects with VFS
- **files** - Virtual File System
- **tasks** - Kanban with AI context
- **ai_logs** - Token/cost tracking
- **deployments** - Vercel tracking
- **wrike_sync_state** - Bi-directional sync

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon/Supabase)
- API keys (see Environment Variables)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/sovereign-ai.git
cd sovereign-ai

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Fill in your API keys

# Setup database
npm run db:push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔐 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# E2B
E2B_API_KEY="..."

# Portkey
PORTKEY_API_KEY="..."

# GitHub
GITHUB_APP_ID="..."
GITHUB_APP_PRIVATE_KEY="..."

# Vercel
VERCEL_API_TOKEN="..."

# Wrike
WRIKE_API_TOKEN="..."
WRIKE_WEBHOOK_SECRET="..."

# Upstash Redis
UPSTASH_REDIS_URL="..."
UPSTASH_REDIS_TOKEN="..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📜 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |

---

## 🚀 CI/CD Pipeline

### Deployment Flow

1. **Code Push** → GitHub repository
2. **Webhook** → Triggers Vercel API
3. **Build** → Environment vars injected
4. **Deploy** → Edge network distribution
5. **Track** → Real-time status updates
6. **Notify** → User notifications

### Manual Deployment

Navigate to `/dashboard/deployments`:
1. Click "New Deployment"
2. Select project & branch
3. Add environment variables
4. Click "Deploy"

### Status Tracking

- **Queued** - Request submitted
- **Building** - Running build
- **Deploying** - Uploading
- **Ready** - Live
- **Error** - Failed (logs available)

---

## 📊 Pages

| Route | Features |
|-------|----------|
| `/dashboard` | Overview with stats |
| `/dashboard/projects` | Project management |
| `/dashboard/tasks` | Kanban board |
| `/dashboard/editor` | Monaco IDE with VFS |
| `/dashboard/deployments` | Deployment management |
| `/dashboard/analytics` | Cost tracking |
| `/dashboard/integrations` | Integration hub |

---

## 🗄️ Data Access Layer

```typescript
import { dal } from '@/lib/db/dal';

// Type-safe, tenant-validated queries
const projects = await dal.projects.getAllByTenant(tenantId);
const project = await dal.projects.getById(projectId);
```

---

## 🔒 Security

- **RLS**: All queries validate `tenant_id`
- **Encrypted Secrets**: Vercel env vars
- **GitHub App**: Least-privilege access
- **Clerk**: Multi-tenant authentication
- **Webhooks**: Signature verification

---

## 🎯 Status

### ✅ Completed
- [x] Authentication (Clerk)
- [x] Database schema with RLS
- [x] Monaco Editor with VFS
- [x] E2B code execution
- [x] Kanban board (dnd-kit)
- [x] Vercel deployments
- [x] Cost tracking
- [x] Wrike sync
- [x] GitHub integration

### 🚧 Roadmap
- [ ] Real-time collaboration
- [ ] AI chat interface
- [ ] Advanced Code Lenses
- [ ] Custom domains

---

## 📚 Documentation

- [CLAUDE.md](./CLAUDE.md) - Architecture
- [Next.js](https://nextjs.org/docs)
- [Drizzle ORM](https://orm.drizzle.team/)
- [E2B](https://e2b.dev/docs)
- [Clerk](https://clerk.com/docs)

---

## 📄 License

**Proprietary** - All rights reserved

---

**Made with ❤️ by the Sovereign AI team**
