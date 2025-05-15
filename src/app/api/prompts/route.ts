// src/app/api/prompts/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Import server client helper
import {
  SavedPromptEntry,
  PromptSettings,
  PromptComponentData,
} from '@/app/context/PromptContext'; // Import types

// --- GET Handler (List User's Prompts) ---
// src/app/api/prompts/route.ts // REPLACE THE GET FUNCTION

// ... (imports, createSupabaseServerClient - keep these) ...

// --- GET Handler (List User's Prompts OR Get Single Prompt by ID) ---
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get('id'); // Check for an ID query parameter

  // 1. Get User Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (promptId) {
      // --- Fetch a SINGLE Prompt by ID ---
      console.log(
        `[API Prompts GET] Fetching single prompt ID '${promptId}' for user ${user.id}`
      );
      const { data: singlePrompt, error: dbError } = await supabase
        .from('prompts')
        .select('*') // Select all columns for a single prompt
        .eq('user_id', user.id)
        .eq('id', promptId)
        .single(); // Expect a single object or null

      if (dbError) {
        console.error(
          `[API Prompts GET] DB Error fetching single prompt ${promptId}:`,
          dbError
        );
        // Differentiate "not found" from other errors
        if (dbError.code === 'PGRST116') {
          // PostgREST code for "Fetched zero rows" on .single()
          return NextResponse.json(
            { error: 'Prompt not found.' },
            { status: 404 }
          );
        }
        throw dbError;
      }
      if (!singlePrompt) {
        // Should be caught by dbError.code PGRST116 with .single()
        return NextResponse.json(
          { error: 'Prompt not found.' },
          { status: 404 }
        );
      }
      console.log(
        `[API Prompts GET] Successfully fetched single prompt:`,
        singlePrompt.name
      );
      return NextResponse.json({ prompt: singlePrompt }); // Return as { prompt: {...} }
    } else {
      // --- Fetch a LIST of Prompts ---
      console.log(
        `[API Prompts GET] Fetching list of prompts for user ${user.id}`
      );
      const { data: prompts, error: dbError } = await supabase
        .from('prompts')
        .select('id, name, updated_at, settings') // Only essential fields for listing
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (dbError) {
        console.error(
          '[API Prompts GET] DB Error fetching prompt list:',
          dbError
        );
        throw dbError;
      }
      const promptList =
        prompts?.map((p) => ({
          id: p.id,
          name: p.name,
          updatedAt: p.updated_at,
          settings: p.settings,
        })) || [];
      console.log(
        `[API Prompts GET] Fetched ${promptList.length} prompts for list view.`
      );
      return NextResponse.json({ prompts: promptList }); // Return as { prompts: [...] }
    }
  } catch (error: any) {
    console.error('[API Prompts GET] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt(s).', details: error.message },
      { status: 500 }
    );
  }
}
// --- POST Handler (Create/Update User's Prompt) ---
interface PromptPostBody {
  name: string;
  components: PromptComponentData[];
  settings: PromptSettings;
  // id?: string; // Include ID if allowing updates via POST, or use PUT/PATCH
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();

