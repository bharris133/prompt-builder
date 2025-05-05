// src/app/api/get-models/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

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

// --- Helper Function to Filter OpenAI Models ---
function filterOpenAIModels(modelsData: any): string[] {
  return (
    modelsData // Expects the array from response.data
      ?.map((m: any) => m.id)
      ?.filter(
        (id: string) =>
          id.includes('gpt') &&
          !id.includes('vision') &&
          !id.includes('embed') &&
          !id.includes('instruct') &&
          !id.includes('0125') &&
          !id.includes('1106') &&
          !id.includes('0613') &&
          !id.includes('0314')
      )
      ?.sort() || []
  );
}
// --- End Helper ---

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
        const modelsResponse = await openai.models.list(); // This returns a Page object
        modelIds = filterOpenAIModels(modelsResponse?.data); // Pass the data array to the filter
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
        const modelsResponse = await anthropic.models.list(); // Use the documented method

        // *** CORRECTED Parsing: Assume modelsResponse might be the array or have .data ***
        // Adjust based on actual observed SDK response if necessary
        const modelsArray: any[] = modelsResponse?.data || modelsResponse; // Try .data first, fallback to response itself

        if (Array.isArray(modelsArray)) {
          modelIds = modelsArray
            .map((m) => m.id || m.name) // Use id or name
            .filter(
              (id): id is string => !!id && id.toLowerCase().includes('claude')
            ) // Ensure id is string & filter
            .sort();
          console.log(`[API /get-models] Parsed Anthropic models list.`);
        } else {
          console.warn(
            `[API /get-models] Unexpected Anthropic models list structure. Type: ${typeof modelsResponse}, Keys: ${Object.keys(modelsResponse || {})}`
          );
          modelIds = []; // Set empty before fallback
        }
        // *** END Correction ***

        // Fallback if API/parsing/filtering yields nothing
        if (!modelIds || modelIds.length === 0) {
          console.warn(
            `[API /get-models] Anthropic list empty/failed after parsing/filtering, using defaults.`
          );
          modelIds = [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-instant-1.2',
          ].sort();
        }
        console.log(`[API /get-models] Returning Anthropic models:`, modelIds);
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
    }
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
}
