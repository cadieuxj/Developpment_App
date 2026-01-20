# Clerk Webhook Testing Guide

## ✅ Health Check Verification

Your webhook endpoint is now accessible and includes a GET health check:

```bash
curl https://developpment-app.vercel.app/api/webhooks/clerk
```

**Expected Response:**
```json
{
  "status": "ok",
  "message": "Clerk webhook endpoint is accessible",
  "timestamp": "2026-01-20T02:59:16.790Z"
}
```

## 🔧 Configure Webhook in Clerk Dashboard

### Step 1: Add Webhook Endpoint

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Navigate to **Webhooks** in the sidebar
4. Click **Add Endpoint**
5. Enter URL: `https://developpment-app.vercel.app/api/webhooks/clerk`
6. Subscribe to these events:
   - ✅ `organization.created`
   - ✅ `organization.updated`
   - ✅ `organization.deleted`
7. Copy the **Signing Secret** (starts with `whsec_`)

### Step 2: Verify Environment Variable

Make sure `CLERK_WEBHOOK_SECRET` is set in Vercel:

```bash
vercel env ls | grep CLERK_WEBHOOK_SECRET
```

Should show it's encrypted and available in Production.

## 🧪 Testing the Webhook

### Option 1: Create Organization via Clerk Dashboard

1. In Clerk Dashboard, go to **Organizations**
2. Click **Create Organization**
3. Fill in organization details
4. Click **Create**
5. Monitor Vercel logs for webhook events

### Option 2: Use Clerk's Test Feature

1. In Clerk Dashboard, go to **Webhooks**
2. Click on your webhook endpoint
3. Click **Send Test Event**
4. Select `organization.created`
5. Click **Send**

### Option 3: Create Organization via Your App

1. Visit your app: https://developpment-app.vercel.app
2. Sign in with Clerk
3. Create a new organization through your UI
4. Check database to verify sync

## 📊 Monitor Webhook Events

### View Real-time Logs

```bash
vercel logs --follow
```

Look for these log patterns:

**Successful Organization Creation:**
```
[Clerk Webhook] 📥 Received webhook request
[Clerk Webhook] 🔍 Svix Headers: { id: '...', timestamp: '...', signature: '***' }
[Clerk Webhook] ✅ Signature verified successfully
[Clerk Webhook] 📋 Event type: organization.created
[Clerk Webhook] 🏢 Creating organization: { id: 'org_...', name: '...', slug: '...' }
[Clerk Webhook] ✅ Organization created successfully: { clerkOrgId: 'org_...', name: '...', slug: '...' }
[Clerk Webhook] ✅ Webhook processed successfully
```

**Failed Verification:**
```
[Clerk Webhook] ❌ Signature verification failed: ...
```

**Database Error:**
```
[Clerk Webhook] ❌ Failed to create organization: ...
```

## 🔍 Verify Database Sync

After creating an organization via Clerk, verify it's in your database:

```bash
# Connect to your database and run:
SELECT * FROM organizations ORDER BY created_at DESC LIMIT 5;
```

Or use the manual script:

```bash
# List all organizations
tsx scripts/list-organizations.ts

# Manually create one if webhook failed
tsx scripts/create-organization.ts org_abc123 "My Organization" my-org
```

## 🚨 Troubleshooting

### Problem: 405 Method Not Allowed

**Cause:** Accessing webhook URL with GET request in browser
**Solution:** This is normal! Clerk sends POST requests. Use the health check endpoint to verify accessibility.

### Problem: 400 Verification Failed

**Cause:** Webhook secret mismatch
**Solution:**
1. Get the correct secret from Clerk Dashboard → Webhooks → Your Endpoint → Signing Secret
2. Update in Vercel: `vercel env add CLERK_WEBHOOK_SECRET production`
3. Redeploy: `vercel --prod`

### Problem: Organization Not Created in Database

**Cause:** Database connection issue or RLS policy blocking insert
**Solution:**
1. Check Vercel logs for detailed error
2. Verify `DATABASE_URL` and `DIRECT_URL` are set correctly
3. Check PostgreSQL RLS policies on `organizations` table

### Problem: No Webhook Events Received

**Cause:** Webhook not configured in Clerk
**Solution:**
1. Verify webhook endpoint is added in Clerk Dashboard
2. Check that events are subscribed (`organization.*`)
3. Send a test event from Clerk Dashboard

## 📝 Webhook Event Payloads

### organization.created

```json
{
  "type": "organization.created",
  "data": {
    "id": "org_abc123",
    "name": "My Organization",
    "slug": "my-organization",
    "created_at": 1737339600000
  }
}
```

### organization.updated

```json
{
  "type": "organization.updated",
  "data": {
    "id": "org_abc123",
    "name": "Updated Organization Name",
    "slug": "updated-org"
  }
}
```

### organization.deleted

```json
{
  "type": "organization.deleted",
  "data": {
    "id": "org_abc123"
  }
}
```

## ✅ Success Checklist

- [x] Health check endpoint returns 200 OK
- [x] Webhook endpoint added in Clerk Dashboard
- [x] `CLERK_WEBHOOK_SECRET` set in Vercel Production
- [ ] Test event sent from Clerk Dashboard
- [ ] Organization created via Clerk syncs to database
- [ ] Logs show successful webhook processing
- [ ] Database contains organization record

## 🔗 Useful Commands

```bash
# Check deployment status
vercel ls

# View production logs
vercel logs --follow

# Test health check
curl https://developpment-app.vercel.app/api/webhooks/clerk

# Redeploy to production
vercel --prod

# List environment variables
vercel env ls

# Create organization manually
tsx scripts/create-organization.ts org_abc123 "Test Org"
```

---

**Last Updated:** 2026-01-20
**Endpoint:** `https://developpment-app.vercel.app/api/webhooks/clerk`
**Status:** ✅ Deployed and Accessible
