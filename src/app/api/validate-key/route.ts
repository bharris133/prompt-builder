// src/app/api/validate-key/route.ts // COMPLETE FILE REPLACEMENT - ADD MODEL FETCH

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

interface ValidateKeyRequestBody {
  provider: string;
  apiKey: string;
}

// --- Helper Function to Filter Models (Example) ---
// You might want to refine these filters based on desired models
function filterOpenAIModels(models: any[]): string[] {
  return (
    models
      ?.map((m) => m.id)
      ?.filter(
        (id) =>
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

function filterAnthropicModels(models: any[]): string[] {
  // Assuming the SDK returns { data: [{ id: string, ... }] } similar to OpenAI
  // OR if it returns just an array of model objects directly [{id: string}]
  // Adjust mapping based on actual SDK list() response structure
  const modelsArray = models?.data || models; // Adjust based on SDK response shape
  return (
    modelsArray
      ?.map((m: any) => m.id || m.name) // Prefer ID, fallback to name
      ?.filter((id: string) => id?.includes('claude')) // Basic filter
      ?.sort() || []
  );
}
// --- End Helper ---

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
      { isValid: false, error: 'Provider and API Key are required.' },
      { status: 400 }
    );
  }
  const lowerProvider = provider.toLowerCase();
  const key = apiKey.trim();

  console.log(`[API /validate-key] Request for provider: ${lowerProvider}`);

  try {
    let modelIds: string[] = []; // To store fetched models on success

    switch (lowerProvider) {
      case 'openai': {
        try {
          console.log(
            `[API /validate-key] Validating OpenAI key & fetching models...`
          );
          const openai = new OpenAI({ apiKey: key });
          const modelsResponse = await openai.models.list(); // Validate and get list in one go
          modelIds = filterOpenAIModels(modelsResponse?.data); // Filter the response data
          console.log(
            `[API /validate-key] OpenAI validation/fetch successful. Models found: ${modelIds.length}`
          );
        } catch (openaiError: any) {
          throw new Error(
            openaiError.error?.message ||
              openaiError.message ||
              'OpenAI validation/fetch failed'
          );
        }
        break;
      }

      case 'anthropic': {
        try {
          console.log(
            `[API /validate-key] Validating Anthropic key & fetching models...`
          );
          const anthropic = new Anthropic({ apiKey: key });
          // Use models.list() which also serves as validation if it doesn't throw 401/403
          const modelsResponse = await anthropic.models.list(); // Attempt to list models
          modelIds = filterAnthropicModels(modelsResponse?.data); // Filter the response data
          // Fallback if filtering fails but call succeeded (key is likely valid)
          if (!modelIds || modelIds.length === 0) {
            console.warn(
              `[API /validate-key] Anthropic SDK list() returned no usable models after filtering, falling back to known defaults.`
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
            `[API /validate-key] Anthropic validation/fetch successful. Models found/used:`,
            modelIds
          );
        } catch (anthropicError: any) {
          console.error(
            '[API /validate-key] Anthropic Validation/Fetch Error:',
            anthropicError
          );
          if (anthropicError.status === 401 || anthropicError.status === 403) {
            throw new Error(
              anthropicError.error?.message ||
                `Anthropic authentication failed (Status: ${anthropicError.status})`
            );
          }
          throw new Error(
            anthropicError.error?.message ||
              anthropicError.message ||
              'Anthropic validation/fetch failed'
          );
        }
        break;
      }

      default:
        return NextResponse.json(
          { isValid: false, error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    }

    // If switch completed without throwing, validation passed & models fetched
    return NextResponse.json({ isValid: true, models: modelIds }); // <-- RETURN MODELS ON SUCCESS
  } catch (error: any) {
    // Catch errors thrown from within the cases
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
    } // Use specific error
    return NextResponse.json(
      { isValid: false, error: userErrorMessage },
      { status: 200 }
    ); // Still 200 OK
  }
}
