import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Menggunakan Service Role Key untuk menembus RLS secara aman dari backend
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

export async function POST(request: Request) {
  try {
    // 0. Check Global Settings if survey is active
    const { data: settings } = await supabaseAdmin
      .from('pengaturan_sistem')
      .select('status_survei_aktif')
      .eq('id', 1)
      .single();

    if (settings && !settings.status_survei_aktif) {
      return NextResponse.json({ error: "Mohon maaf, periode pelaporan survei saat ini sedang ditutup." }, { status: 403 });
    }

    const body = await request.json();
    const { demografiData, skorMakro, saranAspirasi, listPertanyaan, jawaban } = body;

    // 1. Simpan Responden
    const payloadResponden = { ...demografiData };
    if (!payloadResponden.nomor_hp) {
        delete payloadResponden.nomor_hp;
    }

    const { data: respondenData, error: errResponden } = await supabaseAdmin
        .from("data_responden")
        .insert([payloadResponden])
        .select("id")
        .single();
        
    if (errResponden) {
        if (errResponden.code === "23505") {
            return NextResponse.json({ error: "Nomor HP sudah pernah digunakan untuk mengisi survei sebelumnya." }, { status: 400 });
        }
        throw errResponden;
    }

    // 2. Simpan Sesi Survei
    const { data: sesiData, error: errSesi } = await supabaseAdmin
        .from("data_sesi_survei")
        .insert([{
            responden_id: respondenData.id,
            jalur_pengisian: "Digital Mandiri",
            skor_makro: skorMakro,
            saran_aspirasi: saranAspirasi || null
        }])
        .select("id")
        .single();
        
    if (errSesi) throw errSesi;

    // 3. Simpan Detail Jawaban
    const detailPayload = listPertanyaan.map((p: any) => ({
        sesi_survei_id: sesiData.id,
        pertanyaan_id: p.id,
        skor_pilihan: jawaban[p.id]?.skor_pilihan,
        cerita_kendala: jawaban[p.id]?.cerita_kendala || null
    }));

    if (detailPayload.length > 0) {
        const { error: errDetail } = await supabaseAdmin
            .from("detail_jawaban")
            .insert(detailPayload);
        if (errDetail) throw errDetail;
    }

    return NextResponse.json({ success: true, sesiId: sesiData.id });
  } catch (error: any) {
    console.error("Submission error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan internal server." }, { status: 500 });
  }
}
