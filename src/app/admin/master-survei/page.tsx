"use client";

import { useState } from "react";
import TabUrusan from "@/components/admin/survei/TabUrusan";
import TabPertanyaan from "@/components/admin/survei/TabPertanyaan";

type Tab = "pertanyaan" | "urusan";

export default function MasterSurveiPage() {
  const [activeTab, setActiveTab] = useState<Tab>("pertanyaan");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white tracking-tight mb-2">
            Master Survei
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Kelola Urusan Pemerintahan dan Bank Pertanyaan untuk kuesioner aplikasi.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2 border border-slate-200 dark:border-slate-800 shadow-sm flex gap-2 overflow-x-auto w-full md:w-max">
        <button
          onClick={() => setActiveTab("pertanyaan")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "pertanyaan"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Bank Pertanyaan
        </button>  
        <button
          onClick={() => setActiveTab("urusan")}
          className={`px-6 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${
            activeTab === "urusan"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 shadow-sm"
              : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          }`}
        >
          Kategori Urusan
        </button>
      </div>

      <div className="pt-2">
        {activeTab === "pertanyaan" && <TabPertanyaan />}
        {activeTab === "urusan" && <TabUrusan />}
      </div>
    </div>
  );
}
