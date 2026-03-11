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

export async function GET() {
  try {
    const { data: rawData, error } = await supabaseAdmin
      .from("data_sesi_survei")
      .select(`
        id,
        waktu_mulai,
        skor_makro,
        responden_id,
        is_valid,
        responden:data_responden(
          id,
          nomor_hp,
          jenis_kelamin,
          kelompok_usia,
          pendidikan_terakhir,
          pekerjaan_utama,
          desa_id,
          desa:master_desa(
            id,
            nama_desa,
            kecamatan_id,
            kecamatan:master_kecamatan(
              id,
              nama_kecamatan
            )
          )
        ),
        detail_jawaban(
          skor_pilihan,
          cerita_kendala,
          master_pertanyaan:pertanyaan_id(
            teks_pertanyaan,
            master_urusan:urusan_id(nama_urusan)
          )
        )
      `)
      .order('waktu_mulai', { ascending: false });

    if (error) {
       console.error("Error from Supabase:", error);
       throw error;
    }

    return NextResponse.json({ success: true, data: rawData });
  } catch (error: any) {
    console.error("Error in GET /api/responden:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
