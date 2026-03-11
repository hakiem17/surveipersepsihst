"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Download, Search, FileText, Loader2, Filter } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function LaporanPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [surveiData, setSurveiData] = useState<any[]>([]);
  const [quotaData, setQuotaData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all survey completions
      const { data, error } = await supabase
        .from("data_sesi_survei")
        .select(`
          id,
          waktu_mulai,
          skor_makro,
          is_valid,
          responden:data_responden(
            nomor_hp,
            jenis_kelamin,
            kelompok_usia,
            pendidikan_terakhir,
            pekerjaan_utama,
            kecamatan_id,
            desa:master_desa(
              nama_desa,
              kecamatan:master_kecamatan(id, nama_kecamatan, target_sampel)
            )
          ),
          detail_jawaban(
            skor_pilihan
          )
        `)
        .order('waktu_mulai', { ascending: false });

      if (error) throw error;
      
      const { data: kecamatanData, error: errorKec } = await supabase
        .from("master_kecamatan")
        .select("id, nama_kecamatan, target_sampel");
        
      if (errorKec) throw errorKec;

      // Transform incoming relations safely into flat objects for UI
      const formattedData = (data || []).map((row: any) => {
        const r = Array.isArray(row.responden) ? row.responden[0] : row.responden;
        const desa = r?.desa ? (Array.isArray(r.desa) ? r.desa[0] : r.desa) : null;
        const kecamatan = desa?.kecamatan ? (Array.isArray(desa.kecamatan) ? desa.kecamatan[0] : desa.kecamatan) : null;

        const detailJawaban = row.detail_jawaban || [];
        const n = detailJawaban.length;
        const sumSkorTotal = detailJawaban.reduce((acc: number, val: any) => acc + (val.skor_pilihan || 0), 0);
        let skorPersen = 0;
        let skorRataRata = 0;
        if (n > 0) {
          skorPersen = (sumSkorTotal / (5 * n)) * 100;
          skorRataRata = sumSkorTotal / n;
        }

        return {
          id: row.id,
          created_at: row.waktu_mulai,
          responden_nama: "Anonim", // Disembunyikan karena PII atau tidak disave
          responden_umur: r?.kelompok_usia,
          responden_jk: r?.jenis_kelamin,
          responden_pendidikan: r?.pendidikan_terakhir,
          responden_pekerjaan: r?.pekerjaan_utama,
          skor_makro: row.skor_makro,
          skor_rata_rata: skorRataRata > 0 ? Number(skorRataRata.toFixed(2)) : null,
          skor_total: skorPersen > 0 ? Number(skorPersen.toFixed(2)) : null,
          desa_nama: desa?.nama_desa,
          kecamatan_nama: kecamatan?.nama_kecamatan,
          kecamatan_id: r?.kecamatan_id,
          is_valid: row.is_valid !== false // Default true if null
        };
      });

      setSurveiData(formattedData);
      
      // Process Quota
      const qData = (kecamatanData || []).map(kec => {
         const actualValid = formattedData.filter(d => d.kecamatan_id === kec.id && d.is_valid).length;
         return {
            id: kec.id,
            nama_kecamatan: kec.nama_kecamatan,
            target_sampel: kec.target_sampel || 0,
            actual: actualValid,
            persentase: kec.target_sampel > 0 ? Math.min(100, Math.round((actualValid / kec.target_sampel) * 100)) : 0,
            lebih: actualValid > kec.target_sampel,
            sisa: Math.max(0, (kec.target_sampel || 0) - actualValid),
         };
      }).sort((a,b) => b.persentase - a.persentase);
      
      setQuotaData(qData);
    } catch (error: any) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Proses data untuk grafik Demografi (Jenis Kelamin)
  const processGenderData = () => {
    const counts = surveiData.reduce((acc, curr) => {
      let jk = curr.responden_jk || "Tidak Diketahui";
      if (jk === "Laki-laki") jk = "L";
      if (jk === "Perempuan") jk = "P";
      acc[jk] = (acc[jk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.keys(counts).map(key => ({
      name: key === "L" ? "Laki-laki" : key === "P" ? "Perempuan" : key,
      value: counts[key]
    }));
  };

  // Proses data untuk grafik Skor Makro (hanya yang valid)
  const processMakroScoreData = () => {
    const validData = surveiData.filter(d => d.is_valid);
    const counts = validData.reduce((acc, curr) => {
      if (curr.skor_makro) {
        acc[curr.skor_makro] = (acc[curr.skor_makro] || 0) + 1;
      }
      return acc;
    }, {} as Record<number, number>);

    const scoreLabels: Record<number, string> = {
      1: "Sangat Buruk",
      2: "Buruk",
      3: "Cukup",
      4: "Baik",
      5: "Sangat Baik"
    };

    return [1, 2, 3, 4, 5].map(score => ({
      name: scoreLabels[score],
      jumlah: counts[score] || 0
    }));
  };

  const genderData = processGenderData();
  const makroData = processMakroScoreData();
  const COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1'];

  const getPredikat = (score: number | null) => {
    if (score === null) return "-";
    if (score > 80) return "Sangat Baik";
    if (score > 60) return "Baik";
    if (score > 40) return "Cukup";
    if (score > 20) return "Kurang";
    return "Buruk";
  };

  // Fungsi Export CSV
  const handleExportCSV = () => {
    if (surveiData.length === 0) return;

    const headers = ["Tanggal", "Nama Responden", "Umur", "JK", "Pendidikan", "Pekerjaan", "Kecamatan", "Desa", "Rata-rata", "Skor Total", "Predikat"];

    const csvRows = surveiData.map(row => {
      return [
        format(new Date(row.created_at), "dd/MM/yyyy HH:mm"),
        `"${row.responden_nama || '-'}"`,
        row.responden_umur || '-',
        row.responden_jk === 'L' ? 'Laki-laki' : 'Perempuan',
        `"${row.responden_pendidikan || '-'}"`,
        `"${row.responden_pekerjaan || '-'}"`,
        `"${row.kecamatan_nama || '-'}"`,
        `"${row.desa_nama || '-'}"`,
        row.skor_rata_rata || '-',
        row.skor_total || '-',
        `"${getPredikat(row.skor_total)}"`
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Survei_${format(new Date(), 'dd-MM-yyyy')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate Global Score (Hanya hitung rata-rata SKM dari data yang IS_VALID)
  const validScores = surveiData.filter(d => d.skor_total !== null && d.is_valid);
  const globalAverageScore = validScores.length > 0 
    ? validScores.reduce((acc, curr) => acc + curr.skor_total, 0) / validScores.length 
    : 0;

  const getGlobalPredikatColor = (score: number) => {
    if (score === 0) return "text-slate-400";
    if (score > 80) return "text-indigo-600 dark:text-indigo-400";
    if (score > 60) return "text-blue-600 dark:text-blue-400";
    if (score > 40) return "text-yellow-600 dark:text-yellow-400";
    if (score > 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Laporan & Analitik</h1>
          <p className="text-slate-500 dark:text-slate-400">Analisis metrik survei persepsi layanan pemda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm transition-colors">
            <Download size={18} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Global Score Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-900 dark:to-indigo-900 rounded-3xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-blue-100 font-medium text-lg md:text-xl mb-1">Indeks Kepuasan Masyarakat (IKM)</h2>
            <p className="text-blue-200/80 text-sm">Nilai rata-rata dari seluruh {validScores.length} responden yang masuk</p>
          </div>
          
          <div className="flex items-center gap-6 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="text-center">
              <div className="text-4xl md:text-6xl font-extrabold tracking-tight">
                {globalAverageScore > 0 ? globalAverageScore.toFixed(2) : "-"}
              </div>
              <div className="text-blue-200 text-sm mt-1 font-medium tracking-wide">SKOR TOTAL</div>
            </div>
            
            <div className="w-px h-16 bg-white/20"></div>
            
            <div className="text-center min-w-[120px]">
              <div className={`text-xl md:text-2xl font-bold ${globalAverageScore > 0 ? 'text-white' : 'text-blue-200/50'}`}>
                {globalAverageScore > 0 ? getPredikat(globalAverageScore) : "Belum Ada"}
              </div>
              <div className="text-blue-200 text-sm mt-1 font-medium tracking-wide">KATEGORI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Demografi: Jenis Kelamin</h3>
          <div className="h-64 flex items-center justify-center">
            {genderData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400">Belum ada data</span>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Penyebaran Skor Makro</h3>
          <div className="h-64 flex items-center justify-center">
            {makroData.some(d => d.jumlah > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={makroData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="jumlah" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                    {makroData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <span className="text-slate-400">Belum ada data</span>
            )}
          </div>
        </div>
        
        {/* Quota vs Actual Table */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm md:col-span-2">
           <h3 className="text-lg font-semibold mb-1 text-slate-800 dark:text-white">Capaian Target Responden</h3>
           <p className="text-sm text-slate-500 mb-4">Pantau jumlah survei masuk yang <span className="font-semibold text-emerald-600 dark:text-emerald-400">Valid</span> dibandingkan dengan target/kuota per-Kecamatan.</p>
           
           <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                 <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                       <th className="py-3 px-4 rounded-tl-lg">Kecamatan</th>
                       <th className="py-3 px-4 text-center">Data Valid Masuk</th>
                       <th className="py-3 px-4 text-center">Target Quota</th>
                       <th className="py-3 px-4 text-center">Kekurangan</th>
                       <th className="py-3 px-4 min-w-[200px] rounded-tr-lg">Progress</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {quotaData.length > 0 ? quotaData.map((q) => (
                       <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">{q.nama_kecamatan}</td>
                          <td className="py-3 px-4 text-center">
                             <span className={`font-bold ${q.lebih ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}`}>
                                {q.actual}
                             </span>
                             {q.lebih && (
                                <span className="ml-1 text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full" title="Melebihi Target">Over</span>
                             )}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">{q.target_sampel}</td>
                          <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">
                             {q.sisa > 0 ? <span className="text-red-500">{q.sisa} lagi</span> : <span className="text-emerald-500 font-medium">Tercapai ✓</span>}
                          </td>
                          <td className="py-3 px-4">
                             <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                   <div 
                                      className={`h-full rounded-full transition-all duration-1000 ${q.persentase >= 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                                      style={{ width: `${q.persentase}%` }}
                                   />
                                </div>
                                <span className="text-xs font-semibold w-10 text-right text-slate-600 dark:text-slate-300">{q.persentase}%</span>
                             </div>
                          </td>
                       </tr>
                    )) : (
                       <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-500">Memuat Data Target...</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden:">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Rekapitulasi Data Responden</h3>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Total: {surveiData.length} Data</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 uppercase">
              <tr>
                <th className="px-6 py-4 font-medium">Tanggal</th>
                <th className="px-6 py-4 font-medium">Nama / Umur</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium">Demografi</th>
                <th className="px-6 py-4 font-medium">Kecamatan</th>
                <th className="px-6 py-4 font-medium text-center">Desa</th>
                <th className="px-6 py-4 font-medium text-center">Indeks SKM</th>
                <th className="px-6 py-4 font-medium text-center">Predikat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {surveiData.length > 0 ? surveiData.map((survei) => (
                <tr key={survei.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {format(new Date(survei.created_at), 'dd MMM yyyy', { locale: id })}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(survei.created_at), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white">
                      {survei.responden_nama || "Anonim"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {survei.responden_umur ? `${survei.responden_umur} Tahun` : "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     {survei.is_valid ? (
                        <div className="inline-flex items-center justify-center px-2 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold uppercase rounded border border-emerald-200 dark:border-emerald-800">Valid</div>
                     ) : (
                        <div className="inline-flex items-center justify-center px-2 py-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-bold uppercase rounded border border-slate-200 dark:border-slate-700">Dicabut</div>
                     )}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    <div>{survei.responden_jk === 'L' || survei.responden_jk === 'Laki-laki' ? 'Laki-laki' : survei.responden_jk === 'P' || survei.responden_jk === 'Perempuan' ? 'Perempuan' : '-'}</div>
                    <div className="text-xs text-slate-500 line-clamp-1" title={survei.responden_pekerjaan || ""}>
                      {survei.responden_pekerjaan || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {survei.kecamatan_nama || "-"}
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 dark:text-slate-300">
                    {survei.desa_nama || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-bold text-slate-700 dark:text-slate-200">
                      {survei.skor_total !== null ? `${survei.skor_total}%` : "-"}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Avg: {survei.skor_rata_rata || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {survei.skor_total !== null && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold
                        ${survei.skor_total > 80 ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                          survei.skor_total > 60 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          survei.skor_total > 40 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          survei.skor_total > 20 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {getPredikat(survei.skor_total)}
                      </span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    Belum ada data respons survei.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
