import Link from "next/link";
import { CheckCircle2, ArrowRightCircle, AlertTriangle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client to bypass RLS for public read
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

async function getSettings() {
  const { data, error } = await supabaseAdmin
    .from('pengaturan_sistem')
    .select('status_survei_aktif, pesan_penutupan')
    .eq('id', 1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error("Error fetching settings for SurveyCTA:", error);
    return { status_survei_aktif: true, pesan_penutupan: "" }; // Fallback
  }
  return data || { status_survei_aktif: true, pesan_penutupan: "" };
}

export async function SurveyCTA() {
  const settings = await getSettings();
  const isSurveiAktif = settings.status_survei_aktif;

  return (
    <section id="statistik" className="py-16 md:py-24 relative z-10 container mx-auto px-4 md:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20">
        {/* Decorative background circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Solid decorative shapes matching the image */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/30 rounded-bl-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/30 rounded-tr-[100px] pointer-events-none" />

        <div className="relative z-10 p-8 md:p-12 lg:p-16 flex flex-col items-center text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Siap Memberikan Penilaian?</h2>
          <p className="text-blue-100 mb-8 md:mb-10 max-w-2xl text-sm md:text-base">
            Pastikan Anda memenuhi kriteria sebagai responden
          </p>

          <div className="w-full max-w-4xl bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8 mb-10 text-left">
            <h3 className="font-semibold text-lg mb-6">Kriteria Responden:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                <span className="text-sm md:text-base text-blue-50">Bukan ASN/TNI/Polri aktif</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                <span className="text-sm md:text-base text-blue-50">Memiliki KTP Kab. HST</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-400 shrink-0" size={20} />
                <span className="text-sm md:text-base text-blue-50">Berusia minimal 17 tahun</span>
              </div>
            </div>
          </div>

          {isSurveiAktif ? (
            <Link
              href="/survei"
              className="inline-flex items-center gap-2 bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-xl font-semibold transition-all shadow-md active:scale-95"
            >
              Mulai Survei
              <ArrowRightCircle size={20} className="text-blue-600" />
            </Link>
          ) : (
            <div className="bg-orange-900/40 border border-orange-500/30 text-orange-100 px-6 py-4 rounded-xl flex items-start gap-4 max-w-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
               <AlertTriangle className="text-orange-400 shrink-0 mt-0.5" size={24} />
               <div className="text-left">
                  <h4 className="font-bold text-orange-300 mb-1">Pemberitahuan</h4>
                  <p className="text-sm">{settings.pesan_penutupan || "Mohon maaf, periode pengisian Survei Persepsi Publik saat ini sedang ditutup."}</p>
               </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
