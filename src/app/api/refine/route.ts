// src/app/api/refine/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk'; // Ensure this is imported

// Helper: Initialize OpenAI Client
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[API Route] OpenAI key missing');
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (error) {
    console.error('[API Route] Error init OpenAI:', error);
    return null;
  }
}

// Helper: Initialize Anthropic Client
function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[API Route] Anthropic key missing');
    return null;
  }
  try {
    return new Anthropic({ apiKey });
  } catch (error) {
    console.error('[API Route] Error init Anthropic:', error);
    return null;
  }
}

interface RefineRequestBody {
  prompt: string;
  provider?: string;
  model?: string;
}

// Export the POST function correctly
export async function POST(request: Request) {
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
  const provider = requestBody.provider || 'openai';
  const model = requestBody.model; // Model selected by user

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }

  try {
    let refinedPrompt: string | null = null;
    let providerModelUsed: string | null = null; // Track the actual model used
    const lowerProvider = provider.toLowerCase();

    console.log(
      `[API Route] Request: Provider=${lowerProvider}, Model=${model || 'Default'}`
    );

    switch (lowerProvider) {
      case 'openai': {
        // Use block scope
        const openai = getOpenAIClient();
        if (!openai)
          return NextResponse.json(
            { error: 'OpenAI not configured.' },
            { status: 500 }
          );
        providerModelUsed = model || 'gpt-3.5-turbo'; // Default if none provided
        console.log(
          `[API Route] Refining with OpenAI (${providerModelUsed})...`
        );
        const completion = await openai.chat.completions.create({
          model: providerModelUsed,
          messages: [
            {
              role: 'system',
              content: `You are an expert prompt engineer... CRITICAL: Output ONLY the refined prompt text...`,
            },
            { role: 'user', content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        });
        refinedPrompt = completion.choices[0]?.message?.content?.trim() || null;
        break;
      } // Close block scope

      case 'anthropic': {
        // Use block scope
        const anthropic = getAnthropicClient();
        if (!anthropic)
          return NextResponse.json(
            { error: 'Anthropic not configured.' },
            { status: 500 }
          );
        providerModelUsed = model || 'claude-3-sonnet-20240229'; // Default if none provided
        console.log(
          `[API Route] Refining with Anthropic (${providerModelUsed})...`
        );
        const message = await anthropic.messages.create({
          model: providerModelUsed,
          max_tokens: 1024,
          system: `You are an expert prompt engineer... CRITICAL: Output ONLY the refined prompt text...`,
          messages: [{ role: 'user', content: prompt }],
        });

        // *** CORRECTED Response Parsing for Anthropic ***
        // Check if content is an array and the first block is a text block
        if (
          Array.isArray(message.content) &&
          message.content[0]?.type === 'text'
        ) {
          refinedPrompt = message.content[0].text.trim(); // Access text property
        } else {
          console.warn(
            '[API Route] Unexpected Anthropic response structure:',
            message.content
          );
          refinedPrompt = null; // Or try to extract differently if needed
        }
        // *** END Correction ***
        break;
      } // Close block scope

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    } // Close switch

    if (!refinedPrompt) {
      console.error(
        `[API Route] No content received from ${provider} (${providerModelUsed}).`
      );
      throw new Error(`No content received from ${provider}.`);
    }
    console.log(
      `[API Route] Refinement successful from ${provider} (${providerModelUsed}).`
    );
    return NextResponse.json({ refinedPrompt });
  } catch (error: any) {
    console.error(`[API Route] Error calling ${provider} API:`, error);
    let errorMessage = `Failed to refine prompt using ${provider}.`;
    if (error.response && error.response.data?.error?.message)
      errorMessage = error.response.data.error.message;
    else if (error.message) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} // Close POST function correctly
