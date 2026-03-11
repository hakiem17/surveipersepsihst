"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Search, Filter, Eye, Edit, Trash2, ShieldAlert, X, Save, BarChart } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

// Types
type MasterDesa = { id: string; nama_desa: string };
type MasterKec = { id: string; nama_kecamatan: string; desa?: MasterDesa[] };

type DetailJawaban = {
  skor_pilihan: number;
  cerita_jawaban?: string;
  pertanyaan?: {
    judul_pertanyaan: string;
    unsur?: { nama_unsur: string } | { nama_unsur: string }[];
  }
}

type RespondenData = {
  id: string; // sesi_survei ID
  id_responden: string; // data_responden ID (we need this to update demographics)
  waktu_mulai: string;
  responden_nama: string;
  responden_nohp: string;
  responden_umur: string;
  responden_jk: string;
  responden_pendidikan: string;
  responden_pekerjaan: string;
  desa_id?: string;
  kecamatan_id?: string;
  desa_nama?: string;
  kecamatan_nama?: string;
  skor_makro: number | null;
  skor_total: number;
  skor_rata: number;
  jawaban: DetailJawaban[];
  is_valid: boolean;
};

export default function DataRespondenPage() {
  const [data, setData] = useState<RespondenData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Master data for editing
  const [kecamatanList, setKecamatanList] = useState<MasterKec[]>([]);
  
  // Modals state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<RespondenData | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    jenis_kelamin: "",
    kelompok_usia: "",
    pendidikan_terakhir: "",
    pekerjaan_utama: "",
    id_desa: ""
  });
  const [editKecamatanFilter, setEditKecamatanFilter] = useState("");

  const pekerjaanOptions = [
    "PNS", "TNI/Polri", "Pegawai Swasta", "Wiraswasta", "Pelajar/Mahasiswa", 
    "Petani/Pekebun", "Nelayan", "Buruh", "Pensiunan", "Mengurus Rumah Tangga", "Lainnya"
  ];
  const kelompokUsiaOptions = [
    "17-25 Tahun", "26-35 Tahun", "36-45 Tahun", "46-55 Tahun", "> 55 Tahun"
  ];
  const pendidikanOptions = [
    "SD/Sederajat", "SMP/Sederajat", "SMA/Sederajat", "D1-D3", "S1/D4", "S2/S3", "Tidak Sekolah"
  ];

  useEffect(() => {
    fetchData();
    fetchWilayah();
  }, []);

  const fetchWilayah = async () => {
    try {
      const { data: kec, error } = await supabase
        .from('master_kecamatan')
        .select(`
          id, 
          nama_kecamatan,
          desa:master_desa(id, nama_desa)
        `)
        .order('nama_kecamatan');

      if (!error && kec) {
        setKecamatanList(kec as MasterKec[]);
      }
    } catch(err) {
       console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/responden");
      const { data: rawData, success, error } = await res.json();

      if (!success) throw new Error(error || "Gagal fetch data");

      const formatted = (rawData || []).map((row: any): RespondenData => {
        const r = Array.isArray(row.responden) ? row.responden[0] : row.responden;
        const desa = r?.desa ? (Array.isArray(r.desa) ? r.desa[0] : r.desa) : null;
        const kecamatan = desa?.kecamatan ? (Array.isArray(desa.kecamatan) ? desa.kecamatan[0] : desa.kecamatan) : null;
        
        const apiDetailJawaban = row.detail_jawaban || [];
        const n = apiDetailJawaban.length;
        const sumSkorTotal = apiDetailJawaban.reduce((acc: number, val: any) => acc + (val.skor_pilihan || 0), 0);
        
        let skorPersen = 0;
        let rataRata = 0;
        if (n > 0) {
          skorPersen = (sumSkorTotal / (5 * n)) * 100;
          rataRata = sumSkorTotal / n;
        }

        const detailJawabanMapped = apiDetailJawaban.map((dj: any) => {
           let judul_pertanyaan = "Sub-pertanyaan khusus";
           let nama_unsur = "";
           
           if (dj.master_pertanyaan) {
              const pert = Array.isArray(dj.master_pertanyaan) ? dj.master_pertanyaan[0] : dj.master_pertanyaan;
              judul_pertanyaan = pert?.teks_pertanyaan || judul_pertanyaan;
              const pUnsur = pert?.master_urusan ? (Array.isArray(pert.master_urusan) ? pert.master_urusan[0] : pert.master_urusan) : null;
              nama_unsur = pUnsur?.nama_urusan || "";
           }

           return {
             skor_pilihan: dj.skor_pilihan,
             cerita_jawaban: dj.cerita_kendala,
             pertanyaan: {
               judul_pertanyaan,
               unsur: { nama_unsur }
             }
           };
        });

        return {
          id: row.id,
          id_responden: r?.id || row.responden_id,
          waktu_mulai: row.waktu_mulai,
          responden_nama: "Anonim",
          responden_nohp: r?.nomor_hp || "-",
          responden_umur: r?.kelompok_usia,
          responden_jk: r?.jenis_kelamin,
          responden_pendidikan: r?.pendidikan_terakhir,
          responden_pekerjaan: r?.pekerjaan_utama,
          desa_id: r?.desa_id,
          kecamatan_id: desa?.kecamatan_id,
          desa_nama: desa?.nama_desa,
          kecamatan_nama: kecamatan?.nama_kecamatan,
          skor_total: skorPersen,
          skor_rata: rataRata,
          is_valid: row.is_valid !== false,
          jawaban: detailJawabanMapped as DetailJawaban[]
        };
      });

      setData(formatted);
    } catch (error) {
      console.error("Error fetching responden data:", error);
      alert("Gagal mengambil data responden.");
    } finally {
      setIsLoading(false);
    }
  };

  const getPredikat = (score: number) => {
    if (score === 0) return "-";
    if (score > 80) return "Sangat Baik";
    if (score > 60) return "Baik";
    if (score > 40) return "Cukup";
    if (score > 20) return "Kurang";
    return "Buruk";
  };

  const openViewModal = (item: RespondenData) => {
    setSelectedData(item);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setSelectedData(null);
    setIsViewModalOpen(false);
  };

  const openEditModal = (item: RespondenData) => {
    setSelectedData(item);
    setEditForm({
      jenis_kelamin: item.responden_jk || "",
      kelompok_usia: item.responden_umur || "",
      pendidikan_terakhir: item.responden_pendidikan || "",
      pekerjaan_utama: item.responden_pekerjaan || "",
      id_desa: item.desa_id || ""
    });
    setEditKecamatanFilter(item.kecamatan_id || "");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedData(null);
    setIsEditModalOpen(false);
  };

  const handleToggleValid = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "MENGANULIR (Invalidate)" : "MENGAKTIFKAN";
    if (!confirm(`Apakah Anda yakin ingin ${actionText} respon survei ini? Data yang dianulir tidak akan dihitung dalam laporan analitik SKM.`)) return;

    try {
      // Kita memanggil endpoint /api/responden/[id] dengan method PATCH tapi untuk tabel data_sesi_survei
      const res = await fetch(`/api/responden/${id}?type=validity`, { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_valid: !currentStatus })
      });
      const { success, error } = await res.json();

      if (!success) throw new Error(error || "Failed to update validity from API");
      
      setData(data.map(item => item.id === id ? { ...item, is_valid: !currentStatus } : item));
    } catch (error) {
      console.error("Error updating validity:", error);
      alert("Gagal mengubah status validitas data. Periksa hak akses.");
    }
  };

  const handleUpdateDemografi = async () => {
    if (!selectedData || !selectedData.id_responden) return;
    
    setIsSaving(true);
    try {
      const res = await fetch(`/api/responden/${selectedData.id_responden}`, { 
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            jenis_kelamin: editForm.jenis_kelamin,
            kelompok_usia: editForm.kelompok_usia,
            pendidikan_terakhir: editForm.pendidikan_terakhir,
            pekerjaan_utama: editForm.pekerjaan_utama,
            id_desa: editForm.id_desa || null
         })
      });

      const { success, error } = await res.json();

      if (!success) throw new Error(error || "Update error API");

      // Segarkan state lokal agar UI terupdate tanpa refresh penuh
      const kec = kecamatanList.find(k => k.id === editKecamatanFilter);
      const desaObj = kec?.desa?.find(d => d.id === editForm.id_desa);
      
      setData(data.map(item => {
        if (item.id === selectedData.id) {
          return {
            ...item,
            responden_jk: editForm.jenis_kelamin,
            responden_umur: editForm.kelompok_usia,
            responden_pendidikan: editForm.pendidikan_terakhir,
            responden_pekerjaan: editForm.pekerjaan_utama,
            desa_id: editForm.id_desa,
            kecamatan_id: editKecamatanFilter,
            desa_nama: desaObj?.nama_desa || item.desa_nama,
            kecamatan_nama: kec?.nama_kecamatan || item.kecamatan_nama
          };
        }
        return item;
      }));

      closeEditModal();
      alert("Data responden berhasil diperbarui!");
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui data demografis.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredData = data.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.responden_nama?.toLowerCase().includes(searchLower) ||
      item.responden_pekerjaan?.toLowerCase().includes(searchLower) ||
      item.desa_nama?.toLowerCase().includes(searchLower) ||
      item.kecamatan_nama?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Data Responden</h1>
          <p className="text-slate-500 dark:text-slate-400">Tinjau seluruh data mentah, detail jawaban, dan koreksi demografi partisipan</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari berdasarkan pekerjaan, desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-shadow"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg">
                Total: {filteredData.length} Data
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-semibold">Waktu Masuk</th>
                  <th className="px-6 py-4 font-semibold">Responden</th>
                  <th className="px-6 py-4 font-semibold">Domisili</th>
                  <th className="px-6 py-4 font-semibold text-center">Indeks SKM</th>
                  <th className="px-6 py-4 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredData.length > 0 ? filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">
                        {format(new Date(item.waktu_mulai), 'dd MMM yyyy', { locale: id })}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {format(new Date(item.waktu_mulai), 'HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {item.responden_nama}
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px] border border-slate-200 dark:border-slate-600">
                             {item.responden_umur || '?'} Thn
                          </span>
                       </div>
                       <div className="text-xs text-slate-500 mt-1 flex flex-col gap-0.5">
                          <span>{item.responden_jk === 'L' || item.responden_jk === 'Laki-laki' ? 'Laki-laki' : 'Perempuan'} • {item.responden_pendidikan || '-'}</span>
                          <span className="line-clamp-1" title={item.responden_pekerjaan}>{item.responden_pekerjaan || '-'}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">{item.desa_nama || "-"}</div>
                        <div className="text-xs text-slate-500">{item.kecamatan_nama || "-"}</div>
                        <div className="mt-1.5">
                           {item.is_valid ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Valid Terhitung</span>
                           ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400">Dianulir (Invalid)</span>
                           )}
                        </div>
                     </td>
                     <td className="px-6 py-4 text-center">
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                         {item.skor_total > 0 ? `${item.skor_total.toFixed(2)}%` : "-"}
                      </div>
                      <div className="text-[11px] font-medium mt-1">
                        <span className={
                          item.skor_total > 80 ? 'text-indigo-600 dark:text-indigo-400' :
                          item.skor_total > 60 ? 'text-blue-600 dark:text-blue-400' :
                          item.skor_total > 40 ? 'text-yellow-600 dark:text-yellow-400' :
                          item.skor_total > 20 ? 'text-orange-600 dark:text-orange-400' :
                          'text-red-600 dark:text-red-400'
                        }>
                          {item.skor_total > 0 ? getPredikat(item.skor_total) : "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openViewModal(item)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
                          title="Lihat Detail Jawaban"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title="Perbarui Data Demografis"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleToggleValid(item.id, item.is_valid)}
                          className={`p-1.5 rounded-lg transition-colors border border-transparent ${item.is_valid ? 'text-rose-600 hover:bg-rose-50 hover:border-rose-200 dark:hover:bg-rose-900/30 dark:hover:border-rose-800' : 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:border-emerald-800'}`}
                          title={item.is_valid ? "Anulir Validitas (Keluarkan dari Quota)" : "Aktifkan Kembali (Masukkan ke Quota)"}
                        >
                          <ShieldAlert size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      {searchTerm ? 'Data yang dicari tidak ditemukan.' : 'Belum ada data responden.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

       {/* View Detail Modal */}
       {isViewModalOpen && selectedData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeViewModal}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-900/50">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Detail Survei Masuk</h3>
                  <div className="flex gap-1.5">
                    <button onClick={() => {closeViewModal(); openEditModal(selectedData);}} className="text-xs flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:text-blue-600 px-2 py-1 rounded-md transition-colors"><Edit size={12}/> Koreksi Demografi</button>
                  </div>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Sesi: <span className="font-mono text-[10px] break-all">{selectedData.id}</span>
                </p>
              </div>
              <div className="text-right flex items-center gap-4">
                 <button onClick={closeViewModal} className="p-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 transition-colors">
                    <X size={20} />
                 </button>
              </div>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-blue-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 pointer-events-none">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Nama / Umur</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{selectedData.responden_nama} <span className="text-slate-500 font-normal">({selectedData.responden_umur || '?'} thn)</span></div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Demografi</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{(selectedData.responden_jk === 'L' || selectedData.responden_jk === 'Laki-laki') ? 'Laki-laki' : 'Perempuan'}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{selectedData.responden_pendidikan || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Pekerjaan Utama</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{selectedData.responden_pekerjaan || '-'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Lokasi Domisili</div>
                    <div className="font-medium text-slate-800 dark:text-slate-200">{selectedData.desa_nama || '-'}</div>
                    <div className="text-sm text-slate-500 mt-0.5">{selectedData.kecamatan_nama || '-'}</div>
                  </div>
               </div>

               {/* Score Recap Card inside view */}
               <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center">
                        <BarChart className="w-6 h-6" />
                     </div>
                     <div>
                        <div className="text-xs text-slate-500 font-medium">Nilai rata-rata dari seluruh rincian jawaban:</div>
                        <div className="text-slate-800 dark:text-slate-200 font-semibold text-sm mt-0.5">Rata: {selectedData.skor_rata.toFixed(2)} dari skala 5</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 leading-none">
                        {selectedData.skor_total > 0 ? `${selectedData.skor_total.toFixed(2)}%` : "-"}
                     </div>
                     <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                        Indeks: {selectedData.skor_total > 0 ? getPredikat(selectedData.skor_total) : "-"}
                     </div>
                  </div>
               </div>

               <div className="p-6">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                     <ShieldAlert size={18} className="text-blue-500" />
                     Rincian Jawaban Kuesioner
                  </h4>
                  
                  {selectedData.jawaban && selectedData.jawaban.length > 0 ? (
                    <div className="space-y-4">
                      {selectedData.jawaban.map((jwb, i) => {
                        const isPertanyaanData = !!jwb?.pertanyaan;
                        const unsurObj = isPertanyaanData ? jwb.pertanyaan?.unsur : null;
                        const unsurName = Array.isArray(unsurObj) ? unsurObj[0]?.nama_unsur : unsurObj?.nama_unsur;
                        
                        return (
                        <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                          <div className="flex items-start gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                              Q{i+1}
                            </div>
                            <div className="flex-1">
                              {isPertanyaanData && unsurName && (
                                <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Unsur: {unsurName}</div>
                              )}
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
                                {isPertanyaanData && jwb.pertanyaan ? jwb.pertanyaan.judul_pertanyaan : "Sub-pertanyaan khusus"}
                              </div>
                              
                              {jwb.cerita_jawaban && (
                                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 border-l-2 border-blue-400 italic">
                                  "{jwb.cerita_jawaban}"
                                </div>
                              )}
                            </div>
                            <div className="flex-shrink-0 text-center">
                              <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Skor Dipilih</div>
                              <div className={`text-xl font-extrabold px-3 py-1 rounded-lg inline-flex
                                ${jwb.skor_pilihan >= 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                  jwb.skor_pilihan === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}
                              `}>
                                {jwb.skor_pilihan}/5
                              </div>
                            </div>
                          </div>
                        </div>
                      )})}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-slate-500">
                      Tidak ada rincian jawaban.
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Demographic Modal */}
      {isEditModalOpen && selectedData && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={closeEditModal}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
            
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Koreksi Data Demografi</h3>
              <button 
                onClick={closeEditModal}
                className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                disabled={isSaving}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
               {/* Read only info about the survey */}
               <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm border border-blue-100 dark:border-blue-900/30 flex gap-2">
                  <ShieldAlert size={18} className="shrink-0 text-blue-500 mt-0.5" />
                  <div>
                    Pembaruan ini tidak akan mengubah SKOR hasil survei yang sudah diinputkan responden. Formulir ini hanya untuk mengkoreksi kemungkinan kesalahan atribut domisili dan demografi.
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Jenis Kelamin</label>
                    <select
                      value={editForm.jenis_kelamin}
                      onChange={e => setEditForm({...editForm, jenis_kelamin: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    >
                      <option value="">Pilih Kelamin</option>
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Kelompok Usia</label>
                    <select
                      value={editForm.kelompok_usia}
                      onChange={e => setEditForm({...editForm, kelompok_usia: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    >
                      <option value="">Pilih Kelompok Usia</option>
                      {kelompokUsiaOptions.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Pendidikan Terakhir</label>
                    <select
                      value={editForm.pendidikan_terakhir}
                      onChange={e => setEditForm({...editForm, pendidikan_terakhir: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    >
                      <option value="">Pilih Pendidikan</option>
                      {pendidikanOptions.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Pekerjaan Utama</label>
                    <select
                      value={editForm.pekerjaan_utama}
                      onChange={e => setEditForm({...editForm, pekerjaan_utama: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    >
                      <option value="">Pilih Pekerjaan</option>
                      {pekerjaanOptions.map(opt => (
                         <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Kecamatan Domisili</label>
                    <select
                      value={editKecamatanFilter}
                      onChange={e => {
                         setEditKecamatanFilter(e.target.value);
                         setEditForm({...editForm, id_desa: ""});
                      }}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all"
                    >
                      <option value="">Pilih Kecamatan (opsional filter)</option>
                      {kecamatanList.map(kec => (
                         <option key={kec.id} value={kec.id}>{kec.nama_kecamatan}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 focus-within:text-blue-600 block">Desa/Kelurahan Tempat Tinggal</label>
                    <select
                      value={editForm.id_desa}
                      onChange={e => setEditForm({...editForm, id_desa: e.target.value})}
                      className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium transition-all disabled:opacity-50"
                      disabled={!editKecamatanFilter}
                    >
                      <option value="">Pilih Desa {editKecamatanFilter ? '' : '(Pilih kecamatan dulu)'}</option>
                      {editKecamatanFilter && kecamatanList.find(k => k.id === editKecamatanFilter)?.desa?.map(d => (
                         <option key={d.id} value={d.id}>{d.nama_desa}</option>
                      ))}
                    </select>
                  </div>
               </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 mt-auto">
              <button 
                onClick={closeEditModal}
                disabled={isSaving}
                className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleUpdateDemografi}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isSaving ? "Menyimpan..." : "Simpan Perbaikan"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
