// src/app/api/get-models/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk'; // Ensure SDK is imported

// --- Client Initializers ---
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[API /get-models] OpenAI key missing');
    return null;
  }
  try {
    return new OpenAI({ apiKey });
  } catch (e) {
    console.error('[API /get-models] Error init OpenAI:', e);
    return null;
  }
}

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[API /get-models] Anthropic key missing');
    return null;
  }
  try {
    return new Anthropic({ apiKey });
  } catch (e) {
    console.error('[API /get-models] Error init Anthropic:', e);
    return null;
  }
}
// --- End Client Initializers ---

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');

  if (!provider || typeof provider !== 'string') {
    return NextResponse.json(
      { error: 'Provider query parameter is required.' },
      { status: 400 }
    );
  }

  let modelIds: string[] = [];
  const lowerProvider = provider.toLowerCase();

  console.log(
    `[API /get-models] Request for provider: ${lowerProvider} (Managed Key)`
  );

  try {
    switch (lowerProvider) {
      case 'openai': {
        const openai = getOpenAIClient();
        if (!openai)
          return NextResponse.json(
            { error: 'OpenAI not configured on server.' },
            { status: 500 }
          );

        console.log(`[API /get-models] Fetching OpenAI models...`);
        const modelsResponse = await openai.models.list();
        // Apply filtering for relevant models
        modelIds =
          modelsResponse?.data
            ?.map((m) => m.id)
            ?.filter(
              (id) =>
                id.includes('gpt') &&
                !id.includes('vision') &&
                !id.includes('embed') &&
                !id.includes('instruct') &&
                !id.includes('0314') &&
                !id.includes('0613')
            )
            ?.sort() || [];
        console.log(`[API /get-models] Found OpenAI models:`, modelIds.length);
        break;
      }

      case 'anthropic': {
        const anthropic = getAnthropicClient();
        if (!anthropic)
          return NextResponse.json(
            { error: 'Anthropic not configured on server.' },
            { status: 500 }
          );

        console.log(`[API /get-models] Fetching Anthropic models...`);
        // *** USE THE SDK's list() METHOD ***
        const modelsResponse = await anthropic.models.list(); // Use the documented method

        // Extract IDs - structure might be different, check SDK response type if needed
        // Assuming it has a similar structure for now, adjust if necessary
        modelIds =
          modelsResponse?.data
            ?.map((m: any) => m.id || m.name) // Use ID or Name as fallback? Check SDK response type
            ?.filter((id: string) => id.includes('claude')) // Filter for Claude models
            ?.sort() || [];

        // If the SDK doesn't provide a list or filtering is hard, fallback to known good models
        if (!modelIds || modelIds.length === 0) {
          console.warn(
            `[API /get-models] Anthropic SDK list() returned no usable models, falling back to defaults.`
          );
          modelIds = [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1', // Add known good ones
            'claude-instant-1.2',
          ].sort();
        }
        console.log(`[API /get-models] Found Anthropic models:`, modelIds);
        break;
      }

      default:
        console.warn(`[API /get-models] Unsupported provider: ${provider}`);
        modelIds = [];
    }

    return NextResponse.json({ models: modelIds });
  } catch (error: any) {
    console.error(
      `[API /get-models] Error fetching models for ${provider}:`,
      error
    );
    let clientErrorMessage = `Failed to fetch models for ${provider}.`;
    if (error.message?.includes('key') || error.message?.includes('401')) {
      clientErrorMessage = `Server configuration error for ${provider} API key.`;
    } // Add more specific error handling if needed
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
}
