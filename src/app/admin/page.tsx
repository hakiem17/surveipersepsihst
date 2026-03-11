"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Users, FileText, ClipboardList, Star, Loader2, ArrowUpRight, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface RecentSurvei {
  id: string;
  skor_makro: number;
  saran_aspirasi: string | null;
  waktu_mulai: string;
  data_responden: {
    pekerjaan_utama: string;
    kelompok_usia: string;
    jenis_kelamin: string;
    master_kecamatan: {
      nama_kecamatan: string;
    };
  };
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [recentLoading, setRecentLoading] = useState(true);
  const [recentSurvei, setRecentSurvei] = useState<RecentSurvei[]>([]);
  const [stats, setStats] = useState({
    totalResponden: 0,
    totalSurvei: 0,
    pertanyaanAktif: 0,
    rataKepuasan: 0,
  });

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { count: countResponden } = await supabase
        .from("data_responden")
        .select("*", { count: "exact", head: true });

      const { data: sesiData, count: countSurvei } = await supabase
        .from("data_sesi_survei")
        .select("skor_makro", { count: "exact" })
        .eq("is_valid", true);
      
      let avgScore = 0;
      if (sesiData && sesiData.length > 0) {
        const totalScore = sesiData.reduce((acc, curr) => acc + (curr.skor_makro || 0), 0);
        avgScore = totalScore / sesiData.length;
      }

      const { count: countPertanyaan } = await supabase
        .from("master_pertanyaan")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      setStats({
        totalResponden: countResponden || 0,
        totalSurvei: countSurvei || 0,
        pertanyaanAktif: countPertanyaan || 0,
        rataKepuasan: Number(avgScore.toFixed(2)),
      });
    } catch (error) {
      console.error("Gagal memuat statistik:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSurvei = async () => {
    setRecentLoading(true);
    try {
      const { data, error } = await supabase
        .from("data_sesi_survei")
        .select(`
          id, 
          skor_makro, 
          saran_aspirasi, 
          waktu_mulai,
          data_responden (
            pekerjaan_utama,
            kelompok_usia,
            jenis_kelamin,
            master_kecamatan (
              nama_kecamatan
            )
          )
        `)
        .eq("is_valid", true)
        .order("waktu_mulai", { ascending: false })
        .limit(5);

      if (error) throw error;
      if (data) setRecentSurvei(data as any);
    } catch (error) {
      console.error("Gagal memuat survei terbaru:", error);
    } finally {
      setRecentLoading(false);
    }
  };

  const loadAllData = () => {
    fetchStats();
    fetchRecentSurvei();
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">
            Ikhtisar Sistem
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Selamat datang di panel administrasi Survei Persepsi Publik Kabupaten HST.
          </p>
        </div>
        <button
          onClick={loadAllData}
          disabled={loading || recentLoading}
          className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 shadow-sm"
        >
          {(loading || recentLoading) ? <Loader2 size={16} className="animate-spin" /> : "Segarkan Data"}
        </button>
      </div>

      {/* Analytics Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6">
        
        {/* Widget 1 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
              <Users size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Total Responden</h3>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-800 h-8 w-16 rounded block mt-1"></span> : stats.totalResponden}
          </div>
        </div>

        {/* Widget 2 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <FileText size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Survei Terkirim</h3>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">
            {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-800 h-8 w-16 rounded block mt-1"></span> : stats.totalSurvei}
          </div>
        </div>

        {/* Widget 3 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
              <Star size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Rata-rata Kepuasan (Makro)</h3>
          <div className="text-3xl font-bold text-slate-800 dark:text-white flex items-end gap-2">
            {loading ? (
              <span className="animate-pulse bg-slate-200 dark:bg-slate-800 h-8 w-16 rounded block mt-1"></span>
            ) : (
              <>
                {stats.rataKepuasan} <span className="text-sm font-normal text-slate-400 mb-1">/ 5.0</span>
              </>
            )}
          </div>
        </div>

        {/* Widget 4 */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
              <ClipboardList size={24} />
            </div>
          </div>
          <h3 className="text-slate-500 dark:text-slate-400 font-medium text-sm mb-1">Pertanyaan Aktif</h3>
          <div className="text-3xl font-bold text-slate-800 dark:text-white">
             {loading ? <span className="animate-pulse bg-slate-200 dark:bg-slate-800 h-8 w-16 rounded block mt-1"></span> : stats.pertanyaanAktif}
          </div>
        </div>

      </div>

      {/* Main Content Area: Banner & Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Survei Masuk Terbaru</h2>
            <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full font-medium">
              5 Data Terakhir
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-4">Waktu</th>
                  <th className="px-6 py-4">Profil Responden</th>
                  <th className="px-6 py-4">Skor Umum</th>
                  <th className="px-6 py-4">Saran/Aspirasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 relative">
                {recentLoading && (
                  <tr className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex justify-center items-center z-10 backdrop-blur-sm w-full">
                    <td colSpan={4} className="flex justify-center items-center border-none">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </td>
                  </tr>
                )}
                {!recentLoading && recentSurvei.length > 0 ? (
                  recentSurvei.map((survei) => (
                    <tr key={survei.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="font-medium">
                            {formatDistanceToNow(new Date(survei.waktu_mulai), { addSuffix: true, locale: id })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {survei.data_responden.pekerjaan_utama || "Warga"} ({survei.data_responden.kelompok_usia})
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {survei.data_responden.jenis_kelamin} • Kec. {survei.data_responden.master_kecamatan?.nama_kecamatan}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star 
                              key={i} 
                              size={14} 
                              className={i < (survei.skor_makro || 0) ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-700"} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[200px]">
                        {survei.saran_aspirasi ? (
                          <div className="flex gap-2 items-start">
                            <MessageSquare size={14} className="text-blue-500 shrink-0 mt-0.5" />
                            <p className="truncate text-xs text-slate-700 dark:text-slate-300" title={survei.saran_aspirasi}>
                              {survei.saran_aspirasi}
                            </p>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">- Tidak ada kolom saran -</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : !recentLoading && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                          <FileText size={24} className="text-slate-400" />
                        </div>
                        <p>Belum ada data survei yang diselesaikan.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Banner Sidebar */}
        <div className="lg:col-span-1 rounded-3xl bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden flex flex-col justify-between p-8 min-h-[300px]">
          <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none w-64 h-64 border-40 border-white rounded-full -mr-20 -mt-20"></div>
          <div className="absolute bottom-0 left-0 p-12 opacity-10 pointer-events-none w-48 h-48 bg-white rounded-full -ml-16 -mb-16"></div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-3">Panduan Singkat Admin</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Di halaman ini Anda bisa memantau pergerakan data survei secara riil. 
              <br/><br/>
              Gunakan menu di sidebar kiri untuk mengelola master data (Kecamatan, Desa, Kategori Urusan, Pertanyaan Survei).
            </p>
          </div>
          
          <div className="relative z-10 space-y-3">
             <Link 
               href="/admin/master-survei"
               className="flex items-center justify-between bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 rounded-xl font-bold transition-all shadow-sm w-full"
             >
               Bank Pertanyaan
               <ArrowUpRight size={18} />
             </Link>
             <Link 
               href="/survei"
               target="_blank"
               className="flex items-center justify-between bg-indigo-800 text-white hover:bg-indigo-900 px-5 py-3 rounded-xl font-bold transition-all shadow-sm w-full border border-indigo-600"
             >
               Lihat Form Publik
               <ArrowUpRight size={18} />
             </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}
