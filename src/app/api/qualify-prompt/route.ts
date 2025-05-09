// src/app/api/qualify-prompt/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Use your backend OpenAI key for this internal check
// Ensure OPENAI_API_KEY is set in your .env.local
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Define expected request and structured response
interface QualifyRequestBody {
  promptText: string;
}

// --- UPDATED: Qualification Result Type ---
export interface QualificationResult {
  type:
    | 'valid_for_refinement'
    | 'meta_request_for_prompt'
    | 'too_vague_or_incomplete'
    | 'gibberish'
    | 'error';
  detail?: string;
}
// --- END UPDATE ---

// Define the system prompt for the qualifier LLM
// --- UPDATED: Qualifier System Prompt ---
const QUALIFIER_SYSTEM_PROMPT = `You are a prompt analysis assistant. Your task is to classify user input intended for a prompt refinement process.
Categories:
1.  'valid_for_refinement': The text contains enough substance, clear intent, or structure that an expert prompt engineer could meaningfully refine it into a better prompt. It might be a complete prompt, a good starting instruction, or a clear request for content.
2.  'meta_request_for_prompt': The text is asking for assistance in *creating* a new prompt from scratch (e.g., "Help me write a prompt for X", "What's a good prompt to summarize text?", "Create a prompt for a customer service bot").
3.  'too_vague_or_incomplete': The text is too short (e.g., less than 5 words), ambiguous, or lacks enough context/detail to be meaningfully refined into a specific, actionable prompt (e.g., "summary", "tell me something", "image").
4.  'gibberish': The text is nonsensical, random characters, or clearly not intended as a prompt or question.

Output ONLY a JSON object: {"type": "CATEGORY_NAME"}
Example 1 User: "Write a poem about cats". Output: {"type": "valid_for_refinement"}
Example 2 User: "How to make prompts better?". Output: {"type": "meta_request_for_prompt"}
Example 3 User: "asdf ghjkl". Output: {"type": "gibberish"}
Example 4 User: "Summarize". Output: {"type": "too_vague_or_incomplete"}
`;
// --- END UPDATE ---
export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      {
        type: 'error',
        detail: 'Qualification service not configured.',
      } as QualificationResult,
      { status: 500 }
    );
  }

  let requestBody: QualifyRequestBody;
  try {
    requestBody = await request.json();
  } catch (error) {
    return NextResponse.json(
      { type: 'error', detail: 'Invalid request body.' } as QualificationResult,
      { status: 400 }
    );
  }

  const { promptText } = requestBody;
  if (!promptText || typeof promptText !== 'string') {
    return NextResponse.json(
      {
        type: 'error',
        detail: 'promptText is required.',
      } as QualificationResult,
      { status: 400 }
    );
  }

  // Keep basic length check, aligns with 'too_vague_or_incomplete'
  if (
    promptText.trim().length < 5 &&
    !promptText.toLowerCase().includes('prompt')
  ) {
    // Allow short meta requests like "make prompt"
    console.log(
      '[API /qualify] Input too short for direct refinement:',
      promptText
    );
    // Let the LLM decide if a short query is a meta_request or too_vague
  }

  try {
    console.log('[API /qualify] Sending text for qualification:', promptText);
    const completion = await openai.chat.completions.create({
      // Use a fast and cheap model for classification
      model: 'gpt-3.5-turbo', // Or potentially gpt-4o-mini when available/tested
      messages: [
        { role: 'system', content: QUALIFIER_SYSTEM_PROMPT },
        { role: 'user', content: promptText },
      ],
      temperature: 0.0, // Low temperature for deterministic classification
      max_tokens: 60, // Should be enough for the JSON output
      response_format: { type: 'json_object' }, // Enforce JSON output if model supports
    });

    const resultJson = completion.choices[0]?.message?.content;
    console.log('[API /qualify] Raw qualification response:', resultJson);

    if (!resultJson) {
      throw new Error('No content received from qualification model.');
    }

    // Parse the JSON response from the LLM
    let classificationResult: QualificationResult;
    try {
      const parsed = JSON.parse(resultJson);
      // --- UPDATED: Validate against new types ---
      const validTypes = [
        'valid_for_refinement',
        'meta_request_for_prompt',
        'too_vague_or_incomplete',
        'gibberish',
      ];
      if (typeof parsed.type === 'string' && validTypes.includes(parsed.type)) {
        classificationResult = {
          type: parsed.type as QualificationResult['type'],
        }; // Type assertion
      } else {
        throw new Error(
          'Invalid JSON structure or type from qualification model.'
        );
      }
      // --- END UPDATE ---
    } catch (parseError) {
      console.error(
        '[API /qualify] Failed to parse JSON response:',
        parseError,
        '-- Raw:',
        resultJson
      );
      throw new Error('Could not understand qualification model response.');
    }

    console.log('[API /qualify] Qualification result:', classificationResult);
    return NextResponse.json(classificationResult);
  } catch (error: any) {
    console.error('[API /qualify] Error during qualification call:', error);
    let errorMessage = 'Failed to qualify prompt.';
    if (error.message?.includes('key') || error.message?.includes('401'))
      errorMessage = 'Qualification service auth error.';
    else if (error.message) errorMessage = error.message;
    return NextResponse.json(
      { type: 'error', detail: errorMessage } as QualificationResult,
      { status: 500 }
    );
  }
}
