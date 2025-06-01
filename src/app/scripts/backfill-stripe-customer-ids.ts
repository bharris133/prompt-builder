// src/app/scripts/backfill-stripe-customer-ids.ts
require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

if (!process.env.STRIPE_SECRET_KEY)
  throw new Error('Missing STRIPE_SECRET_KEY');
if (!process.env.NEXT_PUBLIC_SUPABASE_URL)
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
if (!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-04-30.basil',
  typescript: true,
});
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function backfillStripeCustomerIds() {
  // 1. Get all subscriptions missing stripe_customer_id
  const { data: subs, error } = await supabase
    .from('subscriptions')
    .select('user_id, stripe_subscription_id')
    .is('stripe_customer_id', null);

  if (error) {
    console.error('Error fetching subscriptions:', error);
    return;
  }
  if (!subs || subs.length === 0) {
    console.log('No subscriptions to backfill.');
    return;
  }

  for (const sub of subs) {
    if (!sub.stripe_subscription_id) continue;
    try {
      const stripeSub = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id
      );
      const customerId =
        typeof stripeSub.customer === 'string'
          ? stripeSub.customer
          : stripeSub.customer.id;
      await supabase
        .from('subscriptions')
        .update({
          stripe_customer_id: customerId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', sub.user_id);
      console.log(`Backfilled user ${sub.user_id} with customer ${customerId}`);
    } catch (e) {
      console.error(`Failed for user ${sub.user_id}:`, e);
    }
  }
}

backfillStripeCustomerIds();
