import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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

// UPDATE Demografis Data (data_responden)
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, error: "ID missing" }, { status: 400 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const body = await request.json();

    if (type === 'validity') {
      // Update is_valid status in data_sesi_survei
      const { error } = await supabaseAdmin
        .from('data_sesi_survei')
        .update({ is_valid: body.is_valid })
        .eq('id', id);

      if (error) {
        console.error("PATCH validity error supabase:", error);
        throw error;
      }
    } else {
      // Default: Update Demografis Data (data_responden)
      const { error } = await supabaseAdmin
        .from('data_responden')
        .update({
          jenis_kelamin: body.jenis_kelamin,
          kelompok_usia: body.kelompok_usia,
          pendidikan_terakhir: body.pendidikan_terakhir,
          pekerjaan_utama: body.pekerjaan_utama,
          desa_id: body.id_desa || null
        })
        .eq('id', id);

      if (error) {
        console.error("PATCH demografis error supabase:", error);
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("PATCH error /api/responden/[id]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE Data Survey (data_sesi_survei)
// Since there's an ON DELETE CASCADE set up usually, deleting sesi survei removes answers too.
// If the ID passed is the sesi_survei id, it deletes the session.
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ success: false, error: "ID missing" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('data_sesi_survei')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("DELETE error supabase:", error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE error /api/responden/[id]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
