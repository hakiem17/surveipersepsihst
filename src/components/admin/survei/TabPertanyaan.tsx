"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, Loader2, Power, PowerOff } from "lucide-react";

interface Urusan {
  id: string;
  nama_urusan: string;
}

interface Pertanyaan {
  id: string;
  urusan_id: string | null;
  teks_pertanyaan: string;
  urutan: number;
  is_active: boolean;
  master_urusan?: {
    nama_urusan: string;
  } | null;
}

export default function TabPertanyaan() {
  const [data, setData] = useState<Pertanyaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [urusans, setUrusans] = useState<Urusan[]>([]);
  const [filterUrusan, setFilterUrusan] = useState("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pertanyaan | null>(null);
  const [formData, setFormData] = useState({ 
    urusan_id: "", 
    teks_pertanyaan: "",
    urutan: 0,
    is_active: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchUrusans = async () => {
    const { data } = await supabase.from("master_urusan").select("id, nama_urusan").order("nama_urusan");
    setUrusans(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    let query = supabase
      .from("master_pertanyaan")
      .select("*, master_urusan(nama_urusan)")
      .order("urutan", { ascending: true });
    
    if (search) {
      query = query.ilike("teks_pertanyaan", `%${search}%`);
    }

    if (filterUrusan !== "all") {
        if (filterUrusan === "none") {
            query = query.is("urusan_id", null);
        } else {
            query = query.eq("urusan_id", filterUrusan);
        }
    }

    const { data: result, error } = await query;
    if (!error && result) {
      setData(result as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUrusans();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, filterUrusan]);

  const handleOpenModal = (item?: Pertanyaan) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        urusan_id: item.urusan_id || "none", 
        teks_pertanyaan: item.teks_pertanyaan,
        urutan: item.urutan,
        is_active: item.is_active
      });
    } else {
      setEditingItem(null);
      // Auto-increment urutan based on existing max
      const maxUrutan = data.length > 0 ? Math.max(...data.map(d => d.urutan)) : 0;
      setFormData({ 
        urusan_id: filterUrusan !== "all" ? filterUrusan : "none", 
        teks_pertanyaan: "",
        urutan: maxUrutan + 1,
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const payloadToSave = {
      ...formData,
      urusan_id: formData.urusan_id === "none" ? null : formData.urusan_id
    };

    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from("master_pertanyaan")
          .update(payloadToSave)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("master_pertanyaan")
          .insert([payloadToSave]);
        if (error) throw error;
      }
      
      closeModal();
      fetchData();
    } catch (error: any) {
      alert("Gagal menyimpan data: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus pertanyaan ini?`)) {
      setLoading(true);
      const { error } = await supabase.from("master_pertanyaan").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus: " + error.message);
      } else {
        fetchData();
      }
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("master_pertanyaan")
      .update({ is_active: !currentStatus })
      .eq("id", id);
    
    if (!error) {
      fetchData();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between gap-4">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Cari pertanyaan survei..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
          
          <div className="relative w-full sm:w-64">
             <select
               value={filterUrusan}
               onChange={(e) => setFilterUrusan(e.target.value)}
               className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white"
             >
               <option value="all">Semua Urusan (Umum)</option>
               <option value="none">- Pertanyaan General (Tanpa Urusan) -</option>
               {urusans.map(u => (
                 <option key={u.id} value={u.id}>{u.nama_urusan}</option>
               ))}
             </select>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap lg:w-auto"
        >
          <Plus size={18} />
          <span>Tambah Pertanyaan</span>
        </button>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4 w-12 text-center">No</th>
                  <th className="px-6 py-4">Teks Pertanyaan Survei (Skala 1-5)</th>
                  <th className="px-6 py-4">Konteks Urusan</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 relative">
                 {loading && (
                  <tr className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10 backdrop-blur-sm">
                     <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </tr>
                )}
                {data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-center text-slate-900 dark:text-white">
                         {item.urutan}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white max-w-md">
                        {item.teks_pertanyaan}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.master_urusan ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                          {item.master_urusan?.nama_urusan || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <button
                           onClick={() => toggleActive(item.id, item.is_active)}
                           className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              item.is_active 
                               ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50' 
                               : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                           }`}
                           title="Klik untuk Mengubah Status"
                         >
                            {item.is_active ? <Power size={12} /> : <PowerOff size={12} />}
                            {item.is_active ? 'Aktif' : 'Nonaktif'}
                         </button>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data pertanyaan survei ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm shadow-2xl">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? "Edit Pertanyaan Survei" : "Tambah Pertanyaan Survei"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div className="grid grid-cols-4 gap-4">
                 <div className="col-span-1">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                     No Urut <span className="text-red-500">*</span>
                   </label>
                   <input
                     type="number"
                     required
                     min="1"
                     value={formData.urutan}
                     onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value) || 0 })}
                     className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white text-center"
                   />
                 </div>

                 <div className="col-span-3">
                   <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                     Konteks Urusan (Opsional)
                   </label>
                   <select
                     value={formData.urusan_id}
                     onChange={(e) => setFormData({ ...formData, urusan_id: e.target.value })}
                     className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white"
                   >
                     <option value="none">-- Pertanyaan General (Tanpa Urusan) --</option>
                     {urusans.map(u => (
                       <option key={u.id} value={u.id}>{u.nama_urusan}</option>
                     ))}
                   </select>
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Teks Pertanyaan (Diperuntukkan untuk Skala 1-5 Likert) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.teks_pertanyaan}
                  onChange={(e) => setFormData({ ...formData, teks_pertanyaan: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white resize-none"
                  placeholder="Misal: Seberapa mudah prosedur pelayanan yang Anda terima di instansi ini?"
                />
              </div>

              <div className="flex items-center gap-3 mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <input 
                    type="checkbox" 
                    id="is_active" 
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                     Aktifkan Pertanyaan Ini
                  </label>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  Simpan Pertanyaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
