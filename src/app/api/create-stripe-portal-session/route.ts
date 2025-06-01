// src/app/api/create-stripe-portal-session/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    console.log('[PortalSession] Auth user:', user);
    if (authError || !user) {
      console.error('[PortalSession] Auth error or no user:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // Fetch the user's Stripe customer ID from the subscriptions table
    const { data: subRow, error: subDbError } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    console.log('[PortalSession] DB subRow:', subRow, 'DB error:', subDbError);
    if (subDbError || !subRow?.stripe_customer_id) {
      console.error(
        '[PortalSession] No Stripe customer found for user:',
        user.id
      );
      return NextResponse.json(
        { error: 'No Stripe customer found.' },
        { status: 400 }
      );
    }
    console.log(
      '[PortalSession] Creating portal session for customer:',
      subRow.stripe_customer_id
    );
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subRow.stripe_customer_id,
      return_url:
        process.env.NEXT_PUBLIC_BASE_URL ||
        'http://localhost:3000/dashboard/billing',
    });
    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('[PortalSession] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to create portal session.' },
      { status: 500 }
    );
  }
}
