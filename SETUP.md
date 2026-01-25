# Sovereign AI - Setup Guide

## Initial Setup Issue: "Organization not found"

If you're seeing "Organization not found" when accessing dashboard pages, this means your Clerk organization hasn't been synced to the database yet.

## Quick Fix (Manual Sync)

### Step 1: Get your Clerk Organization ID

1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to your organization
3. Copy the Organization ID (starts with `org_`)

### Step 2: Create the organization in the database

Run this command (replace with your values): t

```bash
npm run org:create <clerk-org-id> "Organization Name" [optional-slug]
```

**Example with custom slug:**
```bash
npm run org:create org_2abc123xyz "Acme Corporation" acme-corp
```

**Example with auto-generated slug (recommended):**
```bash
npm run org:create org_2abc123xyz "Acme Corporation"
```

The slug will be auto-generated from the organization name if not provided (e.g., "Acme Corporation" → "acme-corporation").

### Step 3: Refresh your browser

After running the command, refresh your dashboard. You should now be able to access all pages!

---

## Permanent Fix (Clerk Webhooks)

For production, you should set up Clerk webhooks to automatically sync organizations.

### Step 1: Add webhook secret to .env.local

```bash
CLERK_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
```

### Step 2: Configure webhook in Clerk Dashboard

1. Go to: https://dashboard.clerk.com/apps/[your-app-id]/webhooks
2. Click "Add Endpoint"
3. Set the endpoint URL to: `https://yourdomain.com/api/webhooks/clerk`
4. Subscribe to these events:
   - `organization.created`
   - `organization.updated`
   - `organization.deleted`
5. Copy the "Signing Secret" and add it to `.env.local` as `CLERK_WEBHOOK_SECRET`

### Step 3: For local development (using ngrok)

```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Use the ngrok URL in Clerk webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/clerk
```

---

## Database Setup

If you haven't set up the database yet:

### Local Docker database (optional)

If you want a local Postgres database in Docker:

```bash
docker compose up -d db
```

Then set these in `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sovereign_ai"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/sovereign_ai"
```

The container runs init scripts that enable `pgcrypto` and load the initial Drizzle migration from `drizzle/`.

### Step 1: Configure environment variables

Create a `.env.local` file with:

```bash
# Database (Supabase example)
DATABASE_URL="postgresql://postgres.[project-id]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[project-id]:[password]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..." # For webhooks
```

### Step 2: Push the schema to database

```bash
npm run db:push
```

### Step 3: Verify schema in Drizzle Studio

```bash
npm run db:studio
```

This opens a browser-based database explorer at http://localhost:4983

---

## Complete Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

# E2B Code Execution
E2B_API_KEY="..."

# Portkey AI Gateway
PORTKEY_API_KEY="..."
PORTKEY_VIRTUAL_KEY="..."

# GitHub App
GITHUB_APP_ID="..."
GITHUB_APP_PRIVATE_KEY="..."

# Vercel API
VERCEL_API_TOKEN="..."

# Wrike Integration
WRIKE_API_TOKEN="..."
WRIKE_WEBHOOK_SECRET="..."

# Upstash Redis (for BullMQ)
UPSTASH_REDIS_URL="..."
UPSTASH_REDIS_TOKEN="..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Troubleshooting

### Issue: "password authentication failed for user postgres"

**Cause:** Incorrect database connection string format

**Fix:** Supabase requires TWO connection strings:
- `DATABASE_URL` - Connection pooler (port 6543)
- `DIRECT_URL` - Direct connection (port 5432)

Make sure both are set correctly in `.env.local`

---

### Issue: "Organization not found" after signing in

**Cause:** Clerk organization not synced to database

**Fix:** Use the manual sync command:
```bash
npm run org:create <clerk-org-id> "Org Name"
```

---

### Issue: Monaco Editor not loading

**Cause:** Large bundle size or missing files

**Fix:**
1. Check browser console for errors
2. Ensure `@monaco-editor/react` is installed
3. Try clearing `.next` cache: `rm -rf .next && npm run dev`

---

### Issue: Build fails with OneDrive errors

**Cause:** OneDrive file locking during build

**Fix:**
- Use `npm run dev` instead of `npm run build` for development
- Or move project outside OneDrive folder
- Or exclude `.next/` folder from OneDrive sync

---

## Development Workflow

```bash
# Start development server
npm run dev

# Open in browser
http://localhost:3000

# Sign in with Clerk
# Create organization in Clerk Dashboard
# Run org sync command
npm run org:create <clerk-org-id> "Org Name"

# Refresh browser - you're in!
```

---

## Next Steps

Once you can access the dashboard:

1. **Create a project** - Go to `/dashboard/projects` and click "New Project"
2. **Open the IDE** - Go to `/dashboard/editor` to see Monaco editor
3. **View Kanban board** - Go to `/dashboard/tasks`
4. **Check integrations** - Go to `/dashboard/integrations` to set up GitHub, Vercel, Wrike

---

## Need Help?

- Check [CLAUDE.md](./CLAUDE.md) for architecture details
- Check [README.md](./README.md) for feature documentation
- Review database schema: `npm run db:studio`

---

**Last Updated:** 2026-01-19
