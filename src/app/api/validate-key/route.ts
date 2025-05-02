// src/app/api/validate-key/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

// Note: We don't need getOpenAIClient/getAnthropicClient helpers here
// because we will initialize using the key from the request body.

// Define the expected request body structure
interface ValidateKeyRequestBody {
  provider: string;
  apiKey: string;
}

export async function POST(request: Request) {
  let requestBody: ValidateKeyRequestBody;

  // 1. Parse Request Body
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('[API /validate-key] Error parsing request body:', error);
    return NextResponse.json(
      { isValid: false, error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  // 2. Extract and Validate Input
  const { provider, apiKey } = requestBody;

  if (!provider || typeof provider !== 'string') {
    return NextResponse.json(
      { isValid: false, error: 'Provider is required.' },
      { status: 400 }
    );
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json(
      { isValid: false, error: 'API Key is required.' },
      { status: 400 }
    );
  }

  const lowerProvider = provider.toLowerCase();
  const key = apiKey.trim(); // Use the user-provided key

  console.log(`[API /validate-key] Request for provider: ${lowerProvider}`);

  // 3. Perform Validation Call based on Provider
  try {
    let validationResponse: Response | null = null; // To store the response from the actual API provider

    switch (lowerProvider) {
      case 'openai': {
        try {
          console.log(`[API /validate-key] Validating OpenAI key...`);
          // Initialize client WITH THE USER'S KEY
          const openai = new OpenAI({ apiKey: key });
          // Use lightweight 'list models' call for validation
          validationResponse = await openai.models.list(); // This returns raw Response if using fetch wrapper or specific object if SDK does transformation
          // If using the SDK directly without internal fetch wrappers, check for standard errors
          // The SDK call itself might throw on auth errors. Let's assume SDK handles basic fetch details.
          console.log(`[API /validate-key] OpenAI validation call successful.`);
          // If the call succeeds without throwing a 401 error, the key is valid
        } catch (openaiError: any) {
          console.error(
            '[API /validate-key] OpenAI Validation Error:',
            openaiError
          );
          // Rethrow to be caught by the outer try/catch
          throw new Error(
            openaiError.error?.message ||
              openaiError.message ||
              'OpenAI validation failed'
          );
        }
        break;
      } // Close openai case scope

      case 'anthropic': {
        try {
          console.log(`[API /validate-key] Validating Anthropic key...`);
          // Initialize client WITH THE USER'S KEY
          const anthropic = new Anthropic({ apiKey: key });
          // Use minimal 'create message' call for validation
          // We don't actually care about the response content here, just if it throws an auth error
          await anthropic.messages.create({
            model: 'claude-3-haiku-20240307', // Cheapest/fastest model
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Validation ping' }],
          });
          console.log(
            `[API /validate-key] Anthropic validation call successful (no auth error).`
          );
        } catch (anthropicError: any) {
          console.error(
            '[API /validate-key] Anthropic Validation Error:',
            anthropicError
          );
          // Check for specific auth errors if the SDK provides structured errors
          if (anthropicError.status === 401 || anthropicError.status === 403) {
            throw new Error(
              anthropicError.error?.message ||
                `Anthropic authentication failed (Status: ${anthropicError.status})`
            );
          }
          // Rethrow other errors (like network, bad model if not caught above, etc.)
          throw new Error(
            anthropicError.error?.message ||
              anthropicError.message ||
              'Anthropic validation ping failed'
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

    // If we reached here without throwing, validation passed
    return NextResponse.json({ isValid: true });
  } catch (error: any) {
    // Catch errors from SDK initialization or the API calls within the cases
    console.error(
      `[API /validate-key] Overall Validation Error for ${provider}:`,
      error
    );
    // Return a user-friendly error
    let userErrorMessage = `API Key validation failed for ${provider}.`;
    if (
      error.message?.includes('key') ||
      error.message?.includes('401') ||
      error.message?.includes('authentication')
    ) {
      userErrorMessage = 'Invalid API Key provided.';
    } else if (error.message?.includes('403')) {
      userErrorMessage = 'Permission Denied. Check API key permissions.';
    } else if (error.message) {
      // Use specific error if available
      userErrorMessage = error.message;
    }
    // Return isValid: false and the error message
    return NextResponse.json(
      { isValid: false, error: userErrorMessage },
      { status: 200 }
    ); // Return 200 OK, but with isValid: false
    // Or return a 400/401/500 status? Let's use 200 OK with isValid:false for simplicity in frontend handling
  }
}
