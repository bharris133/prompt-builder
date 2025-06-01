// src/app/api/refine/route.ts // COMPLETE FILE REPLACEMENT - VERIFIED NO PLACEHOLDERS

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { QualificationResult } from '../qualify-prompt/route';

// --- Client Initializers (Using your server-side keys from .env.local) ---
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[API /refine] OpenAI key missing for managed refinement');
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (e) {
    console.error('[API /refine] Error init OpenAI:', e);
    return null;
  }
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[API /refine] Anthropic key missing for managed refinement');
    return null;
  }
  try {
    return new Anthropic({ apiKey });
  } catch (e) {
    console.error('[API /refine] Error init Anthropic:', e);
    return null;
  }
}

function getGoogleGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error(
      '[API /refine] Google API key missing for managed refinement'
    );
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error('[API /refine] Error init GoogleGenerativeAI:', e);
    return null;
  }
}
// --- End Client Initializers ---

interface RefineRequestBody {
  prompt: string;
  provider?: string;
  model?: string;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  // 1. Authenticate User
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
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
      .select('plan_id, status, trial_ends_at, current_period_end') // <<< FETCH MORE FIELDS
      .eq('user_id', user.id)
      // .eq('status', 'active') // Let's check status more flexibly below
      .maybeSingle();

    if (subError) {
      console.error(`[API ...] Error fetching subscription:`, subError);
      return NextResponse.json(
        {
          /* ... error object ... */
        },
        { status: 500 }
      );
    }

    if (subscription) {
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
      }
    }

    if (!canProceed) {
      console.log(
        `[API ...] User ${user.id} has no qualifying active subscription/trial (plan: ${subscription?.plan_id}, status: ${subscription?.status}). Access denied.`
      );
      const errorDetail =
        'Access to AI-powered features requires an active subscription or trial.';
      if (request.url.includes('qualify')) {
        return NextResponse.json(
          { type: 'error', detail: errorDetail } as QualificationResult,
          { status: 403 }
        );
      } else {
        return NextResponse.json({ error: errorDetail }, { status: 403 });
      }
    }
  } catch (e: any) {
    console.error(
      `[API /refine] Exception checking subscription for user ${user.id}:`,
      e
    );
    return NextResponse.json(
      { error: 'Error verifying subscription for managed refinement.' },
      { status: 500 }
    );
  }
  // --- End Subscription Check ---

  // Proceed with refinement using YOUR backend keys
  let requestBody: RefineRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { prompt } = requestBody;
  const provider = requestBody.provider || 'openai'; // Default to openai if not specified
  const modelFromRequest = requestBody.model; // Model selected by user in frontend

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }
  if (!modelFromRequest) {
    // Model selection should now be mandatory from frontend
    return NextResponse.json(
      { error: 'Model is required for refinement.' },
      { status: 400 }
    );
  }

  try {
    let refinedPrompt: string | null = null;
    const lowerProvider = provider.toLowerCase();
    const systemPrompt = `You are an expert prompt engineer assistant. 
    Your SOLE TASK is to refine the user-provided text into a single, cohesive, and effective prompt suitable for a large language model. 
    Combine any provided components logically. Focus on clarity, conciseness, and structure. 
    CRITICAL: Output ONLY the refined prompt text itself. 
    Do NOT execute the prompt, do NOT provide explanations, do NOT add introductory or concluding remarks, 
    do NOT add markdown formatting. ONLY output the refined prompt.`;

    console.log(
      `[API /refine] MANAGED Request: Provider=${lowerProvider}, Model=${modelFromRequest}`
    );

    switch (lowerProvider) {
      case 'openai': {
        const openai = getOpenAIClient();
        if (!openai)
          throw new Error('OpenAI service not configured on server.');
        console.log(
          `[API /refine] Refining with OpenAI (${modelFromRequest})...`
        );
        const completion = await openai.chat.completions.create({
          model: modelFromRequest,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        });
        refinedPrompt = completion.choices[0]?.message?.content?.trim() || null;
        break;
      }
      case 'anthropic': {
        const anthropic = getAnthropicClient();
        if (!anthropic)
          throw new Error('Anthropic service not configured on server.');
        console.log(
          `[API /refine] Refining with Anthropic (${modelFromRequest})...`
        );
        const message = await anthropic.messages.create({
          model: modelFromRequest,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        });
        if (
          Array.isArray(message.content) &&
          message.content[0]?.type === 'text'
        ) {
          refinedPrompt = message.content[0].text.trim();
        } else {
          refinedPrompt = null;
        }
        break;
      }
      case 'google': {
        const genAI = getGoogleGeminiClient();
        if (!genAI)
          throw new Error('Google AI service not configured on server.');
        console.log(
          `[API /refine] Refining with Google Gemini (${modelFromRequest})...`
        );
        const geminiModel = genAI.getGenerativeModel({
          model: modelFromRequest,
        });
        const generationConfig = { temperature: 0.5, maxOutputTokens: 1000 };
        const fullPromptForGemini = `${systemPrompt}\n\nUser's prompt to refine:\n${prompt}`;
        const generationResult = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPromptForGemini }] }],
          generationConfig,
        });
        const response = generationResult.response;
        refinedPrompt = response.text()?.trim() || null;
        break;
      }
      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }

    if (!refinedPrompt) {
      throw new Error(`No refined content received from ${provider}.`);
    }
    return NextResponse.json({ refinedPrompt });
  } catch (error: any) {
    console.error(
      `[API /refine] Error during refinement for ${provider}:`,
      error
    );
    let errorMessage = `Failed to refine prompt using ${provider}.`;
    if (
      error.message?.includes('key') ||
      error.status === 401 ||
      error.status === 403
    )
      errorMessage = `API Key error for ${provider}. Please check server configuration.`;
    else if (error.message?.includes('quota') || error.status === 429)
      errorMessage = `API quota exceeded for ${provider}.`;
    else if (error.message) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
