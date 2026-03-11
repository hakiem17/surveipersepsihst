"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, ToggleLeft, ToggleRight, Settings } from "lucide-react";

export default function PengaturanPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    status_survei_aktif: true,
    tahun_berjalan: new Date().getFullYear(),
    pesan_penutupan: ""
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/pengaturan");
      const { success, data } = await res.json();
      if (success && data) {
        setFormData({
          status_survei_aktif: data.status_survei_aktif,
          tahun_berjalan: data.tahun_berjalan,
          pesan_penutupan: data.pesan_penutupan || ""
        });
      }
    } catch (error) {
      console.error("Gagal memuat pengaturan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/pengaturan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const { success, error } = await res.json();
      if (!success) throw new Error(error);
      alert("Pengaturan sistem berhasil disimpan!");
    } catch (error) {
      console.error("Gagal menyimpan pengaturan:", error);
      alert("Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
           <Settings className="text-blue-600" />
           Pengaturan Sistem
        </h1>
        <p className="text-slate-500 dark:text-slate-400">Kelola konfigurasi global aplikasi survei publik.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 md:p-8 space-y-8">
           
           {/* Section 1: Saklar Survei */}
           <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Status Operasional Survei</h3>
              
              <div className="flex items-start md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                 <div>
                    <div className="font-medium text-slate-900 dark:text-white">Buka/Tutup Akses Kuesioner</div>
                    <p className="text-sm text-slate-500 mt-1">Jika dimatikan, masyarakat tidak dapat mengisi formulir survei baru.</p>
                 </div>
                 <button 
                    type="button" 
                    onClick={() => setFormData({...formData, status_survei_aktif: !formData.status_survei_aktif})}
                    className="flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full"
                 >
                    {formData.status_survei_aktif ? (
                       <ToggleRight size={44} className="text-emerald-500 transition-colors" />
                    ) : (
                       <ToggleLeft size={44} className="text-slate-400 dark:text-slate-600 transition-colors" />
                    )}
                 </button>
              </div>

              {!formData.status_survei_aktif && (
                 <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                       Pesan Penutupan Layanan Survei
                    </label>
                    <textarea 
                       value={formData.pesan_penutupan}
                       onChange={(e) => setFormData({...formData, pesan_penutupan: e.target.value})}
                       rows={3}
                       placeholder="Contoh: Survei Persepsi Publik saat ini sedang dalam masa rekapitulasi akhir tahun..."
                       className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
                    />
                    <p className="text-xs text-orange-500 mt-2 flex items-center gap-1">Pesan ini akan ditampilkan di halaman depan publik saat survei dinonaktifkan.</p>
                 </div>
              )}
           </div>

           {/* Section 2: Preferensi Waktu */}
           <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2">Periode Data</h3>
              
              <div>
                 <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tahun Berjalan Survei
                 </label>
                 <input 
                    type="number" 
                    min={2020}
                    max={2099}
                    value={formData.tahun_berjalan}
                    onChange={(e) => setFormData({...formData, tahun_berjalan: parseInt(e.target.value) || new Date().getFullYear()})}
                    className="w-full md:w-64 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
                 />
                 <p className="text-xs text-slate-500 mt-2">Dugunakan sebagai tanda periode pengumpulan data untuk laporan analitik SKM saat ini.</p>
              </div>
           </div>

        </div>
        
        <div className="p-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
           <button 
             type="submit" 
             disabled={isSaving}
             className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white rounded-xl shadow-sm transition-colors font-medium"
           >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span>{isSaving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
           </button>
        </div>
      </form>
    </div>
  );
}
