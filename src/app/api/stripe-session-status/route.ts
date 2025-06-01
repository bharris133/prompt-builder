// src/app/api/stripe-session-status/route.ts // COMPLETE NEW FILE
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
// No Supabase client needed here if just verifying Stripe session

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) throw new Error('Stripe secret key not set.');
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'Checkout session ID is required.' },
      { status: 400 }
    );
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (
      session &&
      session.payment_status === 'paid' &&
      session.status === 'complete'
    ) {
      // Customer ID can be useful if you want to link it here,
      // though webhook should have already done main DB update.
      const customerId =
        typeof session.customer === 'string'
          ? session.customer
          : session.customer?.id;
      return NextResponse.json({
        success: true,
        status: session.status,
        payment_status: session.payment_status,
        customer: customerId,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription payment not confirmed or session not complete.',
          status: session?.status,
          payment_status: session?.payment_status,
        },
        { status: 402 }
      ); // Payment Required or other appropriate status
    }
  } catch (error: any) {
    console.error('[API Stripe Session Status] Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve checkout session.', details: error.message },
      { status: 500 }
    );
  }
}
