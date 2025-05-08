// src/lib/supabase/server.ts // COMPLETE FILE REPLACEMENT - Using Supabase Recommended Code

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL or Anon Key is missing from environment variables.'
  );
}

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        // Retrieve all cookies as an array of objects
        return cookieStore.getAll().map(({ name, value }) => ({ name, value }));
      },
      setAll(
        cookiesToSet: { name: string; value: string; options?: CookieOptions }[]
      ) {
        try {
          // Set multiple cookies at once
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch (error) {
          console.warn(
            `[Supabase Server Client] Error setting cookies from server context. Error: ${error}`
          );
        }
      },
    },
  });
};
