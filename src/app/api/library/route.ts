// src/app/api/library/route.ts // COMPLETE NEW FILE

import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server'; // Adjust path if needed

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient(); // Use server client, RLS handles public read access
  const { searchParams } = new URL(request.url);

  // --- Get Query Parameters for Filtering/Searching/Pagination ---
  const category = searchParams.get('category');
  const searchTerm = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '10'); // Default limit 10
  const offset = parseInt(searchParams.get('offset') || '0'); // Default offset 0

  console.log(
    `[API Library GET] Request received. Category: ${category}, Search: ${searchTerm}, Limit: ${limit}, Offset: ${offset}`
  );

  try {
    // --- Build the Query ---
    let query = supabase
      .from('shared_library_items')
      .select(
        'id, name, description, category, tags, components, suggested_provider, suggested_model, example_input, example_output_description, is_featured, created_at',
        { count: 'exact' }
      ); // Fetch count for pagination

    // Apply category filter
    if (category && typeof category === 'string') {
      query = query.eq('category', category);
    }

    // Apply search term filter (searching name and description)
    // For tags, PostgreSQL array operations are needed: name_of_array @> ARRAY['tag1','tag2']
    // This example uses simple text search on name/description.
    // For more advanced tag search, consider using .rpc() to call a DB function or adjust query.
    if (searchTerm && typeof searchTerm === 'string') {
      // Basic search across name and description. Use 'ilike' for case-insensitive.
      // For more complex search, PostgreSQL full-text search (tsvector) is better.
      query = query.or(
        `name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`
      );
      // To search tags: query = query.filter('tags', 'cs', `{${searchTerm}}`); // 'cs' means 'contains' for array
    }

    // Apply ordering (e.g., featured first, then by name or creation date)
    query = query
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // --- Execute the Query ---
    const { data: items, error: dbError, count } = await query;

    if (dbError) {
      console.error(
        '[API Library GET] DB Error fetching library items:',
        dbError
      );
      throw dbError;
    }

    console.log(
      `[API Library GET] Fetched ${items?.length ?? 0} items. Total count: ${count}`
    );
    return NextResponse.json({ items: items || [], totalCount: count || 0 });
  } catch (error: any) {
    console.error('[API Library GET] Catch block error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch library items.', details: error.message },
      { status: 500 }
    );
  }
}
