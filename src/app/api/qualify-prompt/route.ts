// src/app/api/qualify-prompt/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Import server client

// Define expected request and structured response
export interface QualificationResult {
  // Make sure this is exported if PromptContext imports it
  type:
    | 'valid_for_refinement'
    | 'meta_request_for_prompt'
    | 'too_vague_or_incomplete'
    | 'gibberish'
    | 'error';
  detail?: string; // e.g., error message or rephrased request
}
interface QualifyRequestBody {
  promptText: string;
}

const QUALIFIER_SYSTEM_PROMPT = `You are a prompt analysis assistant. Your task is to classify user input intended for a prompt refinement process.
Categories:
1.  'valid_for_refinement': The text contains enough substance, clear intent, or structure that an expert prompt engineer could meaningfully refine it into a better prompt. It might be a complete prompt, a good starting instruction, or a clear request for content.
2.  'meta_request_for_prompt': The text is asking for assistance in *creating* a new prompt from scratch (e.g., "Help me write a prompt for X", "What's a good prompt to summarize text?", "Create a prompt for a customer service bot").
3.  'too_vague_or_incomplete': The text is too short (e.g., less than 5 words), ambiguous, or lacks enough context/detail to be meaningfully refined into a specific, actionable prompt (e.g., "summary", "tell me something", "image").
4.  'gibberish': The text is nonsensical, random characters, or clearly not intended as a prompt or question.

Output ONLY a JSON object: {"type": "CATEGORY_NAME"}
Example 1 User: "Write a poem about cats". Output: {"type": "valid_for_refinement"}
Example 2 User: "How to make prompts better?". Output: {"type": "meta_request_for_prompt"}
Example 3 User: "asdf ghjkl". Output: {"type": "gibberish"}
Example 4 User: "Summarize". Output: {"type": "too_vague_or_incomplete"}
`;

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticate User
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      {
        type: 'error',
        detail: 'Unauthorized. Please log in.',
      } as QualificationResult,
      { status: 401 }
    );
  }

  // 2. Check User's Subscription Plan (Basic Check)
  let canProceed = false;
  try {
    console.log(
      `[API ${request.url.includes('qualify') ? '/qualify' : '/refine'}] Checking subscription for user ${user.id}`
    );
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan_id, status, trial_ends_at, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (subError) {
      console.error(`[API ...] Error fetching subscription:`, subError);
      return NextResponse.json(
        {
          type: 'error',
          detail: 'Database error fetching subscription.',
        } as QualificationResult,
        { status: 500 }
      );
    }

    if (!subscription) {
      console.log(
        `[API ...] No subscription found for user ${user.id}. Access denied.`
      );
      const errorDetail =
        'No subscription found. Access to AI-powered features requires an active subscription or trial.';
      return NextResponse.json(
        { type: 'error', detail: errorDetail } as QualificationResult,
        { status: 403 }
      );
    }

    const now = new Date();
    const trialEndsAt = subscription.trial_ends_at
      ? new Date(subscription.trial_ends_at)
      : null;
    const periodEndsAt = subscription.current_period_end
      ? new Date(subscription.current_period_end)
      : null;
    const isPaidPlan =
      subscription.plan_id && subscription.plan_id.toLowerCase() !== 'free';
    const isActiveStatus = subscription.status === 'active';
    const isTrialingStatus = subscription.status === 'trialing';

    if (isTrialingStatus && trialEndsAt && trialEndsAt > now) {
      canProceed = true;
      console.log(
        `[API ...] User ${user.id} on active trial (ends: ${trialEndsAt.toISOString()}). Proceeding.`
      );
    } else if (
      isPaidPlan &&
      isActiveStatus &&
      periodEndsAt &&
      periodEndsAt > now
    ) {
      canProceed = true;
      console.log(
        `[API ...] User ${user.id} has active paid plan '${subscription.plan_id}' (ends: ${periodEndsAt.toISOString()}). Proceeding.`
      );
    } else {
      console.log(
        `[API ...] Subscription exists but not active/trialing or expired. plan: ${subscription.plan_id}, status: ${subscription.status}, trialEndsAt: ${trialEndsAt}, periodEndsAt: ${periodEndsAt}`
      );
    }

    if (!canProceed) {
      console.log(
        `[API ...] User ${user.id} has no qualifying active subscription/trial (plan: ${subscription?.plan_id}, status: ${subscription?.status}). Access denied.`
      );
      const errorDetail =
        'Access to AI-powered features requires an active subscription or trial.';
      return NextResponse.json(
        { type: 'error', detail: errorDetail } as QualificationResult,
        { status: 403 }
      );
    }
  } catch (e) {
    console.error(
      `[API /qualify] Exception checking subscription for user ${user.id}:`,
      e
    );
    return NextResponse.json(
      {
        type: 'error',
        detail: 'Error verifying subscription.',
      } as QualificationResult,
      { status: 500 }
    );
  }
  // End Subscription Check

  // Proceed with qualification if checks passed
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        type: 'error',
        detail: 'Qualification service (OpenAI key) not configured.',
      } as QualificationResult,
      { status: 500 }
    );
  }

  let requestBody: QualifyRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json(
      { type: 'error', detail: 'Invalid request body.' } as QualificationResult,
      { status: 400 }
    );
  }

  const { promptText } = requestBody;
  if (!promptText || typeof promptText !== 'string') {
    return NextResponse.json(
      {
        type: 'error',
        detail: 'promptText is required.',
      } as QualificationResult,
      { status: 400 }
    );
  }

  // Basic length check (can be adjusted or removed if LLM handles it well)
  // if (promptText.trim().length < 5 && !promptText.toLowerCase().includes('prompt')) {
  //      return NextResponse.json({ type: 'too_vague_or_incomplete' } as QualificationResult);
  // }

  try {
    // Initialize OpenAI client WITH YOUR SERVER KEY
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(
      '[API /qualify] Sending text for qualification:',
      promptText.substring(0, 100) + '...'
    );
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // Or gpt-4o-mini for potentially lower cost/latency
      messages: [
        { role: 'system', content: QUALIFIER_SYSTEM_PROMPT },
        { role: 'user', content: promptText },
      ],
      temperature: 0.0,
      max_tokens: 60,
      response_format: { type: 'json_object' },
    });

    const resultJson = completion.choices[0]?.message?.content;
    console.log('[API /qualify] Raw qualification LLM response:', resultJson);

    if (!resultJson) {
      throw new Error('No content received from qualification model.');
    }

    let classificationResult: QualificationResult;
    try {
      const parsed = JSON.parse(resultJson);
      const validTypes: QualificationResult['type'][] = [
        'valid_for_refinement',
        'meta_request_for_prompt',
        'too_vague_or_incomplete',
        'gibberish',
      ];
      if (
        typeof parsed.type === 'string' &&
        validTypes.includes(parsed.type as any)
      ) {
        classificationResult = {
          type: parsed.type as QualificationResult['type'],
        };
      } else {
        console.error(
          '[API /qualify] Invalid type in LLM JSON response:',
          parsed.type
        );
        throw new Error(
          'Invalid JSON structure or type received from qualification model.'
        );
      }
    } catch (parseError) {
      console.error(
        '[API /qualify] Failed to parse LLM JSON response:',
        parseError,
        '-- Raw:',
        resultJson
      );
      throw new Error(
        'Could not understand qualification model response. Defaulting to valid.'
      );
      // Fallback or re-throw: classificationResult = { type: 'valid_for_refinement' }; // Fallback
    }

    console.log('[API /qualify] Qualification result:', classificationResult);
    return NextResponse.json(classificationResult);
  } catch (error: any) {
    console.error(
      '[API /qualify] Error during OpenAI call for qualification:',
      error
    );
    let errorMessage = 'Failed to qualify prompt due to AI service error.';
    if (error.message?.includes('key') || error.message?.includes('401'))
      errorMessage = 'Qualification service authentication error.';
    else if (error.message) errorMessage = error.message; // Use more specific error if available
    return NextResponse.json(
      { type: 'error', detail: errorMessage } as QualificationResult,
      { status: 500 }
    );
  }
}
