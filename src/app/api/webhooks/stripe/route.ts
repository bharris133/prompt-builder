// src/app/api/webhooks/stripe/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey)
  throw new Error('Stripe secret key is not set for webhooks.');
const stripe = new Stripe(stripeSecretKey!, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
if (!webhookSecret) throw new Error('Stripe webhook secret is not set.');

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// Helper to get your internal plan_id from Stripe Price or Product metadata
function getPlanIdFromStripePrice(
  price: Stripe.Price | null | undefined
): string {
  let planId = 'unknown_plan';
  if (price?.metadata?.app_plan_id) planId = price.metadata.app_plan_id;
  else if (
    price?.product &&
    typeof price.product === 'object' &&
    'metadata' in price.product &&
    price.product.metadata?.app_plan_id
  )
    planId = price.product.metadata.app_plan_id;
  else if (
    price?.product &&
    typeof price.product === 'object' &&
    'id' in price.product
  )
    planId = price.product.id;
  else if (price?.product && typeof price.product === 'string')
    planId = price.product;
  return planId;
}

// Helper function to update user subscription status in your DB
async function updateUserSubscriptionInDb(
  userId: string,
  stripeSubscription: Stripe.Subscription // Expect the full Stripe.Subscription object
) {
  const planId = getPlanIdFromStripePrice(
    stripeSubscription.items.data[0]?.price
  );
  const customerId =
    typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer.id;

  console.log(
    `[Webhook] Updating DB for user ${userId}: Plan=${planId}, Status=${stripeSubscription.status}, StripeSubID=${stripeSubscription.id}`
  );

  const { error } = await supabaseAdmin.from('subscriptions').upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: stripeSubscription.status,
      stripe_customer_id: customerId,
      stripe_subscription_id: stripeSubscription.id,
      current_period_end: stripeSubscription.items.data[0]?.current_period_end
        ? new Date(
            stripeSubscription.items.data[0].current_period_end * 1000
          ).toISOString()
        : null,
      trial_ends_at: (stripeSubscription as any).trial_end
        ? new Date((stripeSubscription as any).trial_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
      cancel_at_period_end: stripeSubscription.cancel_at_period_end,
    },
    { onConflict: 'user_id' }
  );

  if (error) {
    console.error('[Webhook] DB Error upserting subscription:', error);
    throw error;
  }
  console.log(
    `[Webhook] Successfully updated DB subscription for user ${userId}.`
  );
}

// Helper to get Supabase User ID
async function getSupabaseUserIdFromStripe(
  stripeCustomerIdOrObject:
    | string
    | Stripe.Customer
    | Stripe.DeletedCustomer
    | null,
  stripeSubscriptionObject?: Stripe.Subscription | null // Pass full subscription if available
): Promise<string | null> {
  if (stripeSubscriptionObject?.metadata?.supabase_user_id)
    return stripeSubscriptionObject.metadata.supabase_user_id;
  // Try customer object from subscription first if it's expanded
  if (
    stripeSubscriptionObject?.customer &&
    typeof stripeSubscriptionObject.customer === 'object' &&
    'metadata' in stripeSubscriptionObject.customer
  ) {
    return stripeSubscriptionObject.customer.metadata?.supabase_user_id || null;
  }
  // Fallback to passed customer ID or object
  let customerIdString: string | null = null;
  if (typeof stripeCustomerIdOrObject === 'string')
    customerIdString = stripeCustomerIdOrObject;
  else if (stripeCustomerIdOrObject && 'id' in stripeCustomerIdOrObject)
    customerIdString = stripeCustomerIdOrObject.id;

  if (customerIdString) {
    try {
      const customer = await stripe.customers.retrieve(customerIdString);
      if (customer && !customer.deleted)
        return (customer as Stripe.Customer).metadata?.supabase_user_id || null;
    } catch (e) {
      console.error(
        '[Webhook] Error retrieving customer for supabase_user_id:',
        e
      );
    }
  }
  return null;
}

