// src/app/api/create-checkout-session/route.ts // COMPLETE FILE

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // For getting user session
import Stripe from 'stripe';

// Initialize Stripe with your secret key from environment variables
// Ensure STRIPE_SECRET_KEY is set in your .env.local
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error(
    'Stripe secret key is not set. Checkout session creation will fail.'
  );
  // In a real app, you might throw an error or have a more robust way to handle this.
}
const stripe = new Stripe(stripeSecretKey!, {
  // The '!' asserts it's defined after the check
  apiVersion: '2025-04-30.basil', // Use the latest API version you're comfortable with
  typescript: true,
});

interface CheckoutRequestBody {
  priceId: string; // The ID of the Stripe Price object
  // You might add quantity or other parameters later if needed
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticate User - Ensure user is logged in to create a session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[Checkout API] Auth error:', authError);
    return NextResponse.json(
      { error: 'Unauthorized. Please log in to subscribe.' },
      { status: 401 }
    );
  }
  console.log(
    `[Checkout API] User authenticated: ${user.id}, Email: ${user.email}`
  );

  // 2. Parse Request Body for Price ID
  let requestBody: CheckoutRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('[Checkout API] Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { priceId } = requestBody;
  if (!priceId || typeof priceId !== 'string') {
    return NextResponse.json(
      { error: 'Price ID is required.' },
      { status: 400 }
    );
  }

  // 3. Get or Create Stripe Customer ID
  // It's good practice to store the Stripe Customer ID in your database (e.g., subscriptions or user_settings table)
  // and associate it with your user_id.
  // For this example, we'll try to fetch it. If not found, create one.
  let stripeCustomerId: string | undefined;

  // Attempt to get customer ID from your 'subscriptions' table (or 'users' table if you store it there)
  const { data: subscriptionData, error: subFetchError } = await supabase
    .from('subscriptions') // Assuming you store stripe_customer_id here
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .single();

  if (subFetchError && subFetchError.code !== 'PGRST116') {
    // PGRST116: Row not found (expected if new customer)
    console.error(
      '[Checkout API] Error fetching subscription data for Stripe customer ID:',
      subFetchError
    );
    // Decide if this is a fatal error or if you should proceed to create a new Stripe customer
  }

  stripeCustomerId = subscriptionData?.stripe_customer_id;

  if (!stripeCustomerId) {
    try {
      console.log(
        `[Checkout API] No Stripe Customer ID found for user ${user.id}. Creating new Stripe customer.`
      );
      const customer = await stripe.customers.create({
        email: user.email, // Use user's email
        // You can add metadata to link this Stripe customer to your Supabase user_id
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;
      console.log(
        `[Checkout API] Created new Stripe Customer: ${stripeCustomerId} for user ${user.id}`
      );

      // IMPORTANT: Save this new stripeCustomerId to your database associated with the user.
      // This ensures you don't create duplicate Stripe customers for the same user.
      // Example: Update 'subscriptions' table or 'users' table.
      // We'll add this to our subscriptions table upsert logic when handling webhooks.
      // For now, we'll just use it for this session.
      // A more robust solution would ensure it's saved before proceeding or as part of webhook handling.
      const { error: updateSubError } = await supabase
        .from('subscriptions')
        .upsert(
          {
            user_id: user.id,
            stripe_customer_id: stripeCustomerId,
            plan_id: 'free',
            status: 'incomplete',
          },
          { onConflict: 'user_id' }
        ); // Example initial upsert

      if (updateSubError) {
        console.error(
          `[Checkout API] Failed to save new Stripe Customer ID ${stripeCustomerId} for user ${user.id}:`,
          updateSubError
        );
        // Handle error - maybe don't proceed with checkout if you can't save customer ID
      }
    } catch (customerError: any) {
      console.error(
        '[Checkout API] Error creating Stripe customer:',
        customerError
      );
      return NextResponse.json(
        {
          error: 'Failed to create Stripe customer.',
          details: customerError.message,
        },
        { status: 500 }
      );
    }
  } else {
    console.log(
      `[Checkout API] Using existing Stripe Customer ID: ${stripeCustomerId} for user ${user.id}`
    );
  }

  // 4. Define Success and Cancel URLs
  // These are the URLs Stripe will redirect to after checkout.
  // Use environment variables for your domain in production.
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Your app's base URL
  const successUrl = `${appUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`; // Or a dedicated success page
  const cancelUrl = `${appUrl}/pricing`; // Or wherever they should go if they cancel

  // 5. Create Stripe Checkout Session
  try {
    console.log(
      `[Checkout API] Creating Stripe Checkout session for price ID: ${priceId} and customer: ${stripeCustomerId}`
    );
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId, // Associate with existing or new Stripe customer
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // The ID of the Price object from your Stripe dashboard
          quantity: 1,
        },
      ],
      mode: 'subscription', // For recurring payments
      // For one-time payments, use 'payment'
      // For setting up future payments, use 'setup'

      success_url: successUrl,
      cancel_url: cancelUrl,
      // Optionally, pass metadata to the session
      metadata: {
        supabase_user_id: user.id,
        // plan_id: associatedPlanId, // If you want to pass the plan ID to the webhook
      },
      // If your plan involves a free trial, configure trial_period_days
      // subscription_data: {
      //   trial_period_days: 14, // Example: 14-day trial
      // },
    });

    console.log(
      '[Checkout API] Stripe Checkout session created successfully:',
      session.id
    );
    // Return the session ID to the client
    return NextResponse.json({ sessionId: session.id });
  } catch (error: any) {
    console.error(
      '[Checkout API] Error creating Stripe Checkout session:',
      error
    );
    return NextResponse.json(
      {
        error: 'Failed to create Stripe Checkout session.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
