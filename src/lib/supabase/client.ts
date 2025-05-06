// src/lib/supabase/client.ts // COMPLETE NEW FILE
import { createBrowserClient } from '@supabase/ssr'; // Use browser client for frontend

// Ensure these environment variables are set and prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key environment variables');
}

// Create a singleton Supabase client for the browser
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

// You might also create a server client later for API routes using the service key
// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// export const createSupabaseServerClient = () => { ... } // Example