export async function POST(request: Request) {
  if (!webhookSecret)
    return NextResponse.json(
      { error: 'Webhook secret not configured.' },
      { status: 500 }
    );
  const signature = request.headers.get('stripe-signature');
  if (!signature)
    return NextResponse.json(
      { error: 'Missing Stripe signature.' },
      { status: 400 }
    );
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  console.log(`[Webhook] Received event: ${event.type}, ID: ${event.id}`);
  const dataObject = event.data.object;
  console.log('[Webhook] Event data object:', JSON.stringify(dataObject, null, 2));

  try {
    let stripeSubscription: Stripe.Subscription | null = null;
    let supabaseUserId: string | null = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = dataObject as Stripe.Checkout.Session;
        console.log('[Webhook] checkout.session.completed session:', JSON.stringify(session, null, 2));
        if (
          session.mode === 'subscription' &&
          session.subscription &&
          session.customer
        ) {
          const subscriptionId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id;
          supabaseUserId = session.metadata?.supabase_user_id ?? null;
          if (supabaseUserId) {
            stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
            console.log('[Webhook] Retrieved Stripe subscription:', JSON.stringify(stripeSubscription, null, 2));
          } else {
            console.error('[Webhook] Missing supabase_user_id in checkout session metadata.');
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subObj = dataObject as Stripe.Subscription;
        console.log(`[Webhook] customer.subscription.* subObj:`, JSON.stringify(subObj, null, 2));
        stripeSubscription = await stripe.subscriptions.retrieve(subObj.id);
        console.log('[Webhook] Retrieved Stripe subscription:', JSON.stringify(stripeSubscription, null, 2));
        supabaseUserId = await getSupabaseUserIdFromStripe(
          stripeSubscription.customer,
          stripeSubscription
        );
        console.log('[Webhook] Resolved supabaseUserId:', supabaseUserId);
        break;
      }
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = dataObject as Stripe.Invoice;
        console.log(`[Webhook] invoice.payment_* invoice:`, JSON.stringify(invoice, null, 2));
        const subscription: any = (invoice as any).subscription;
        let subscriptionIdToFetch: string | null = null;
        if (typeof subscription === 'string') {
          subscriptionIdToFetch = subscription;
        } else if (
          subscription &&
          typeof subscription === 'object' &&
          'id' in subscription
        ) {
          subscriptionIdToFetch = subscription.id;
        }
        if (subscriptionIdToFetch) {
          stripeSubscription = await stripe.subscriptions.retrieve(
            subscriptionIdToFetch
          );
          console.log('[Webhook] Retrieved Stripe subscription:', JSON.stringify(stripeSubscription, null, 2));
          supabaseUserId = await getSupabaseUserIdFromStripe(
            stripeSubscription.customer,
            stripeSubscription
          );
          console.log('[Webhook] Resolved supabaseUserId:', supabaseUserId);
        } else {
          console.warn(`[Webhook] ${event.type}: No subscription ID on invoice.`);
        }
        break;
      }
      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    if (stripeSubscription && supabaseUserId) {
      console.log('[Webhook] About to update DB with:', {
        userId: supabaseUserId,
        stripeSubscriptionId: stripeSubscription.id,
        customerId: typeof stripeSubscription.customer === 'string' ? stripeSubscription.customer : stripeSubscription.customer.id,
      });
      await updateUserSubscriptionInDb(supabaseUserId, stripeSubscription);
    } else if (
      supabaseUserId &&
      dataObject &&
      'customer' in dataObject &&
      dataObject.customer
    ) {
      const customerId =
        typeof dataObject.customer === 'string'
          ? dataObject.customer
          : dataObject.customer.id;
      console.log('[Webhook] Fallback upsert for user:', supabaseUserId, 'with customer:', customerId);
      const { data: existing, error: fetchErr } = await supabaseAdmin
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', supabaseUserId)
        .single();
      if (!fetchErr && (!existing || !existing.stripe_customer_id)) {
        const { error: upsertErr } = await supabaseAdmin
          .from('subscriptions')
          .upsert(
            {
              user_id: supabaseUserId,
              stripe_customer_id: customerId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' }
          );
        if (upsertErr) {
          console.error('[Webhook] Fallback upsert error for stripe_customer_id:', upsertErr);
        } else {
          console.log(`[Webhook] Fallback upserted stripe_customer_id for user ${supabaseUserId}.`);
        }
      }
    } else if (
      event.type.startsWith('customer.subscription.') ||
      event.type.startsWith('invoice.payment_') ||
      event.type === 'checkout.session.completed'
    ) {
      console.error(
        `[Webhook] Could not process ${event.type}: Missing stripeSubscription or supabaseUserId.`
      );
    }
  } catch (error: any) {
    console.error(
      '[Webhook] Error handling event type:',
      event.type,
      error.message,
      error.stack
    );
    return NextResponse.json(
      {
        error: 'Webhook handler failed processing event.',
        details: error.message,
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ received: true });
}
