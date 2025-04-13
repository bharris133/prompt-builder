// src/app/api/refine/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
// Later: Import other SDKs like Anthropic, Google etc.

// --- Helper: Initialize OpenAI Client ---
function getOpenAIClient() {
    const apiKey = process.env.OPENAI_API_KEY;
    // *** Add this log for debugging ***
    //console.log("[API Route] Reading OPENAI_API_KEY from process.env:", apiKey ? "OPENAI_API_KEY Found(partially hidden" : "NOT FOUND or Empty");
    
    if (!apiKey) {
        console.error('[API Route] OpenAI API key not configured');
        return null; // Return null if key is missing
    }
    try {
         return new OpenAI({ apiKey });
    } catch (error) {
        console.error("[API Route] Error initializing OpenAI client:", error);
        return null;
    }
}

// --- Define the structure of the expected request body ---
interface RefineRequestBody {
    prompt: string;
    provider?: string;
    model?: string;
}

export async function POST(request: Request) {
    let requestBody: RefineRequestBody;
    try {
        requestBody = await request.json();
    } catch (error) {
        console.error('[API Route] Error parsing request body:', error);
        return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
    }

    const { prompt } = requestBody;
    const provider = requestBody.provider || 'openai'; // Default provider
    const model = requestBody.model; // Model comes from request, specific default applied below

    // Validate prompt
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    // --- Main Logic: Switch based on provider ---
    try {
        let refinedPrompt: string | null = null;
        let providerModel: string | null = null; // Track the actual model used

        console.log(`[API Route] Received request for provider: ${provider}, model: ${model || 'Default'}`);

        switch (provider.toLowerCase()) {
            case 'openai':
                const openai = getOpenAIClient();
                if (!openai) {
                    // Logged error in helper function
                    return NextResponse.json({ error: 'OpenAI API key not configured on server.' }, { status: 500 });
                }
                // Use the requested model or default if none provided
                providerModel = model || 'gpt-3.5-turbo'; // Default OpenAI model

                console.log(`[API Route] Refining with OpenAI (${providerModel})...`);

                const completion = await openai.chat.completions.create({
                    model: providerModel,
                    messages: [
                        {
                            role: 'system',
                            content: `You are an expert prompt engineer assistant. The user will provide prompt components (like Instructions, Context, Role, Example Input, Example Output, Tools). Your task is to combine these components into a single, cohesive, and effective prompt suitable for a large language model. Ensure the final prompt clearly incorporates the intent and details from all provided components. Structure the output logically. Output *only* the final combined and refined prompt text, without any explanations or preambles.`,
                        },
                        { role: 'user', content: prompt },
                    ],
                    temperature: 0.5,
                    max_tokens: 1000, // Consider making this configurable later
                });
                refinedPrompt = completion.choices[0]?.message?.content?.trim() || null;
                console.log('[API Route] OpenAI Raw Response Choice:', completion.choices[0]); // Log choice for debugging
                break;

            // --- Placeholder for future providers ---
            // case 'anthropic':
            // case 'google':
            //     return NextResponse.json({ error: `${provider} not yet implemented.` }, { status: 501 });
            //     break;

            default:
                 console.warn(`[API Route] Unsupported provider requested: ${provider}`);
                return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
        }

        // --- Check response and return ---
        if (!refinedPrompt) {
             console.error(`[API Route] No refined prompt content received from ${provider} (${providerModel}).`);
             throw new Error(`No content received from ${provider}.`);
        }
         console.log(`[API Route] Refinement successful from ${provider} (${providerModel}).`);
        return NextResponse.json({ refinedPrompt });

    } catch (error: any) {
        console.error(`[API Route] Error calling ${provider} API:`, error);
        let errorMessage = `Failed to refine prompt using ${provider}.`;
        // Attempt to get more specific error details
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = `[${provider} API Error]: ${error.response.data.error.message || error.message}`;
        } else if (error.message) {
             errorMessage += ` ${error.message}`;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// Optional: Add handler for GET or other methods if needed, otherwise they default to 405 Method Not Allowed
// export async function GET(request: Request) {
//     return NextResponse.json({ message: "Method Not Allowed" }, { status: 405 });
// }