  // 1. Get User Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse Request Body
  let body: PromptPostBody;
  try {
    body = await request.json();
    // Add basic validation for required fields
    if (!body.name || !body.components || !body.settings) {
      throw new Error(
        'Missing required fields (name, components, settings) in request body.'
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  // 3. Prepare data for Upsert (Insert or Update)
  // Supabase upsert requires specifying the conflict target (e.g., unique constraint)
  // Let's assume we want to update if 'name' and 'user_id' match.
  // Requires a UNIQUE constraint on (user_id, name) in the DB table!
  // ALTER TABLE public.prompts ADD CONSTRAINT prompts_user_id_name_key UNIQUE (user_id, name);
  const promptData = {
    user_id: user.id, // Ensure user_id is set
    name: body.name,
    components: body.components,
    settings: body.settings,
    updated_at: new Date().toISOString(), // Manually set updated_at on upsert
  };

  // 4. Perform Upsert Operation
  try {
    console.log(
      `[API Prompts POST] Upserting prompt '${body.name}' for user ${user.id}`
    );
    const { data, error: dbError } = await supabase
      .from('prompts')
      .upsert(promptData, { onConflict: 'user_id, name' }) // Specify columns for conflict check
      .select('id, name') // Select some data to confirm success
      .single(); // Expect a single row back

    if (dbError) {
      console.error('[API Prompts POST] DB Error upserting prompt:', dbError);
      throw dbError;
    }

    console.log(`[API Prompts POST] Upsert successful:`, data);
    // Return the name/id of the saved prompt
    return NextResponse.json({ success: true, prompt: data });
  } catch (error: any) {
    console.error('[API Prompts POST] Catch block error:', error);
    // Handle unique constraint violation specifically if needed
    if (
      error.message?.includes('duplicate key value violates unique constraint')
    ) {
      return NextResponse.json(
        { error: 'Prompt name already exists.', details: error.message },
        { status: 409 }
      ); // Conflict
    }
    return NextResponse.json(
      { error: 'Failed to save prompt.', details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE Handler (Delete User's Prompt) ---
// Expecting prompt ID or name as query parameter, e.g., /api/prompts?id=UUID or ?name=PROMPT_NAME
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get('id');
  const promptName = searchParams.get('name'); // Allow deleting by name too? Requires name unique per user.

  // 1. Get User Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate Input (Need ID or Name)
  if (!promptId && !promptName) {
    return NextResponse.json(
      { error: 'Prompt ID or Name query parameter is required.' },
      { status: 400 }
    );
  }

  // 3. Perform Delete Operation
  try {
    let query = supabase.from('prompts').delete().eq('user_id', user.id); // Match user ID (RLS enforces too)

    if (promptId) {
      console.log(
        `[API Prompts DELETE] Deleting prompt ID '${promptId}' for user ${user.id}`
      );
      query = query.eq('id', promptId);
    } else if (promptName) {
      // Ensure you have a UNIQUE constraint on (user_id, name) if deleting by name
      console.log(
        `[API Prompts DELETE] Deleting prompt NAME '${promptName}' for user ${user.id}`
      );
      query = query.eq('name', promptName);
    }

    const { error: dbError } = await query;

    if (dbError) {
      console.error('[API Prompts DELETE] DB Error deleting prompt:', dbError);
      throw dbError;
    }

    console.log(`[API Prompts DELETE] Delete successful for user ${user.id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Prompts DELETE] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt.', details: error.message },
      { status: 500 }
    );
  }
}

// --- PATCH Handler (Update Prompt - e.g., for Renaming) ---
interface PromptPatchBody {
  id: string; // ID of the prompt to update
  newName?: string; // New name for the prompt
  // Could add other fields to update later, like components or settings
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();

  // 1. Get User Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse Request Body
  let body: PromptPatchBody;
  try {
    body = await request.json();
    if (!body.id) {
      throw new Error('Prompt ID is required for update.');
    }
    if (
      !body.newName ||
      typeof body.newName !== 'string' ||
      body.newName.trim().length === 0
    ) {
      throw new Error('New name is required and cannot be empty.');
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  const { id: promptId, newName } = body;

  // 3. Prepare data for Update
  const dataToUpdate: { name: string; updated_at: string } = {
    name: newName.trim(),
    updated_at: new Date().toISOString(),
  };

  // 4. Perform Update Operation
  try {
    console.log(
      `[API Prompts PATCH] Updating prompt ID '${promptId}' to name '${newName.trim()}' for user ${user.id}`
    );

    // Check if the new name already exists for this user (excluding the current prompt being renamed)
    // This requires ensuring names are unique per user, ideally via a DB constraint (user_id, name)
    // If you have the UNIQUE constraint (user_id, name), Supabase will throw an error which we can catch.
    // If not, you might want to add an explicit check here:
    // const { data: existingNameCheck, error: nameCheckError } = await supabase
    //    .from('prompts')
    //    .select('id')
    //    .eq('user_id', user.id)
    //    .eq('name', newName.trim())
    //    .neq('id', promptId) // Exclude the current prompt
    //    .maybeSingle();
    // if (nameCheckError) throw nameCheckError;
    // if (existingNameCheck) {
    //    return NextResponse.json({ error: `A prompt with the name "${newName.trim()}" already exists.` }, { status: 409 }); // Conflict
    // }

    const { data: updatedPrompt, error: dbError } = await supabase
      .from('prompts')
      .update(dataToUpdate)
      .eq('user_id', user.id) // Ensure user owns the prompt
      .eq('id', promptId) // Match the specific prompt ID
      .select('id, name, updated_at') // Return updated fields
      .single(); // Expect a single row back

    if (dbError) {
      console.error('[API Prompts PATCH] DB Error updating prompt:', dbError);
      // Handle specific error for unique constraint violation (if name needs to be unique)
      if (dbError.code === '23505') {
        // PostgreSQL unique violation error code
        return NextResponse.json(
          {
            error: `A prompt with the name "${newName.trim()}" already exists.`,
          },
          { status: 409 }
        ); // Conflict
      }
      throw dbError;
    }

    if (!updatedPrompt) {
      return NextResponse.json(
        { error: 'Prompt not found or user unauthorized to update.' },
        { status: 404 }
      );
    }

    console.log(`[API Prompts PATCH] Update successful:`, updatedPrompt);
    return NextResponse.json({ success: true, prompt: updatedPrompt });
  } catch (error: any) {
    console.error('[API Prompts PATCH] Catch block error:', error);
    // This generic catch is a fallback
    return NextResponse.json(
      { error: 'Failed to update prompt.', details: error.message },
      { status: 500 }
    );
  }
}
