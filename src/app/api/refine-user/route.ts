// src/app/api/refine-user/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'; // <-- Add Google SDK

// NOTE: We do NOT use process.env API keys here, as we expect the user's key in the request.

// Define the expected request body structure for this route
interface RefineUserRequestBody {
  prompt: string;
  provider: string; // Provider name (e.g., 'openai', 'anthropic')
  model: string; // Specific model ID
  apiKey: string; // The USER'S API key
}

export async function POST(request: Request) {
  let requestBody: RefineUserRequestBody;

  // 1. Parse Request Body
  try {
    requestBody = await request.json();
  } catch (error) {
    console.error('[API /refine-user] Error parsing request body:', error);
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  // 2. Extract and Validate Input
  const { prompt, provider, model, apiKey } = requestBody;

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
  }
  if (!provider || typeof provider !== 'string') {
    return NextResponse.json(
      { error: 'Provider is required.' },
      { status: 400 }
    );
  }
  if (!model || typeof model !== 'string') {
    // Use provider default if model is missing? Or require it? Let's require it for now.
    return NextResponse.json({ error: 'Model is required.' }, { status: 400 });
  }
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return NextResponse.json(
      { error: 'User API Key is required.' },
      { status: 400 }
    );
  }

  const key = apiKey.trim(); // <<< 'key' is assigned the user's API key from the request body
  const lowerProvider = provider.toLowerCase();

  console.log(
    `[API /refine-user] Request: Provider=${lowerProvider}, Model=${model}`
  );

  // Define system prompt once
  const systemPrompt = `You are an expert prompt engineer assistant. 
  Your SOLE TASK is to refine the user-provided text into a single, 
  cohesive, and effective prompt suitable for a large language model. Combine any provided components logically. 
  Focus on clarity, conciseness, and structure. CRITICAL: Output ONLY the refined prompt text itself. 
  Do NOT execute the prompt, do NOT provide explanations, do NOT add introductory or concluding remarks, 
  do NOT add markdown formatting. ONLY output the refined prompt.`;

  // 3. Select Provider Logic
  try {
    let refinedPrompt: string | null = null;
    switch (lowerProvider) {
      case 'openai': {
        try {
          // Initialize OpenAI client WITH THE USER'S KEY
          const openai = new OpenAI({ apiKey: apiKey.trim() });
          console.log(
            `[API /refine-user] Calling OpenAI (${model}) with user key...`
          );
          const completion = await openai.chat.completions.create({
            model: model, // Use the model specified in the request
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
            max_tokens: 1000,
          });
          refinedPrompt =
            completion.choices[0]?.message?.content?.trim() || null;
        } catch (openaiError: any) {
          // Catch specific OpenAI init or call errors
          console.error('[API /refine-user] OpenAI Error:', openaiError);
          // Rethrow a more generic error or parse the OpenAI error
          throw new Error(
            openaiError.error?.message ||
              openaiError.message ||
              'OpenAI request failed'
          );
        }
        break;
      }

      case 'anthropic': {
        try {
          // Initialize Anthropic client WITH THE USER'S KEY
          const anthropic = new Anthropic({ apiKey: apiKey.trim() });
          console.log(
            `[API /refine-user] Calling Anthropic (${model}) with user key...`
          );
          const message = await anthropic.messages.create({
            model: model, // Use the model specified in the request
            max_tokens: 1024,
            system: systemPrompt,
            messages: [{ role: 'user', content: prompt }],
          });
          // Parse response
          if (
            Array.isArray(message.content) &&
            message.content[0]?.type === 'text'
          ) {
            refinedPrompt = message.content[0].text.trim();
          } else {
            console.warn(
              '[API /refine-user] Unexpected Anthropic response structure:',
              message.content
            );
          }
        } catch (anthropicError: any) {
          console.error('[API /refine-user] Anthropic Error:', anthropicError);
          throw new Error(
            anthropicError.error?.message ||
              anthropicError.message ||
              'Anthropic request failed'
          );
        }
        break;
      }

      // --- *** COMPLETE GOOGLE CASE (User Key) *** ---
      case 'google': {
        // Check if GOOGLE_API_KEY for managed service is even set,
        // as @google/generative-ai might need *some* valid key for instantiation,
        // even if we immediately replace it with the user's key for the actual model call.
        // However, the SDK is initialized with the user's key directly here.
        if (!key) {
          // key is the user's API key from requestBody
          console.error(
            '[API /refine-user] Google user API key missing in request for google provider.'
          );
          throw new Error('Google API Key is required from user.');
        }
        try {
          console.log(
            `[API /refine-user] Calling Google Gemini (${model}) with USER key...`
          );
          const genAI = new GoogleGenerativeAI(key); // Initialize with USER'S key
          const geminiModel = genAI.getGenerativeModel({ model: model }); // Use model from request
          const generationConfig = { temperature: 0.5, maxOutputTokens: 1000 };

          const fullPromptForGemini = `${systemPrompt}\n\nUser's prompt to refine:\n${prompt}`; // systemPrompt is defined above the switch
          const generationResult = await geminiModel.generateContent({
            contents: [
              { role: 'user', parts: [{ text: fullPromptForGemini }] },
            ],
            generationConfig,
            // safetySettings can be added if needed
          });

          const response = generationResult.response;
          refinedPrompt = response.text()?.trim() || null;
          console.log(
            '[API /refine-user] Google Gemini Raw Response Text for user key:',
            response.text()
          );
        } catch (googleError: any) {
          console.error(
            '[API /refine-user] Google Gemini Error with user key:',
            googleError
          );
          // Try to get a more specific message if available from the error structure
          let detail = 'Google Gemini request failed with user key.';
          if (googleError.message) detail = googleError.message;
          // Check for specific error types if the SDK provides them, e.g., auth errors
          if (
            googleError
              .toString()
              .toLowerCase()
              .includes('permission denied') ||
            googleError.toString().toLowerCase().includes('api key not valid')
          ) {
            detail = 'Invalid Google API Key or permission denied.';
          }
          throw new Error(detail);
        }
        break;
      }
      // --- *** END COMPLETE GOOGLE CASE *** ---

      default:
        return NextResponse.json(
          { error: `Unsupported provider: ${provider}` },
          { status: 400 }
        );
    } // Close switch

    // 4. Check response and return
    if (!refinedPrompt) {
      console.error(
        `[API /refine-user] No refined content received from ${provider} (${model}).`
      );
      throw new Error(`No content received from ${provider}.`);
    }
    console.log(`[API /refine-user] Refinement successful via proxy.`);
    return NextResponse.json({ refinedPrompt });
  } catch (error: any) {
    // Catch errors from SDK initialization or API calls
    console.error(`[API /refine-user] Overall Error:`, error);
    // Return a user-friendly error based on common issues
    let userErrorMessage = `Failed to refine prompt using ${provider}.`;
    if (
      error.message?.includes('key') ||
      error.message?.includes('401') ||
      error.message?.includes('authentication')
    ) {
      userErrorMessage = 'Authentication failed. Please check your API Key.';
    } else if (
      error.message?.includes('429') ||
      error.message?.includes('rate limit')
    ) {
      userErrorMessage = 'API rate limit exceeded. Please try again later.';
    } else if (
      error.message?.includes('not found') ||
      error.message?.includes('404')
    ) {
      userErrorMessage = `Model '${model}' not found or accessible with this key.`;
    } else if (error.message) {
      userErrorMessage = error.message; // Use the error message if available
    }
    return NextResponse.json({ error: userErrorMessage }, { status: 500 }); // Internal Server Error (or specific code?)
  }
}
