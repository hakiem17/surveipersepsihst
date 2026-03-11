"use client";

import { useState } from "react";
import TabKecamatan from "@/components/admin/wilayah/TabKecamatan";
import TabDesa from "@/components/admin/wilayah/TabDesa";

type Tab = "kecamatan" | "desa";

export default function MasterWilayahPage() {
  const [activeTab, setActiveTab] = useState<Tab>("kecamatan");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">
            Master Wilayah
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola data hierarki Kecamatan dan Desa/Kelurahan untuk referensi pilihan responden.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2 overflow-x-auto w-full md:w-max">
        <button
          onClick={() => setActiveTab("kecamatan")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "kecamatan"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Data Kecamatan
        </button>
        <button
          onClick={() => setActiveTab("desa")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "desa"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Data Desa/Kelurahan
        </button>
      </div>

      <div className="pt-2">
        {activeTab === "kecamatan" && <TabKecamatan />}
        {activeTab === "desa" && <TabDesa />}
      </div>
    </div>
  );
}
