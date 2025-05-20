// src/app/api/get-models/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
// --- NEW: Import Google Generative AI SDK ---
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

// --- Client Initializers (Needed if we were to make actual API calls with server keys) ---
// These are for your SERVER-SIDE keys from .env.local
function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('[API /get-models] OpenAI key missing for managed listing');
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
    console.error(
      '[API /get-models] Anthropic key missing for managed listing'
    );
    return null;
  }
  try {
    return new Anthropic({ apiKey });
  } catch (e) {
    console.error('[API /get-models] Error init Anthropic:', e);
    return null;
  }
}

// --- NEW: Helper to Initialize Google Gemini Client ---
function getGoogleGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('[API /get-models] Google API key missing');
    return null;
  }
  try {
    return new GoogleGenerativeAI(apiKey);
  } catch (e) {
    console.error('[API /get-models] Error init GoogleGenerativeAI:', e);
    return null;
  }
}
// --- End Client Initializers ---

// --- Model Filtering Helpers (Keep OpenAI and Anthropic) ---
function filterOpenAIModels(modelsData: any): string[] {
  return (
    modelsData
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
function filterAnthropicModels(modelsResponse: any): string[] {
  const modelsArray: any[] = modelsResponse?.data || modelsResponse;
  if (!Array.isArray(modelsArray)) {
    return [];
  }
  return (
    modelsArray
      ?.map((m: any) => m.id || m.name)
      ?.filter((id: string) => !!id && id.toLowerCase().includes('claude'))
      ?.sort() || []
  );
}
// --- End Helpers ---

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

  // This route now describes models accessible by THE APPLICATION'S backend keys
  console.log(
    `[API /get-models] Request for managed models, provider: ${lowerProvider}`
  );

  try {
    switch (lowerProvider) {
      case 'openai': {
        const openai = getOpenAIClient();
        if (!openai)
          return NextResponse.json(
            { error: 'OpenAI not configured on server for model listing.' },
            { status: 500 }
          );
        const modelsResponse = await openai.models.list();
        modelIds = filterOpenAIModels(modelsResponse?.data);
        break;
      }

      case 'anthropic': {
        const anthropic = getAnthropicClient();
        if (!anthropic)
          return NextResponse.json(
            { error: 'Anthropic not configured on server for model listing.' },
            { status: 500 }
          );
        const modelsResponse = await anthropic.models.list();
        modelIds = filterAnthropicModels(modelsResponse);
        if (!modelIds || modelIds.length === 0) {
          modelIds = [
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307',
            'claude-2.1',
            'claude-instant-1.2',
          ].sort();
        }
        break;
      }

      // --- NEW: Google Gemini ---
      // Note: Google Gemini models are not listed in the same way as OpenAI or Anthropic.
      case 'google': {
        const googleApiKey = process.env.GOOGLE_API_KEY;
        if (!googleApiKey) {
          console.error(
            "[API /get-models] Server's Google API key not configured."
          );
          return NextResponse.json(
            { error: 'Google AI not configured on server for model listing.' },
            { status: 500 }
          );
        }

        console.log(
          `[API /get-models] Fetching Google Gemini models via REST using server key...`
        );
        try {
          const listModelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`;
          const response = await fetch(listModelsUrl);
          const data = await response.json();

          if (!response.ok) {
            const errorMessage =
              data?.error?.message ||
              `Google API request failed with status ${response.status}`;
            console.error(
              '[API /get-models] Google Model Fetch Error:',
              errorMessage,
              data
            );
            throw new Error(errorMessage);
          }

          if (data && data.models && Array.isArray(data.models)) {
            modelIds = data.models
              .map((m: any) => {
                const nameParts = m.name?.split('/');
                return nameParts && nameParts.length > 1 ? nameParts[1] : null;
              })
              .filter(
                (id: string | null): id is string =>
                  !!id && (id.includes('gemini') || id.includes('text-bison'))
              )
              .sort();
            console.log(`[API /get-models] Filtered Google models:`, modelIds);
          } else {
            console.warn(
              '[API /get-models] Google models list not found in response, using defaults. Response:',
              data
            );
            modelIds = [
              'gemini-pro',
              'gemini-1.0-pro',
              'gemini-1.5-pro-latest',
              'gemini-1.5-flash-latest',
            ].sort();
          }
        } catch (error: any) {
          console.error(
            '[API /get-models] Error during Google model fetch:',
            error
          );
          // Fallback to defaults if the API call itself fails for some reason
          modelIds = [
            'gemini-pro',
            'gemini-1.0-pro',
            'gemini-1.5-pro-latest',
            'gemini-1.5-flash-latest',
          ].sort();
        }
        break;
      }

      default:
        modelIds = [];
    }

    console.log(
      `[API /get-models] Returning models for ${lowerProvider}:`,
      modelIds
    );
    return NextResponse.json({ models: modelIds });
  } catch (error: any) {
    console.error(
      `[API /get-models] Error fetching models for ${provider}:`,
      error
    );
    let clientErrorMessage = `Failed to fetch models for ${provider}.`;
    if (error.message?.includes('key') || error.message?.includes('401')) {
      clientErrorMessage = `Server configuration error for ${provider} API key (for model listing).`;
    }
    return NextResponse.json({ error: clientErrorMessage }, { status: 500 });
  }
}
