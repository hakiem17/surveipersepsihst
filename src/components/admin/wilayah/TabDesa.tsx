"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { Edit2, Trash2, Plus, Search, Loader2 } from "lucide-react";

interface Kecamatan {
  id: string;
  nama_kecamatan: string;
}

interface Desa {
  id: string;
  nama_desa: string;
  kecamatan_id: string;
  master_kecamatan: {
    nama_kecamatan: string;
  };
}

export default function TabDesa() {
  const [data, setData] = useState<Desa[]>([]);
  const [kecamatans, setKecamatans] = useState<Kecamatan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterKecamatan, setFilterKecamatan] = useState<string>("all");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Desa | null>(null);
  const [formData, setFormData] = useState({ nama_desa: "", kecamatan_id: "" });
  const [isSaving, setIsSaving] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;
  const [totalItems, setTotalItems] = useState(0);

  const fetchKecamatan = async () => {
    const { data } = await supabase.from("master_kecamatan").select("id, nama_kecamatan").order("nama_kecamatan");
    setKecamatans(data || []);
  };

  const fetchData = async () => {
    setLoading(true);
    
    // First get total count
    let countQuery = supabase.from("master_desa").select("*", { count: 'exact', head: true });
    if (search) countQuery = countQuery.ilike("nama_desa", `%${search}%`);
    if (filterKecamatan !== "all") countQuery = countQuery.eq("kecamatan_id", filterKecamatan);
    
    const { count } = await countQuery;
    setTotalItems(count || 0);

    // Then get paginated data
    let query = supabase
      .from("master_desa")
      .select("*, master_kecamatan(nama_kecamatan)")
      .order("nama_desa", { ascending: true });
    
    if (search) {
      query = query.ilike("nama_desa", `%${search}%`);
    }
    
    if (filterKecamatan !== "all") {
      query = query.eq("kecamatan_id", filterKecamatan);
    }

    // Apply pagination
    const from = (page - 1) * itemsPerPage;
    const to = from + itemsPerPage - 1;
    query = query.range(from, to);

    const { data: result, error } = await query;
    if (!error && result) {
      setData(result as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKecamatan();
  }, []);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPage(1);
  }, [search, filterKecamatan]);

  useEffect(() => {
    fetchData();
  }, [search, filterKecamatan, page]);

  const handleOpenModal = (item?: Desa) => {
    if (item) {
      setEditingItem(item);
      setFormData({ nama_desa: item.nama_desa, kecamatan_id: item.kecamatan_id });
    } else {
      setEditingItem(null);
      setFormData({ nama_desa: "", kecamatan_id: kecamatans.length > 0 ? kecamatans[0].id : "" });
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
          .from("master_desa")
          .update(formData)
          .eq("id", editingItem.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from("master_desa")
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
    if (confirm(`Apakah Anda yakin ingin menghapus desa/kelurahan ${nama}?`)) {
      setLoading(true);
      const { error } = await supabase.from("master_desa").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus: " + error.message);
      } else {
        fetchData();
      }
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

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
              placeholder="Cari desa/kelurahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
          </div>
          
          <div className="relative w-full sm:w-64">
             <select
               value={filterKecamatan}
               onChange={(e) => setFilterKecamatan(e.target.value)}
               className="w-full pl-4 pr-10 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white"
             >
               <option value="all">Semua Kecamatan</option>
               {kecamatans.map(kec => (
                 <option key={kec.id} value={kec.id}>{kec.nama_kecamatan}</option>
               ))}
             </select>
          </div>
        </div>
        
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap lg:w-auto"
        >
          <Plus size={18} />
          <span>Tambah Desa</span>
        </button>
      </div>

      {loading && data.length === 0 ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 uppercase font-semibold text-xs relative">
                <tr>
                  <th className="px-6 py-4">Nama Desa/Kelurahan</th>
                  <th className="px-6 py-4">Kecamatan</th>
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
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                        {item.nama_desa}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                          {item.master_kecamatan?.nama_kecamatan || '-'}
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
                            onClick={() => handleDelete(item.id, item.nama_desa)}
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
                      Tidak ada data desa/kelurahan ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalItems > itemsPerPage && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Menampilkan <span className="font-semibold text-slate-900 dark:text-white">{(page - 1) * itemsPerPage + 1}</span> - <span className="font-semibold text-slate-900 dark:text-white">{Math.min(page * itemsPerPage, totalItems)}</span> dari <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span> data
              </div>
              <div className="flex gap-1">
                 <button
                   disabled={page === 1}
                   onClick={() => setPage(p => Math.max(1, p - 1))}
                   className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                 >
                   Sebelumnya
                 </button>
                 <div className="px-3 py-1 text-sm font-medium">
                   {page} / {totalPages}
                 </div>
                 <button
                   disabled={page === totalPages}
                   onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                   className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                 >
                   Selanjutnya
                 </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingItem ? "Edit Desa/Kelurahan" : "Tambah Desa/Kelurahan"}
              </h3>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Kecamatan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.kecamatan_id}
                  onChange={(e) => setFormData({ ...formData, kecamatan_id: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white"
                >
                  <option value="" disabled>Pilih Kecamatan</option>
                  {kecamatans.map(kec => (
                    <option key={kec.id} value={kec.id}>{kec.nama_kecamatan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Nama Desa/Kelurahan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.nama_desa}
                  onChange={(e) => setFormData({ ...formData, nama_desa: e.target.value })}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                  placeholder="Misal: Desa Birayang"
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
