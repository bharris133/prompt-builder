// src/app/api/templates/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Adjust path if needed
import { PromptComponentData } from '@/app/context/PromptContext'; // Import type

// --- GET Handler (List User's Templates OR Get Single Template by ID/Name) ---
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('id');
  const templateName = searchParams.get('name'); // Allow fetching by name for loading

  // 1. Get User Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (templateId) {
      // Fetch a SINGLE Template by ID (primarily for future use, e.g., edit template)
      console.log(
        `[API Templates GET] Fetching single template ID '${templateId}' for user ${user.id}`
      );
      const { data: singleTemplate, error: dbError } = await supabase
        .from('templates')
        .select('*') // Get all data for a single template
        .eq('user_id', user.id)
        .eq('id', templateId)
        .single();
      if (dbError || !singleTemplate)
        return NextResponse.json(
          { error: 'Template not found.' },
          { status: 404 }
        );
      return NextResponse.json({ template: singleTemplate });
    } else if (templateName) {
      // Fetch a SINGLE Template by NAME (for loading via dropdown)
      console.log(
        `[API Templates GET] Fetching single template NAME '${templateName}' for user ${user.id}`
      );
      const { data: singleTemplate, error: dbError } = await supabase
        .from('templates')
        .select('id, name, components, created_at, updated_at') // Get all data
        .eq('user_id', user.id)
        .eq('name', templateName)
        .maybeSingle(); // Use maybeSingle in case template name isn't strictly unique per user yet
      if (dbError) throw dbError;
      if (!singleTemplate)
        return NextResponse.json(
          { error: 'Template not found by name.' },
          { status: 404 }
        );
      return NextResponse.json({ template: singleTemplate });
    } else {
      // Fetch a LIST of Template Names (and IDs) for the dropdown
      console.log(
        `[API Templates GET] Fetching list of templates for user ${user.id}`
      );
      const { data: templates, error: dbError } = await supabase
        .from('templates')
        .select('id, name, updated_at') // Only essential fields for listing
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (dbError) throw dbError;
      const templateList =
        templates?.map((t) => ({
          id: t.id,
          name: t.name,
          updatedAt: t.updated_at,
        })) || [];
      return NextResponse.json({ templates: templateList });
    }
  } catch (error: any) {
    console.error('[API Templates GET] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template(s).', details: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler (Create/Update User's Template) ---
interface TemplatePostBody {
  name: string;
  components: PromptComponentData[];
  // id?: string; // For upsert if we allow editing by ID
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: TemplatePostBody;
  try {
    body = await request.json();
    if (!body.name || !body.components)
      throw new Error('Missing name or components.');
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  // Upsert based on user_id and name (requires unique constraint on (user_id, name) for templates table)
  // Ensure you have: ALTER TABLE public.templates ADD CONSTRAINT templates_user_id_name_key UNIQUE (user_id, name);
  const templateData = {
    user_id: user.id,
    name: body.name,
    components: body.components,
    updated_at: new Date().toISOString(), // Manually set for upsert
  };

  try {
    console.log(
      `[API Templates POST] Upserting template '${body.name}' for user ${user.id}`
    );
    const { data, error: dbError } = await supabase
      .from('templates')
      .upsert(templateData, { onConflict: 'user_id, name' }) // Assumes unique constraint on (user_id, name)
      .select('id, name') // Return some data to confirm
      .single();
    if (dbError) throw dbError;
    console.log(`[API Templates POST] Upsert successful:`, data);
    return NextResponse.json({ success: true, template: data });
  } catch (error: any) {
    console.error('[API Templates POST] Error:', error);
    if (error.message?.includes('unique constraint'))
      return NextResponse.json(
        { error: 'Template name exists.', details: error.message },
        { status: 409 }
      );
    return NextResponse.json(
      { error: 'Failed to save template.', details: error.message },
      { status: 500 }
    );
  }
}

// --- DELETE Handler (Delete User's Template by ID) ---
export async function DELETE(request: Request) {
  // *** ADD THIS LINE ***
  const supabase = await createSupabaseServerClient();
  // *** END ADDITION ***

  const { searchParams } = new URL(request.url);
  const templateId = searchParams.get('id');

  // 1. Get User Session
  // Now 'supabase' is defined and this call should work
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Validate Input (Need ID)
  if (!templateId) {
    return NextResponse.json(
      { error: 'Template ID query parameter is required.' },
      { status: 400 }
    );
  }

  // 3. Perform Delete Operation
  try {
    console.log(
      `[API Templates DELETE] Deleting template ID '${templateId}' for user ${user.id}`
    );
    // Now 'supabase' is defined and this call should work
    const { error: dbError } = await supabase
      .from('templates')
      .delete()
      .eq('user_id', user.id) // Match user ID
      .eq('id', templateId); // Match the template ID

    if (dbError) {
      console.error('[API Templates DELETE] DB Error:', dbError);
      throw dbError;
    }

    console.log(
      `[API Templates DELETE] Delete successful for user ${user.id}, template ${templateId}`
    );
    return NextResponse.json({ success: true }); // Return success
  } catch (error: any) {
    console.error('[API Templates DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete template.', details: error.message },
      { status: 500 }
    );
  }
}

// --- PATCH Handler (Update Template - e.g., for Renaming) ---
interface TemplatePatchBody {
  id: string; // ID of the template to update
  newName?: string; // New name for the template
  // We could allow updating components here too later if desired
  // components?: PromptComponentData[];
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
  let body: TemplatePatchBody;
  try {
    body = await request.json();
    if (!body.id) {
      throw new Error('Template ID is required for update.');
    }
    // Only proceed if newName is provided for rename operation
    if (body.newName === undefined) {
      // Check for undefined, as empty string might be valid if allowed
      throw new Error('Data to update (e.g., newName) is required.');
    }
    if (typeof body.newName === 'string' && body.newName.trim().length === 0) {
      throw new Error('New template name cannot be empty.');
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  const { id: templateId, newName } = body;

  // 3. Prepare data for Update (Only name and updated_at for now)
  const dataToUpdate: { name?: string; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (newName !== undefined && typeof newName === 'string') {
    // Ensure newName is a string before trimming
    dataToUpdate.name = newName.trim();
  } else if (newName !== undefined) {
    // If newName is present but not a string (e.g. null)
    return NextResponse.json(
      { error: 'New name must be a string.' },
      { status: 400 }
    );
  }

  // 4. Perform Update Operation
  try {
    console.log(
      `[API Templates PATCH] Updating template ID '${templateId}' for user ${user.id}. New data:`,
      dataToUpdate
    );

    const { data: updatedTemplate, error: dbError } = await supabase
      .from('templates')
      .update(dataToUpdate)
      .eq('user_id', user.id) // Ensure user owns the template
      .eq('id', templateId) // Match the specific template ID
      .select('id, name, updated_at') // Return updated fields
      .single(); // Expect a single row back

    if (dbError) {
      console.error(
        '[API Templates PATCH] DB Error updating template:',
        dbError
      );
      // Handle specific error for unique constraint violation on (user_id, name)
      if (dbError.code === '23505') {
        // PostgreSQL unique violation error code
        return NextResponse.json(
          {
            error: `A template with the name "${newName?.trim()}" already exists.`,
          },
          { status: 409 }
        ); // Conflict
      }
      throw dbError;
    }

    if (!updatedTemplate) {
      // This case implies the templateId didn't exist OR didn't belong to the user
      return NextResponse.json(
        { error: 'Template not found or user unauthorized to update.' },
        { status: 404 }
      );
    }

    console.log(`[API Templates PATCH] Update successful:`, updatedTemplate);
    return NextResponse.json({ success: true, template: updatedTemplate });
  } catch (error: any) {
    console.error('[API Templates PATCH] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to update template.', details: error.message },
      { status: 500 }
    );
  }
}
