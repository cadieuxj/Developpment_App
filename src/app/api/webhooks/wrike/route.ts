import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Wrike Webhook Handler
 *
 * This endpoint receives webhook events from Wrike for bi-directional sync.
 * When a task is updated in Wrike, this webhook is triggered to sync changes
 * to our platform's Kanban board.
 *
 * @see https://developers.wrike.com/webhooks/
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hook-signature');

    // Verify webhook signature
    const secret = process.env.WRIKE_WEBHOOK_SECRET;
    if (!secret) {
      console.error('WRIKE_WEBHOOK_SECRET is not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    // Validate signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    const payload = JSON.parse(body);

    console.log('Received Wrike webhook:', {
      type: payload.type,
      taskId: payload.taskId,
      timestamp: new Date().toISOString()
    });

    // TODO: Implement webhook processing logic
    // - Map Wrike task to internal task
    // - Update task status in database
    // - Trigger real-time updates to connected clients

    return NextResponse.json(
      { success: true, message: 'Webhook processed' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error processing Wrike webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle Wrike webhook verification (handshake)
 * Wrike sends a GET request to verify the webhook URL
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');

  if (challenge) {
    // Respond to Wrike's verification challenge
    return new NextResponse(challenge, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }

  return NextResponse.json(
    { message: 'Wrike webhook endpoint is active' },
    { status: 200 }
  );
}
