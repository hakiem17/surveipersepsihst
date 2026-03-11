import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Initialize Supabase admin client to bypass RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET Settings
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('pengaturan_sistem')
      .select('*')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore error if no rows found
      throw error;
    }

    return NextResponse.json({ success: true, data: data || null });
  } catch (error: any) {
    console.error("Error fetching pengaturan:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// UPDATE Settings
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    
    // Validate only allowed fields
    const { status_survei_aktif, tahun_berjalan, pesan_penutupan } = body;
    
    const { data, error } = await supabaseAdmin
      .from('pengaturan_sistem')
      .update({
        status_survei_aktif,
        tahun_berjalan,
        pesan_penutupan,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error updating pengaturan:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
