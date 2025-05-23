// src/app/api/user-settings/route.ts // COMPLETE FILE REPLACEMENT

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { type PromptSettings } from '@/app/context/PromptContext'; // Import the updated type

// Define specific payload types
interface UserApiKeySavePayload {
  provider_to_save: string;
  plaintext_api_key: string;
  consent_given: boolean;
}
interface UserPreferencesPayload {
  last_selected_provider?: string;
  last_selected_model?: string;
  last_selected_strategy?: string;
}
type UserSettingsPostBody = UserApiKeySavePayload | UserPreferencesPayload;

// DB structure (subset for this route)
interface UserSettingsFromDB {
  last_selected_provider?: string | null;
  last_selected_model?: string | null;
  last_selected_strategy?: string | null;
  user_api_keys_encrypted?: { [key: string]: string } | null; // JSONB from DB
}

// --- GET Handler ---
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
    const { data: settingsRow, error: dbError } = (await supabase
      .from('user_settings')
      .select(
        'last_selected_provider, last_selected_model, last_selected_strategy, user_api_keys_encrypted'
      )
      .eq('user_id', user.id)
      .maybeSingle()) as { data: UserSettingsFromDB | null; error: any };

    if (dbError) throw dbError;

    // --- Use updated PromptSettings type here ---
    const responseSettings: PromptSettings & {
      last_selected_strategy?: string | null;
      active_session_api_key?: string | null;
      active_key_provider?: string | null;
    } = {
      last_selected_provider: settingsRow?.last_selected_provider || null,
      last_selected_model: settingsRow?.last_selected_model || null,
      last_selected_strategy: settingsRow?.last_selected_strategy || null,
      has_openai_key_saved: !!(settingsRow?.user_api_keys_encrypted as any)
        ?.openai,
      has_anthropic_key_saved: !!(settingsRow?.user_api_keys_encrypted as any)
        ?.anthropic,
      has_google_key_saved: !!(settingsRow?.user_api_keys_encrypted as any)
        ?.google, // <<< Now valid
    };
    // --- End ---

    if (
      settingsRow?.last_selected_strategy === 'userKey' &&
      settingsRow.last_selected_provider
    ) {
      const providerKey = settingsRow.last_selected_provider.toLowerCase();
      const encryptedKeyHex =
        settingsRow.user_api_keys_encrypted?.[providerKey];
      if (encryptedKeyHex) {
        const { data: decryptedKey, error: rpcError } = await supabase.rpc(
          'decrypt_api_key_hex',
          { encrypted_hex_text: encryptedKeyHex }
        );
        if (rpcError) {
          console.error(`RPC decrypt error for ${providerKey}:`, rpcError);
        } else if (decryptedKey) {
          responseSettings.active_session_api_key = decryptedKey;
          responseSettings.active_key_provider = providerKey;
        }
      }
    }
    return NextResponse.json({ settings: responseSettings });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch settings.', details: error.message },
      { status: 500 }
    );
  }
}

// --- POST Handler ---
export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: UserSettingsPostBody;
  try {
    body = await request.json();
  } catch (e: any) {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  console.log(
    `[API UserSettings POST / User: ${user.id}] Received payload:`,
    body
  );
  try {
    const { data: currentRow, error: fetchError } = (await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()) as { data: UserSettingsFromDB | null; error: any };
    if (fetchError) throw fetchError;

    let currentApiKeysEncrypted =
      (currentRow?.user_api_keys_encrypted as {
        [key: string]: string;
      } | null) || {};
    let finalApiKeysEncrypted = { ...currentApiKeysEncrypted };

    const dataToUpsert: Partial<
      UserSettingsFromDB & { user_id: string; updated_at: string }
    > = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
      last_selected_provider: currentRow?.last_selected_provider,
      last_selected_model: currentRow?.last_selected_model,
      last_selected_strategy: currentRow?.last_selected_strategy,
    };

    if ('provider_to_save' in body && 'plaintext_api_key' in body) {
      const apiKeyPayload = body as UserApiKeySavePayload; // UserApiKeySavePayload should be defined
      const providerKey = apiKeyPayload.provider_to_save.toLowerCase();
      if (
        'consent_given' in body &&
        body.consent_given &&
        apiKeyPayload.plaintext_api_key?.trim()
      ) {
        const { data: encryptedKey, error: rpcError } = await supabase.rpc(
          'encrypt_api_key_hex',
          { input_text: apiKeyPayload.plaintext_api_key }
        );
        if (rpcError || !encryptedKey)
          throw new Error(rpcError?.message || 'Encryption failed.');
        finalApiKeysEncrypted[providerKey] = encryptedKey;
      } else {
        delete finalApiKeysEncrypted[providerKey];
      }
      dataToUpsert.user_api_keys_encrypted = finalApiKeysEncrypted;
    }

    if (
      'last_selected_provider' in body &&
      body.last_selected_provider !== undefined
    )
      dataToUpsert.last_selected_provider = body.last_selected_provider;
    if ('last_selected_model' in body && body.last_selected_model !== undefined)
      dataToUpsert.last_selected_model = body.last_selected_model;
    if (
      'last_selected_strategy' in body &&
      body.last_selected_strategy !== undefined
    )
      dataToUpsert.last_selected_strategy = body.last_selected_strategy;

    const { data: upsertedData, error: dbError } = await supabase
      .from('user_settings')
      .upsert(dataToUpsert, { onConflict: 'user_id' })
      .select(
        'last_selected_provider, last_selected_model, last_selected_strategy, user_api_keys_encrypted'
      )
      .single();
    if (dbError) throw dbError;

    // --- Use updated PromptSettings type here ---
    const responseSettings: PromptSettings = {
      last_selected_provider: upsertedData?.last_selected_provider || null,
      last_selected_model: upsertedData?.last_selected_model || null,
      last_selected_strategy: upsertedData?.last_selected_strategy || null, // Not part of PromptSettings for frontend state directly
      has_openai_key_saved: !!(upsertedData?.user_api_keys_encrypted as any)
        ?.openai,
      has_anthropic_key_saved: !!(upsertedData?.user_api_keys_encrypted as any)
        ?.anthropic,
      has_google_key_saved: !!(upsertedData?.user_api_keys_encrypted as any)
        ?.google, // <<< Now valid
    };
    // Add last_selected_strategy separately if needed by frontend context for direct use
    const fullResponse = {
      ...responseSettings,
      last_selected_strategy: upsertedData?.last_selected_strategy || null,
    };
    // --- End ---

    return NextResponse.json({ success: true, settings: fullResponse }); // Send fullResponse
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings.', details: error.message },
      { status: 500 }
    );
  }
}
