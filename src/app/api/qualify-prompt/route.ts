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

export interface QualificationResult {
  type: 'valid_prompt' | 'meta_question' | 'gibberish' | 'too_short' | 'error';
  detail?: string; // e.g., error message or rephrased request
}

// Define the system prompt for the qualifier LLM
const QUALIFIER_SYSTEM_PROMPT = `You are a prompt analysis assistant. Analyze the user-provided text and classify its intent based ONLY on the following categories:
1.  'valid_prompt': The text is a reasonably well-formed instruction, question, or piece of text intended for an LLM to process or refine further. It is not asking HOW to make a prompt, nor is it nonsensical.
2.  'meta_question': The text is primarily asking FOR help creating a prompt, asking ABOUT prompts, or asking how to use AI for a task (e.g., "how do I write a prompt for X?", "create a prompt to do Y", "can AI summarize Z?").
3.  'gibberish': The text is nonsensical, random characters, or clearly not intended as a prompt or question.
4.  'too_short': The text is too brief (e.g., less than 5 words) to be meaningfully processed or refined.

Output ONLY a JSON object containing the classification. Format: {"type": "CATEGORY_NAME"}
Example 1: User provides "Write a poem about cats". Output: {"type": "valid_prompt"}
Example 2: User provides "How to make prompts better?". Output: {"type": "meta_question"}
Example 3: User provides "asdf ghjkl". Output: {"type": "gibberish"}
Example 4: User provides "Summarize". Output: {"type": "too_short"}
`;

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

  // Basic length check before calling LLM
  if (promptText.trim().length < 5) {
    console.log('[API /qualify] Input too short:', promptText);
    return NextResponse.json({ type: 'too_short' } as QualificationResult);
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
      max_tokens: 50, // Should be enough for the JSON output
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
      // Validate the parsed structure
      if (
        typeof parsed.type === 'string' &&
        ['valid_prompt', 'meta_question', 'gibberish', 'too_short'].includes(
          parsed.type
        )
      ) {
        classificationResult = { type: parsed.type };
      } else {
        throw new Error(
          'Invalid JSON structure or type received from qualification model.'
        );
      }
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
