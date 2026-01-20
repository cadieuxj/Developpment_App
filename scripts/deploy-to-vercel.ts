import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

/**
 * Deploy to Vercel and sync environment variables
 *
 * This script:
 * 1. Reads .env.local
 * 2. Pushes environment variables to Vercel
 * 3. Deploys the application
 *
 * Usage:
 * npm run deploy
 */

async function deployToVercel() {
  console.log('🚀 Starting Vercel deployment...\n');

  // Check if .env.local exists
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local file not found!');
    console.error('Please create a .env.local file with your environment variables.');
    process.exit(1);
  }

  // Read .env.local
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = envContent
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [key, ...valueParts] = line.split('=');
      return {
        key: key.trim(),
        value: valueParts.join('=').trim().replace(/^["']|["']$/g, ''),
      };
    });

  console.log(`📝 Found ${envVars.length} environment variables\n`);

  // Push environment variables to Vercel
  console.log('🔐 Pushing environment variables to Vercel...\n');

  for (const { key, value } of envVars) {
    try {
      // Remove existing variable first (if it exists)
      try {
        execSync(
          `vercel env rm ${key} production --yes`,
          { stdio: 'pipe' }
        );
      } catch {
        // Variable doesn't exist, that's fine
      }

      // Add the variable for production
      execSync(
        `echo ${value} | vercel env add ${key} production`,
        { stdio: 'inherit' }
      );
      console.log(`  ✅ ${key}`);
    } catch (error) {
      console.error(`  ❌ Failed to set ${key}`);
    }
  }

  console.log('\n✅ Environment variables synced!\n');

  // Deploy to production
  console.log('🚀 Deploying to production...\n');

  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('\n✅ Deployment successful!\n');
  } catch (error) {
    console.error('\n❌ Deployment failed');
    process.exit(1);
  }
}

deployToVercel().catch(console.error);
