// src/app/api/validate-key/route.ts // COMPLETE FILE REPLACEMENT - Add Model Fetch BACK

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// --- Model Filtering Helpers ---
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
  const modelsArray: any[] = modelsResponse?.data || modelsResponse; // Adjust based on SDK actual response
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

interface ValidateKeyRequestBody {
  provider: string;
  apiKey: string;
}

export async function POST(request: Request) {
  let requestBody: ValidateKeyRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json(
      { isValid: false, error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  const { provider, apiKey } = requestBody;
  if (
    !provider ||
    !apiKey ||
    typeof provider !== 'string' ||
    typeof apiKey !== 'string' ||
    apiKey.trim().length === 0
  ) {
    return NextResponse.json(
      { isValid: false, error: 'Provider and API Key required.' },
      { status: 400 }
    );
  }
  const lowerProvider = provider.toLowerCase();
  const key = apiKey.trim();

  console.log(`[API /validate-key] Request for provider: ${lowerProvider}`);

  try {
    let modelIds: string[] = []; // To store fetched models

    switch (lowerProvider) {
      case 'openai': {
        try {
          console.log(
            `[API /validate-key] Validating OpenAI key & fetching models...`
          );
          const openai = new OpenAI({ apiKey: key }); // Use USER KEY
          const modelsResponse = await openai.models.list(); // Validate AND get list
          modelIds = filterOpenAIModels(modelsResponse?.data); // Filter the actual data
          console.log(
            `[API /validate-key] OpenAI validation/fetch successful.`
          );
        } catch (openaiError: any) {
          throw new Error(
            openaiError.error?.message ||
              openaiError.message ||
              'OpenAI validation/fetch failed'
          );
        }
        break;
      } // Close openai case scope

      case 'anthropic': {
        try {
          console.log(
            `[API /validate-key] Validating Anthropic key & fetching models...`
          );
          const anthropic = new Anthropic({ apiKey: key }); // Use USER KEY
          const modelsResponse = await anthropic.models.list(); // Use list method for validation + data
          modelIds = filterAnthropicModels(modelsResponse); // Filter the response
          // Fallback if filtering fails but call likely succeeded (key is valid)
          if (!modelIds || modelIds.length === 0) {
            console.warn(
              `[API /validate-key] Anthropic SDK list() empty/failed filtering, using defaults as key is likely valid.`
            );
            modelIds = [
              'claude-3-opus-20240229',
              'claude-3-sonnet-20240229',
              'claude-3-haiku-20240307',
              'claude-2.1',
              'claude-instant-1.2',
            ].sort();
          }
          console.log(
            `[API /validate-key] Anthropic validation/fetch successful.`
          );
        } catch (anthropicError: any) {
          console.error(
            '[API /validate-key] Anthropic Validation/Fetch Error:',
            anthropicError
          );
          if (anthropicError.status === 401 || anthropicError.status === 403) {
            throw new Error(
              anthropicError.error?.message || `Anthropic authentication failed`
            );
          }
          throw new Error(
            anthropicError.error?.message ||
              anthropicError.message ||
              'Anthropic validation/fetch failed'
          );
        }
        break;
      } // Close anthropic case scope

      default:
        return NextResponse.json(
          { isValid: false, error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    } // Close switch

    // If we reached here without throwing, validation passed & models fetched/filtered
    return NextResponse.json({ isValid: true, models: modelIds }); // <<< RETURN MODELS
  } catch (error: any) {
    // Catch errors from within the cases
    console.error(
      `[API /validate-key] Overall Validation Error for ${provider}:`,
      error
    );
    let userErrorMessage = `API Key validation failed for ${provider}.`;
    if (
      error.message?.includes('key') ||
      error.message?.includes('401') ||
      error.message?.includes('authentication')
    ) {
      userErrorMessage = 'Invalid API Key provided.';
    } else if (error.message?.includes('403')) {
      userErrorMessage = 'Permission Denied.';
    } else {
      userErrorMessage = error.message || 'Validation check failed.';
    }
    return NextResponse.json(
      { isValid: false, error: userErrorMessage },
      { status: 200 }
    ); // Still 200 OK
  }
}
