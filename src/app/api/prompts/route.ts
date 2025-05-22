// src/app/api/prompts/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  PromptSettings,
  PromptComponentData,
} from '@/app/context/PromptContext'; // Adjust path if needed

// --- GET Handler (List User's Prompts OR Get Single Prompt by ID) ---
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get('id');

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (promptId) {
      // Fetch a SINGLE Prompt by ID
      console.log(
        `[API Prompts GET] Fetching single prompt ID '${promptId}' for user ${user.id}`
      );
      const { data: singlePrompt, error: dbError } = await supabase
        .from('prompts')
        .select('*') // Select all columns, including category
        .eq('user_id', user.id)
        .eq('id', promptId)
        .single();

      if (dbError) {
        if (dbError.code === 'PGRST116') {
          // Not found
          return NextResponse.json(
            { error: 'Prompt not found.' },
            { status: 404 }
          );
        }
        throw dbError;
      }
      if (!singlePrompt)
        return NextResponse.json(
          { error: 'Prompt not found.' },
          { status: 404 }
        );
      return NextResponse.json({ prompt: singlePrompt });
    } else {
      // Fetch a LIST of Prompts
      console.log(
        `[API Prompts GET] Fetching list of prompts for user ${user.id}`
      );
      const { data: prompts, error: dbError } = await supabase
        .from('prompts')
        .select('id, name, updated_at, settings, category') // Include category
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (dbError) throw dbError;
      // Map to ensure consistent return structure (already includes category if selected)
      const promptList = prompts || [];
      return NextResponse.json({ prompts: promptList });
    }
  } catch (error: any) {
    console.error('[API Prompts GET] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prompt(s).', details: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler (Create/Update User's Prompt - now includes category) ---
interface PromptPostBody {
  name: string;
  components: PromptComponentData[];
  settings: PromptSettings;
  category?: string | null; // Category is optional on creation
}
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: PromptPostBody;
  try {
    body = await request.json();
    if (!body.name || !body.components || !body.settings)
      throw new Error('Missing required fields (name, components, settings).');
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  const promptData = {
    user_id: user.id,
    name: body.name.trim(),
    components: body.components,
    settings: body.settings,
    category: body.category ? body.category.trim() : null, // Add category, ensure null if empty
    updated_at: new Date().toISOString(), // Ensure updated_at is set for upsert consistency
  };

  try {
    console.log(
      `[API Prompts POST] Upserting prompt '${promptData.name}' for user ${user.id}`
    );
    const { data, error: dbError } = await supabase
      .from('prompts')
      .upsert(promptData, { onConflict: 'user_id, name' }) // Assumes unique constraint (user_id, name)
      .select('id, name, category, updated_at, settings') // Return relevant fields
      .single();
    if (dbError) {
      if (dbError.code === '23505')
        return NextResponse.json(
          {
            error: `A prompt with the name "${promptData.name}" already exists.`,
          },
          { status: 409 }
        );
      throw dbError;
    }
    console.log(`[API Prompts POST] Upsert successful:`, data);
    return NextResponse.json({ success: true, prompt: data });
  } catch (error: any) {
    console.error('[API Prompts POST] Error upserting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to save prompt.', details: error.message },
      { status: 500 }
    );
  }
}

// --- PATCH Handler (Update Prompt - can update name and/or category) ---
interface PromptPatchBody {
  id: string;
  newName?: string;
  newCategory?: string | null; // Can be string or null to clear category
}
export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: PromptPatchBody;
  try {
    body = await request.json();
    if (!body.id) throw new Error('Prompt ID is required for update.');
    if (body.newName === undefined && body.newCategory === undefined)
      throw new Error('No update data (newName or newCategory) provided.');
    if (
      body.newName !== undefined &&
      (typeof body.newName !== 'string' || body.newName.trim().length === 0)
    )
      throw new Error('New name, if provided, cannot be empty.');
    if (
      body.newCategory !== undefined &&
      typeof body.newCategory !== 'string' &&
      body.newCategory !== null
    )
      throw new Error('New category must be a string or null.');
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  const { id: promptId, newName, newCategory } = body;
  const dataToUpdate: {
    name?: string;
    category?: string | null;
    updated_at: string;
  } = {
    updated_at: new Date().toISOString(),
  };
  if (newName !== undefined) dataToUpdate.name = newName.trim();
  if (newCategory !== undefined)
    dataToUpdate.category = newCategory === '' ? null : newCategory; // Set category to null if empty string passed

  try {
    console.log(
      `[API Prompts PATCH] Updating prompt ID '${promptId}' for user ${user.id}. Data:`,
      dataToUpdate
    );
    const { data: updatedPrompt, error: dbError } = await supabase
      .from('prompts')
      .update(dataToUpdate)
      .eq('user_id', user.id)
      .eq('id', promptId)
      .select('id, name, updated_at, category, settings') // Return relevant fields
      .single();

    if (dbError) {
      if (dbError.code === '23505' && dataToUpdate.name)
        return NextResponse.json(
          {
            error: `A prompt with the name "${dataToUpdate.name}" already exists.`,
          },
          { status: 409 }
        );
      throw dbError;
    }
    if (!updatedPrompt)
      return NextResponse.json(
        { error: 'Prompt not found or user unauthorized.' },
        { status: 404 }
      );
    console.log(`[API Prompts PATCH] Update successful:`, updatedPrompt);
    return NextResponse.json({ success: true, prompt: updatedPrompt });
  } catch (error: any) {
    console.error('[API Prompts PATCH] Error updating prompt:', error);
    return NextResponse.json(
      { error: 'Failed to update prompt.', details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE Handler (Unchanged - already correct) ---
export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const promptId = searchParams.get('id');
  // const promptName = searchParams.get('name'); // We decided to primarily use ID for delete

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!promptId)
    return NextResponse.json(
      { error: 'Prompt ID query parameter is required for delete.' },
      { status: 400 }
    );

  try {
    console.log(
      `[API Prompts DELETE] Deleting prompt ID '${promptId}' for user ${user.id}`
    );
    const { error: dbError } = await supabase
      .from('prompts')
      .delete()
      .eq('user_id', user.id)
      .eq('id', promptId);
    if (dbError) throw dbError;
    console.log(
      `[API Prompts DELETE] Delete successful for prompt ID ${promptId}`
    );
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Prompts DELETE] Error deleting prompt:', error);
    return NextResponse.json(
      { error: 'Failed to delete prompt.', details: error.message },
      { status: 500 }
    );
  }
}
