// src/app/api/user-settings/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Adjust path if needed

interface UserSettings {
  last_selected_provider?: string | null;
  last_selected_model?: string | null;
  // Add fields for encrypted API keys later if we implement storing them
  // encrypted_openai_api_key?: string | null; // Assuming stored as text after server-side encryption
  // encrypted_anthropic_api_key?: string | null;
}

// --- GET Handler (Fetch User Settings) ---
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log(`[API UserSettings GET] Fetching settings for user: ${user.id}`);
  try {
    const { data: settings, error: dbError } = await supabase
      .from('user_settings')
      .select('last_selected_provider, last_selected_model') // Only fetch these for now
      .eq('user_id', user.id)
      .maybeSingle(); // Use maybeSingle as settings might not exist yet

    if (dbError) throw dbError;

    if (settings) {
      console.log(`[API UserSettings GET] Settings found:`, settings);
      return NextResponse.json({ settings });
    } else {
      console.log(
        `[API UserSettings GET] No settings found for user, returning defaults.`
      );
      // Return empty object or default values if no settings found
      return NextResponse.json({ settings: {} });
    }
  } catch (error: any) {
    console.error('[API UserSettings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user settings.', details: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler (Update/Upsert User Settings) ---
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: UserSettings;
  try {
    body = await request.json();
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  const settingsToUpdate: UserSettings = {
    // Only include fields that are actually being updated
    // For now, just provider and model. API keys handled separately if/when implemented.
  };
  if (body.last_selected_provider !== undefined)
    settingsToUpdate.last_selected_provider = body.last_selected_provider;
  if (body.last_selected_model !== undefined)
    settingsToUpdate.last_selected_model = body.last_selected_model;

  if (Object.keys(settingsToUpdate).length === 0) {
    return NextResponse.json(
      { message: 'No settings provided to update.' },
      { status: 200 }
    );
  }

  console.log(
    `[API UserSettings POST] Updating settings for user ${user.id}:`,
    settingsToUpdate
  );
  try {
    const { data, error: dbError } = await supabase
      .from('user_settings')
      .upsert(
        {
          user_id: user.id, // Primary key for upsert
          ...settingsToUpdate,
          updated_at: new Date().toISOString(), // Manually update timestamp
        },
        { onConflict: 'user_id' }
      ) // Upsert on user_id conflict
      .select('last_selected_provider, last_selected_model') // Return updated settings
      .single();

    if (dbError) throw dbError;

    console.log(`[API UserSettings POST] Settings updated:`, data);
    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    console.error('[API UserSettings POST] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update user settings.', details: error.message },
      { status: 500 }
    );
  }
}
