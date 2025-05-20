// src/app/api/refine/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk'; // Ensure this is imported
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'; // <-- Add Google SDK

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

// --- Helper: Initialize Google Client ---
function getGoogleGeminiClient() {
  const apiKey = process.env.GOOGLE_API_KEY; // Your server's Google API Key
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
// --- END Client Initializers ---

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

    // --- DEFINE systemPrompt HERE ---
    const systemPrompt = `You are an expert prompt engineer assistant. 
                          Your SOLE TASK is to refine the user-provided text into a single, 
                          cohesive, and effective prompt suitable for a large language model. 
                          Combine any provided components logically. Focus on clarity, conciseness, and structure. 
                          CRITICAL: Output ONLY the refined prompt text itself. 
                          Do NOT execute the prompt, do NOT provide explanations, 
                          do NOT add introductory or concluding remarks, do NOT add markdown formatting. 
                          ONLY output the refined prompt.`;
    // --- END DEFINITION ---

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
              content: systemPrompt,
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
          system: systemPrompt,
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

      // --- *** NEW CASE FOR GOOGLE (Managed Key) *** ---
      case 'google': {
        // This case should already be using the systemPrompt variable correctly from my last instruction
        const genAI = getGoogleGeminiClient();
        if (!genAI)
          return NextResponse.json(
            { error: 'Google AI not configured.' },
            { status: 500 }
          );
        providerModelUsed = model || 'gemini-1.5-flash-latest';
        console.log(
          `[API /refine] Refining with Google Gemini (${providerModelUsed})...`
        );
        const geminiModel = genAI.getGenerativeModel({
          model: providerModelUsed,
        });
        const generationConfig = { temperature: 0.5, maxOutputTokens: 1000 };
        const fullPromptForGemini = `${systemPrompt}\n\nUser's prompt to refine:\n${prompt}`; // <<< USES VARIABLE
        const generationResult = await geminiModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPromptForGemini }] }],
          generationConfig,
        });
        const response = generationResult.response;
        refinedPrompt = response.text()?.trim() || null;
        console.log(
          '[API /refine] Google Gemini Raw Response Text:',
          response.text()
        );
        break;
      }
      // --- *** END NEW CASE FOR GOOGLE *** ---
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
