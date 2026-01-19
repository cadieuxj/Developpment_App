/**
 * Script to register Wrike webhook
 *
 * This script creates a webhook in Wrike that will send events to our platform
 * when tasks are created or updated.
 *
 * Usage:
 *   npx tsx scripts/setup-wrike-webhook.ts
 *
 * Environment variables required:
 *   - WRIKE_API_TOKEN: Your Wrike API token
 *   - NEXT_PUBLIC_VERCEL_URL or custom webhook URL
 */

import crypto from 'crypto';

const WRIKE_API_BASE = 'https://www.wrike.com/api/v4';

interface WrikeWebhookResponse {
  kind: string;
  data: Array<{
    id: string;
    accountId: string;
    hookUrl: string;
    status: string;
  }>;
}

async function setupWrikeWebhook() {
  const apiToken = process.env.WRIKE_API_TOKEN;

  if (!apiToken) {
    throw new Error('WRIKE_API_TOKEN environment variable is required');
  }

  // Determine webhook URL
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
  const webhookUrl = process.env.WRIKE_WEBHOOK_URL ||
    (vercelUrl ? `https://${vercelUrl}/api/webhooks/wrike` : null);

  if (!webhookUrl) {
    throw new Error(
      'Please provide WRIKE_WEBHOOK_URL or deploy to Vercel to auto-detect URL.\n' +
      'Example: WRIKE_WEBHOOK_URL=https://your-domain.com/api/webhooks/wrike'
    );
  }

  console.log('Setting up Wrike webhook...');
  console.log('Webhook URL:', webhookUrl);

  // Generate a secure webhook secret
  const webhookSecret = crypto.randomBytes(32).toString('hex');

  // Create webhook in Wrike
  const response = await fetch(`${WRIKE_API_BASE}/webhooks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      hookUrl: webhookUrl,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create Wrike webhook: ${response.status} ${errorText}`);
  }

  const data: WrikeWebhookResponse = await response.json();

  console.log('\n✅ Wrike webhook created successfully!');
  console.log('\nWebhook Details:');
  console.log('  ID:', data.data[0].id);
  console.log('  URL:', data.data[0].hookUrl);
  console.log('  Status:', data.data[0].status);

  console.log('\n🔑 IMPORTANT: Save this webhook secret!');
  console.log('\nAdd this to your .env.local and .env.example:');
  console.log(`WRIKE_WEBHOOK_SECRET=${webhookSecret}`);

  console.log('\n📝 Next steps:');
  console.log('1. Add WRIKE_WEBHOOK_SECRET to your .env.local file');
  console.log('2. Add WRIKE_WEBHOOK_SECRET to Vercel environment variables:');
  console.log(`   vercel env add WRIKE_WEBHOOK_SECRET production`);
  console.log(`   vercel env add WRIKE_WEBHOOK_SECRET preview`);
  console.log(`   vercel env add WRIKE_WEBHOOK_SECRET development`);

  return {
    webhookId: data.data[0].id,
    webhookSecret,
  };
}

// Run the script
setupWrikeWebhook()
  .then(() => {
    console.log('\n✨ Setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error setting up webhook:', error.message);
    process.exit(1);
  });
