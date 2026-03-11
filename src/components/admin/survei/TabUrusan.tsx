"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, Loader2 } from "lucide-react";

interface Urusan {
  id: string;
  klasifikasi: string;
  nama_urusan: string;
}

export default function TabUrusan() {
  const [data, setData] = useState<Urusan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Urusan | null>(null);
  const [formData, setFormData] = useState({ klasifikasi: "", nama_urusan: "" });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    let query = supabase.from("master_urusan").select("*").order("klasifikasi", { ascending: true }).order("nama_urusan", { ascending: true });
    
    if (search) {
      query = query.ilike("nama_urusan", `%${search}%`);
    }

    const { data: result, error } = await query;
    if (!error && result) {
      setData(result);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleOpenModal = (item?: Urusan) => {
    if (item) {
      setEditingItem(item);
      setFormData({ klasifikasi: item.klasifikasi, nama_urusan: item.nama_urusan });
    } else {
      setEditingItem(null);
      setFormData({ klasifikasi: "Wajib Pelayanan Dasar", nama_urusan: "" });
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
    
    try {
      if (editingItem) {
        // Update
        const { error } = await supabase
          .from("master_urusan")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("master_urusan")
          .insert([formData]);
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

  const handleDelete = async (id: string, nama: string) => {
    if (confirm(`Apakah Anda yakin ingin menghapus urusan ${nama}? Pertanyaan terkait mungkin kehilangan referensi.`)) {
      setLoading(true);
      const { error } = await supabase.from("master_urusan").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus: " + error.message);
      } else {
        fetchData();
      }
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari urusan pemerintahan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
          />
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus size={18} />
          <span>Tambah Urusan</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase font-semibold text-xs">
                <tr>
                  <th className="px-6 py-4">Nomendklatur / Nama Urusan</th>
                  <th className="px-6 py-4">Status Klasifikasi</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {data.length > 0 ? (
                  data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {item.nama_urusan}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.klasifikasi}
                        </span>
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
                            onClick={() => handleDelete(item.id, item.nama_urusan)}
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
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      Tidak ada data urusan ditemukan.
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? "Edit Urusan Pemerintahan" : "Tambah Urusan Pemerintahan"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Klasifikasi Urusan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.klasifikasi}
                  onChange={(e) => setFormData({ ...formData, klasifikasi: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white"
                >
                  <option value="Wajib Pelayanan Dasar">Wajib Pelayanan Dasar</option>
                  <option value="Wajib Non Pelayanan Dasar">Wajib Non Pelayanan Dasar</option>
                  <option value="Pilihan">Pilihan</option>
                  <option value="Penunjang">Fungsi Penunjang</option>
                  <option value="Pendukung">Pendukung</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Urusan Khusus <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_urusan}
                  onChange={(e) => setFormData({ ...formData, nama_urusan: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="Misal: Pendidikan / Kesehatan"
                />
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
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
