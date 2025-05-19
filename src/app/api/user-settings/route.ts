// src/app/api/user-settings/route.ts - Corrected Types & Imports

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
// --- NEW: Import PromptSettings type ---
import { type PromptSettings } from '@/app/context/PromptContext'; // Adjust path if needed

// --- Define specific payload types for clarity ---
interface UserApiKeySavePayload {
  provider_to_save: string; // e.g., 'openai', 'anthropic' - matches context
  plaintext_api_key: string; // The new key to save (or empty string to remove)
  consent_given: boolean; // Whether user consented to save
}

interface UserPreferencesPayload {
  last_selected_provider?: string;
  last_selected_model?: string;
}

// Union type for the request body
type UserSettingsPostBody = UserApiKeySavePayload | UserPreferencesPayload;
// --- End Payload Types ---

// --- GET Handler (Fetch User Settings) ---
export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  console.log(`[API UserSettings GET] Fetching settings for user: ${user.id}`);
  try {
    const { data: settingsRow, error: dbError } = await supabase
      .from('user_settings')
      // Select all relevant fields including the new JSONB column
      .select(
        'last_selected_provider, last_selected_model, user_api_keys_encrypted'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) throw dbError;

    // --- Use PromptSettings type for the response structure ---
    const finalSettings: PromptSettings = {
      last_selected_provider: settingsRow?.last_selected_provider || null,
      last_selected_model: settingsRow?.last_selected_model || null,
      has_openai_key_saved: !!(settingsRow?.user_api_keys_encrypted as any)
        ?.openai, // Cast to any for dynamic access
      has_anthropic_key_saved: !!(settingsRow?.user_api_keys_encrypted as any)
        ?.anthropic,
    };
    // --- End ---

    console.log(`[API UserSettings GET] Settings processed:`, finalSettings);
    return NextResponse.json({ settings: finalSettings });
  } catch (error: any) {
    console.error('[API UserSettings GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings.', details: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler (Update/Upsert User Settings) ---
// ... (imports, type definitions, GET function - keep them as they are) ...
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: UserSettingsPostBody; // UserApiKeySavePayload | UserPreferencesPayload
  try {
    body = await request.json();
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Invalid request body.', details: error.message },
      { status: 400 }
    );
  }

  console.log(
    `[API UserSettings POST / User: ${user.id}] Received payload:`,
    JSON.stringify(body)
  );

  try {
    const { data: currentRow, error: fetchError } = await supabase
      .from('user_settings')
      .select(
        'user_api_keys_encrypted, last_selected_provider, last_selected_model'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error(
        '[API UserSettings POST] Error fetching current settings:',
        fetchError
      );
      throw fetchError;
    }
    console.log(
      '[API UserSettings POST] Current settings from DB before update:',
      currentRow
    );

    const currentApiKeysEncrypted =
      (currentRow?.user_api_keys_encrypted as {
        [key: string]: string;
      } | null) || {};
    let finalApiKeysEncrypted = { ...currentApiKeysEncrypted };

    // Initialize dataToUpsert with known fields and existing values to preserve them
    const dataToUpsert: {
      user_id: string;
      updated_at: string;
      last_selected_provider?: string | null;
      last_selected_model?: string | null;
      user_api_keys_encrypted?: { [key: string]: string };
    } = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      last_selected_provider: currentRow?.last_selected_provider,
      last_selected_model: currentRow?.last_selected_model,
      user_api_keys_encrypted: finalApiKeysEncrypted, // Initialize with current/cloned
    };

    // Handle API key saving/clearing
    if (
      'provider_to_save' in body &&
      'plaintext_api_key' in body &&
      'consent_given' in body
    ) {
      const apiKeyPayload = body as UserApiKeySavePayload;
      const providerKey = apiKeyPayload.provider_to_save.toLowerCase();

      if (
        apiKeyPayload.consent_given &&
        apiKeyPayload.plaintext_api_key &&
        apiKeyPayload.plaintext_api_key.trim() !== ''
      ) {
        console.log(
          `[API UserSettings POST] Encrypting key for ${providerKey}: ${apiKeyPayload.plaintext_api_key.substring(0, 5)}...`
        );
        const { data: encryptedKey, error: rpcEncryptError } =
          await supabase.rpc('encrypt_api_key_hex', {
            input_text: apiKeyPayload.plaintext_api_key,
          });
        if (rpcEncryptError) throw rpcEncryptError;
        if (!encryptedKey)
          throw new Error(`Encryption returned null for ${providerKey}.`);
        finalApiKeysEncrypted[providerKey] = encryptedKey;
        console.log(
          `[API UserSettings POST] Encrypted key generated for ${providerKey}.`
        );
      } else {
        console.log(
          `[API UserSettings POST] Clearing/removing key for ${providerKey}. Consent: ${apiKeyPayload.consent_given}, Key empty: ${!apiKeyPayload.plaintext_api_key?.trim()}`
        );
        delete finalApiKeysEncrypted[providerKey];
      }
      dataToUpsert.user_api_keys_encrypted = finalApiKeysEncrypted; // Assign updated keys object
    }

    // Handle preference updates
    if (
      'last_selected_provider' in body &&
      body.last_selected_provider !== undefined
    ) {
      dataToUpsert.last_selected_provider = body.last_selected_provider;
      console.log(
        `[API UserSettings POST] Updating last_selected_provider to: ${body.last_selected_provider}`
      );
    }
    if (
      'last_selected_model' in body &&
      body.last_selected_model !== undefined
    ) {
      dataToUpsert.last_selected_model = body.last_selected_model;
      console.log(
        `[API UserSettings POST] Updating last_selected_model to: ${body.last_selected_model}`
      );
    }

    // --- Log dataToUpsert right before the database call ---
    console.log(
      `[API UserSettings POST] Final data to upsert for user ${user.id}:`,
      {
        last_selected_provider: dataToUpsert.last_selected_provider,
        last_selected_model: dataToUpsert.last_selected_model,
        user_api_keys_encrypted_keys_present: Object.keys(
          dataToUpsert.user_api_keys_encrypted || {}
        ), // Log only keys for security
      }
    );
    // --- End Log ---

    const { data: upsertedData, error: dbError } = await supabase
      .from('user_settings')
      .upsert(dataToUpsert, { onConflict: 'user_id' })
      .select(
        'last_selected_provider, last_selected_model, user_api_keys_encrypted'
      ) // Return updated state
      .single();

    if (dbError) {
      console.error('[API UserSettings POST] DB Upsert Error:', dbError);
      throw dbError;
    }

    const responseSettings: PromptSettings = {
      last_selected_provider: upsertedData?.last_selected_provider || null,
      last_selected_model: upsertedData?.last_selected_model || null,
      has_openai_key_saved: !!(upsertedData?.user_api_keys_encrypted as any)
        ?.openai,
      has_anthropic_key_saved: !!(upsertedData?.user_api_keys_encrypted as any)
        ?.anthropic,
    };

    console.log(
      `[API UserSettings POST] Settings upserted successfully. Responding with:`,
      responseSettings
    );
    return NextResponse.json({ success: true, settings: responseSettings });
  } catch (error: any) {
    console.error('[API UserSettings POST] Catch block error:', error.message);
    return NextResponse.json(
      { error: 'Failed to update user settings.', details: error.message },
      { status: 500 }
    );
  }
}
