"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, AlertCircle, ArrowRight, UserCheck, Shield, ChevronLeft, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase/client";

// Form steps
type Step = "gatekeeper" | "demografi" | "kuesioner" | "selesai";

// Tipe Data Master
interface Kecamatan {
  id: string;
  nama_kecamatan: string;
}

interface Desa {
  id: string;
  nama_desa: string;
}

interface Pertanyaan {
  id: string;
  teks_pertanyaan: string;
  urutan: number;
}

export default function SurveiPage() {
  const router = useRouter();

  // State for steps
  const [currentStep, setCurrentStep] = useState<Step>("gatekeeper");
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to fetch settings
  const [isSurveyActive, setIsSurveyActive] = useState<boolean>(true);
  const [pesanPenutupan, setPesanPenutupan] = useState<string>("");

  // State for Gatekeeper
  const [isASN, setIsASN] = useState<boolean | null>(null);
  const [isEligible, setIsEligible] = useState<boolean | null>(null);

  // State for Data Master (Dropdown)
  const [listKecamatan, setListKecamatan] = useState<Kecamatan[]>([]);
  const [listDesa, setListDesa] = useState<Desa[]>([]);
  const [listPertanyaan, setListPertanyaan] = useState<Pertanyaan[]>([]);
  const [isLoadingDesa, setIsLoadingDesa] = useState<boolean>(false);

  // State for Demografi Form
  const [demografiData, setDemografiData] = useState({
    nomor_hp: "",
    jenis_kelamin: "",
    kelompok_usia: "",
    pendidikan_terakhir: "",
    pekerjaan_utama: "",
    kecamatan_id: "",
    desa_id: "",
  });

  // State for Kuesioner Answers
  // mapping dari pertanyaan_id ke object { skor_pilihan, cerita_kendala }
  const [jawaban, setJawaban] = useState<Record<string, { skor_pilihan: number; cerita_kendala?: string }>>({});
  const [saranAspirasi, setSaranAspirasi] = useState("");
  const [skorMakro, setSkorMakro] = useState<number | null>(null);

  // Load Global Settings
  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('pengaturan_sistem')
        .select('status_survei_aktif, pesan_penutupan')
        .eq('id', 1)
        .single();
        
      if (!error && data) {
        setIsSurveyActive(data.status_survei_aktif);
        setPesanPenutupan(data.pesan_penutupan || "");
      }
    } catch (err) {
      console.error("Gagal memuat pengaturan:", err);
    }
  };

  // Load Master Kecamatan on mount
  const loadKecamatan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("master_kecamatan")
        .select("id, nama_kecamatan")
        .order("nama_kecamatan", { ascending: true });

      if (error) throw error;
      setListKecamatan(data || []);
    } catch (err) {
      console.error("Gagal memuat kecamatan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Pertanyaan when advancing to Kuesioner
  const loadPertanyaan = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("master_pertanyaan")
        .select("id, teks_pertanyaan, urutan")
        .eq("is_active", true)
        .order("urutan", { ascending: true });

      if (error) throw error;
      setListPertanyaan(data || []);
    } catch (err) {
      console.error("Gagal memuat pertanyaan:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Kecamatan ganti
  const handleKecamatanChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kecamatanId = e.target.value;

    setDemografiData({
      ...demografiData,
      kecamatan_id: kecamatanId,
      desa_id: ""
    });
    setListDesa([]);

    if (!kecamatanId) return;

    setIsLoadingDesa(true);
    try {
      const { data, error } = await supabase
        .from("master_desa")
        .select("id, nama_desa")
        .eq("kecamatan_id", kecamatanId)
        .order("nama_desa", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setListDesa(data);
      }
    } catch (err) {
      console.error("Gagal memuat desa:", err);
    } finally {
      setIsLoadingDesa(false);
    }
  };

  const handleDemografiChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDemografiData({
      ...demografiData,
      [e.target.name]: e.target.value
    });
  };

  const isDemografiValid = () => {
    const { jenis_kelamin, kelompok_usia, pendidikan_terakhir, pekerjaan_utama, kecamatan_id, desa_id } = demografiData;
    return jenis_kelamin && kelompok_usia && pendidikan_terakhir && pekerjaan_utama && kecamatan_id && desa_id;
  };

  const isKuesionerValid = () => {
    // Semua pertanyaan harus dijawab skornya
    const semuaTerjawab = listPertanyaan.every(p => jawaban[p.id] && jawaban[p.id].skor_pilihan > 0);
    // Skor makro harus dipilih
    return semuaTerjawab && skorMakro !== null;
  };

  const handleGatekeeperSelect = (isAsnValue: boolean) => {
    setIsASN(isAsnValue);

    setTimeout(() => {
      if (isAsnValue) {
         setIsEligible(false);
      } else {
        setIsEligible(true);
        setTimeout(() => {
          setCurrentStep("demografi");
        }, 800);
      }
    }, 400);
  };

  const resetGatekeeper = () => {
    setIsASN(null);
    setIsEligible(null);
    setCurrentStep("gatekeeper");
  };

  const lanjutKeKuesioner = async () => {
    await loadPertanyaan();
    setCurrentStep("kuesioner");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleJawabanSkor = (pertanyaanId: string, skor: number) => {
    setJawaban(prev => ({
      ...prev,
      [pertanyaanId]: {
        ...prev[pertanyaanId],
        skor_pilihan: skor
      }
    }));
  };

  const handleJawabanCerita = (pertanyaanId: string, cerita: string) => {
    setJawaban(prev => ({
      ...prev,
      [pertanyaanId]: {
        ...prev[pertanyaanId],
        cerita_kendala: cerita
      }
    }));
  };

  const submitSurvei = async () => {
    setIsLoading(true);
    try {
      const payload = {
        demografiData,
        skorMakro,
        saranAspirasi,
        listPertanyaan,
        jawaban
      };

      const response = await fetch('/api/submit-survei', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Gagal mengirim data survei.");
      }

      setCurrentStep("selesai");
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err: any) {
      alert("Gagal mengirim data survei: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgressPercentage = () => {
    // Jika tidak ada kuesioner, fallback ke persentase tahap langkah
    if (currentStep === "gatekeeper") return "0%";
    if (currentStep === "demografi") return "0%";
    if (currentStep === "selesai") return "100%";

    // Untuk tahap "kuesioner", hitung persentase murni berdasarkan jumlah soal yang telah dijawab
    if (currentStep === "kuesioner") {
      if (listPertanyaan.length === 0) return "0%"; // Mencegah NaN = division by 0

      const totalPertanyaan = listPertanyaan.length + 1; // +1 untuk skor makro
      const jumlahTerjawab = listPertanyaan.filter(p => jawaban[p.id] && jawaban[p.id].skor_pilihan > 0).length + (skorMakro !== null ? 1 : 0);

      const kuesionerProgress = (jumlahTerjawab / totalPertanyaan) * 100;
      return `${Math.round(kuesionerProgress)}%`;
    }
    return "0%";
  };

  const currentPercentageStr = calculateProgressPercentage();

  useEffect(() => {
    const initialize = async () => {
      await loadSettings();
      await loadKecamatan();
      setIsLoading(false);
    };
    initialize();
  }, []);

  if (isLoading && !isSurveyActive) {
     return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500">Memeriksa status layanan...</p>
      </div>
     );
  }

  if (!isSurveyActive) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center py-20 px-4">
        <motion.div
          className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-8 md:p-12 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 text-orange-500 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={40} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4">Layanan Survei Ditutup</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 leading-relaxed">
            {pesanPenutupan || "Mohon maaf, periode pengisian Survei Persepsi Publik saat ini sedang ditutup. Nantikan kembali pembukaan survei pada periode berikutnya."}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <ChevronLeft size={18} />
            Kembali ke Beranda
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-20 px-4 md:px-6 flex flex-col items-center">
      <div className="w-full max-w-3xl">

        {/* Progress Header */}
        <AnimatePresence>
          {currentStep === "kuesioner" && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
              className="mb-8"
            >
              {/* Enhanced Progress Header UI */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 md:p-6 shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col gap-4">

                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium text-sm block mb-1">
                      Kuesioner Kepuasan Persepsi Publik
                    </span>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                      Penilaian Kinerja Pemda
                    </h2>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl md:text-3xl font-extrabold text-blue-600 dark:text-blue-500 block leading-none mb-1">
                      {currentPercentageStr}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs md:text-sm font-medium">Selesai</span>
                  </div>
                </div>

                <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 mt-2 relative">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-[#0B0F19] dark:bg-white rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: currentPercentageStr }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                </div>

                <div className="flex justify-between items-center text-xs md:text-sm font-medium mt-1">
                  <span className="text-slate-400/50 dark:text-slate-600">Mulai</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {listPertanyaan.length > 0 ? `${listPertanyaan.filter(p => jawaban[p.id] && jawaban[p.id].skor_pilihan > 0).length + (skorMakro !== null ? 1 : 0)} dari ${listPertanyaan.length + 1} Terjawab` : "Memuat..."}
                  </span>
                  <span className="text-slate-400/50 dark:text-slate-600">Selesai</span>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden relative min-h-[480px] flex flex-col">
          <AnimatePresence mode="wait">

            {/* STEP 1: GATEKEEPER */}
            {currentStep === "gatekeeper" && (
              <motion.div
                key="gatekeeper"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.4 }}
                className="p-8 md:p-12 flex flex-col h-full grow justify-center"
              >
                {!isEligible && isEligible !== false ? (
                  <div className="flex flex-col items-center max-w-xl mx-auto w-full">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-blue-100 dark:border-blue-800/50">
                      <ShieldAlert size={32} strokeWidth={1.5} />
                    </div>

                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4 text-center tracking-tight">
                      Konfirmasi Status
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-10 text-center leading-relaxed">
                      Untuk menjaga objektivitas dan independensi hasil survei, mohon konfirmasi status pekerjaan utama Anda saat ini:
                    </p>

                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={() => handleGatekeeperSelect(false)}
                        className={`group relative w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-300 text-left
                          ${isASN === false
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-none"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-sm"}
                        `}
                      >
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-5 transition-colors
                          ${isASN === false ? "bg-emerald-100 dark:bg-emerald-800/50 text-emerald-600 dark:text-emerald-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-emerald-50 group-hover:text-emerald-500"}
                        `}>
                          <UserCheck size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg mb-1 transition-colors ${isASN === false ? "text-emerald-800 dark:text-emerald-200" : "text-slate-900 dark:text-slate-100"}`}>
                            Saya Warga Sipil
                          </h3>
                          <p className={`text-sm transition-colors ${isASN === false ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}>
                            Karyawan Swasta, Wiraswasta, Mahasiswa, Ibu Rumah Tangga, dll.
                          </p>
                        </div>
                        <div className={`absolute right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isASN === false ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100"}`}>
                          {isASN === false && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </button>

                      <button
                        onClick={() => handleGatekeeperSelect(true)}
                        className={`group relative w-full flex items-center p-5 rounded-2xl border-2 transition-all duration-300 text-left
                          ${isASN === true
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md shadow-blue-100 dark:shadow-none"
                            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm"}
                        `}
                      >
                        <div className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-5 transition-colors
                          ${isASN === true ? "bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-500"}
                        `}>
                          <Shield size={24} />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg mb-1 transition-colors ${isASN === true ? "text-blue-800 dark:text-blue-200" : "text-slate-900 dark:text-slate-100"}`}>
                            Saya Pegawai Aparatur Negara
                          </h3>
                          <p className={`text-sm transition-colors ${isASN === true ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                            Aparatur Sipil Negara (PNS/PPPK), TNI, atau Polri aktif.
                          </p>
                        </div>
                        <div className={`absolute right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isASN === true ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600 opacity-0 group-hover:opacity-100"}`}>
                          {isASN === true && <CheckCircle2 size={14} className="text-white" />}
                        </div>
                      </button>
                    </div>
                  </div>
                ) : isEligible === true ? (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50"
                    >
                      <CheckCircle2 size={40} />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
                    >
                      Status Dikonfirmasi
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-slate-500 dark:text-slate-400"
                    >
                      Menyiapkan lembar survei untuk Anda...
                    </motion.p>
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* REJECTION STATE */}
            {isEligible === false && currentStep === "gatekeeper" && (
              <motion.div
                key="rejection"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 p-8 md:p-12 flex flex-col items-center justify-center text-center z-10"
              >
                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 rounded-full border border-blue-200 dark:border-blue-800/50 animate-ping opacity-20"></div>
                  <ShieldAlert size={48} className="opacity-90 absolute" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  Terima Kasih atas Dedikasi Anda
                </h2>
                <div className="w-16 h-1 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-6 mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-md leading-relaxed text-lg">
                  Saat ini, survei Indeks Persepsi Publik diperuntukkan khusus bagi <strong className="text-slate-900 dark:text-white">warga sipil pengguna layanan</strong>, guna menjaga netralitas dan objektivitas penilaian terhadap Pemerintah Daerah.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Kembali ke Beranda
                  </Link>
                  <button
                    onClick={resetGatekeeper}
                    className="inline-flex items-center justify-center px-8 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                  >
                    Saya Salah Pilih Status
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: DEMOGRAFI */}
            {currentStep === "demografi" && (
              <motion.div
                key="demografi"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-10 flex flex-col grow h-full"
              >
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                    Data Demografi
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">
                    Mohon lengkapi profil Anda (Berdasarkan KTP Hulu Sungai Tengah). Data profil bersifat rahasia.
                  </p>
                </div>

                <div className="space-y-6 flex-1 bg-white dark:bg-slate-900 overflow-y-auto pr-2 pb-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Nomor HP/WhatsApp <span className="text-slate-400 font-normal ml-1">(Opsional)</span>
                    </label>
                    <input
                      type="tel"
                      name="nomor_hp"
                      value={demografiData.nomor_hp}
                      onChange={handleDemografiChange}
                      placeholder="Contoh: 081234567890"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Jenis Kelamin <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="jenis_kelamin"
                        value={demografiData.jenis_kelamin}
                        onChange={handleDemografiChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Kelompok Usia <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="kelompok_usia"
                        value={demografiData.kelompok_usia}
                        onChange={handleDemografiChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Pilih Usia</option>
                        <option value="17-25">17 - 25 Tahun</option>
                        <option value="26-35">26 - 35 Tahun</option>
                        <option value="36-45">36 - 45 Tahun</option>
                        <option value="46-55">46 - 55 Tahun</option>
                        <option value="56+">Diatas 55 Tahun</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Pendidikan Terakhir <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="pendidikan_terakhir"
                        value={demografiData.pendidikan_terakhir}
                        onChange={handleDemografiChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Pilih Pendidikan</option>
                        <option value="SD">SD Sederajat</option>
                        <option value="SMP">SMP Sederajat</option>
                        <option value="SMA">SMA Sederajat</option>
                        <option value="D1-D3">Diploma (D1-D3)</option>
                        <option value="S1">Sarjana (S1)</option>
                        <option value="S2-S3">Pascasarjana (S2/S3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Pekerjaan Utama <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="pekerjaan_utama"
                        value={demografiData.pekerjaan_utama}
                        onChange={handleDemografiChange}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none"
                      >
                        <option value="">Pilih Pekerjaan</option>
                        <option value="Wiraswasta">Wiraswasta / Pengusaha</option>
                        <option value="Karyawan Swasta">Karyawan Swasta</option>
                        <option value="Petani/Pekebun">Petani / Pekebun</option>
                        <option value="Pedagang">Pedagang</option>
                        <option value="Buruh/Pekerja Harian">Buruh / Pekerja Harian</option>
                        <option value="Mahasiswa/Pelajar">Mahasiswa / Pelajar</option>
                        <option value="Ibu Rumah Tangga">Ibu Rumah Tangga</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div className="w-full h-px bg-slate-200 dark:bg-slate-800 my-2"></div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Kecamatan Domisili (KTP) <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="kecamatan_id"
                        value={demografiData.kecamatan_id}
                        onChange={handleKecamatanChange}
                        disabled={isLoading}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:opacity-50"
                      >
                        <option value="">{isLoading ? "Memuat Kecamatan..." : "Pilih Kecamatan"}</option>
                        {listKecamatan.map((kec) => (
                          <option key={kec.id} value={kec.id}>{kec.nama_kecamatan}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Desa/Kelurahan <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="desa_id"
                        value={demografiData.desa_id}
                        onChange={handleDemografiChange}
                        disabled={!demografiData.kecamatan_id || isLoadingDesa}
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                      >
                        <option value="">
                          {!demografiData.kecamatan_id
                            ? "Pilih Kecamatan Dahulu"
                            : isLoadingDesa
                              ? "Memuat Desa..."
                              : "Pilih Desa/Kelurahan"}
                        </option>
                        {listDesa.map((desa) => (
                          <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6">
                  <button
                    onClick={resetGatekeeper}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <ChevronLeft size={18} />
                    Kembali
                  </button>
                  <button
                    onClick={lanjutKeKuesioner}
                    disabled={!isDemografiValid() || isLoading}
                    className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Selanjutnya"}
                    {!isLoading && <ArrowRight size={18} />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: KUESIONER */}
            {currentStep === "kuesioner" && (
              <motion.div
                key="kuesioner"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="p-6 md:p-10 flex flex-col grow h-full"
              >
                <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-6">
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
                    Kuesioner Layanan Publik
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">
                    Silakan berikan penilaian Anda sesuai dengan pengalaman Anda. Skala 1 (Sangat Buruk/Sangat Sulit) hingga 5 (Sangat Baik/Sangat Mudah).
                  </p>
                </div>

                <div className="space-y-10 overflow-y-auto pr-2 pb-6 flex-1">
                  {listPertanyaan.length > 0 ? (
                    listPertanyaan.map((pert, index) => {
                      const ans = jawaban[pert.id]?.skor_pilihan;
                      const butuhCerita = ans === 1 || ans === 2;
                      const hasAnswered = !!ans; // munculkan text area jika sudah ada jawaban apapun

                      return (
                        <div key={pert.id} className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200 dark:border-slate-800">
                          <div className="mb-4">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-bold mb-3 shadow-sm text-sm">
                              {index + 1}
                            </div>
                            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                              {pert.teks_pertanyaan}
                            </h3>
                          </div>

                          <div className="grid grid-cols-5 gap-2 md:gap-4 mt-6">
                            {[1, 2, 3, 4, 5].map(score => (
                              <button
                                key={score}
                                onClick={() => handleJawabanSkor(pert.id, score)}
                                className={`flex flex-col items-center justify-center py-4 rounded-xl border-2 transition-all duration-200
                                      ${ans === score
                                    ? (score <= 2 ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 shadow-md shadow-red-100 dark:shadow-none'
                                      : score === 3 ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 shadow-md'
                                        : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-md shadow-emerald-100 dark:shadow-none')
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                  }
                                   `}
                              >
                                <span className="text-2xl font-bold">{score}</span>
                                <span className="text-[10px] md:text-xs text-center mt-1 hidden sm:block opacity-80">
                                  {score === 1 && "Sangat Kurang"}
                                  {score === 2 && "Kurang"}
                                  {score === 3 && "Cukup"}
                                  {score === 4 && "Baik"}
                                  {score === 5 && "Sangat Baik"}
                                </span>
                              </button>
                            ))}
                          </div>

                          <AnimatePresence>
                            {hasAnswered && (
                              <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <div className={`p-4 border rounded-xl space-y-2 transition-colors duration-300
                                   ${butuhCerita
                                    ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50'
                                  }
                                 `}>
                                  <label className={`block text-sm font-semibold 
                                    ${butuhCerita ? 'text-red-800 dark:text-red-300' : 'text-slate-700 dark:text-slate-300'}
                                  `}>
                                    {butuhCerita
                                      ? "Mohon ceritakan kendala yang Bapak/Ibu alami (Wajib terisi)"
                                      : "Ada alasan atau pesan khusus terkait penilaian ini? (Boleh dikosongkan)"}
                                  </label>
                                  <textarea
                                    required={butuhCerita}
                                    value={jawaban[pert.id]?.cerita_kendala || ""}
                                    onChange={(e) => handleJawabanCerita(pert.id, e.target.value)}
                                    rows={2}
                                    placeholder={butuhCerita
                                      ? "Apa yang membuat layanan terasa kurang maksimal? Keluhan Anda berharga bagi kami."
                                      : "Ketik di sini jika ada tambahan catatan/apresiasi..."
                                    }
                                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 focus:ring-2 outline-none transition-all text-sm
                                      ${butuhCerita
                                        ? 'border-red-200 dark:border-red-800/50 text-slate-800 dark:text-slate-200 focus:ring-red-500 placeholder:text-slate-400'
                                        : 'border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 focus:ring-blue-500 placeholder:text-slate-400'
                                      }
                                    `}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center p-8 text-slate-500">
                      Belum ada master pertanyaan yang aktif di database.
                    </div>
                  )}

                  <hr className="border-slate-200 dark:border-slate-800" />

                  {/* Skor Makro & Saran */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Penilaian Secara Keseluruhan (Makro)</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm mb-6">Penilaian komprehensif Anda atas kinerja Pemkab secara umum.</p>

                    <div className="mb-8">
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">
                        Berikan Rating Kepuasan Keseluruhan Anda <span className="text-red-500">*</span>
                      </label>
                      <div className="flex flex-wrap gap-3">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button
                            key={`makro-${score}`}
                            onClick={() => setSkorMakro(score)}
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl text-xl font-bold flex items-center justify-center transition-all ${skorMakro === score
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-110 ring-4 ring-blue-600/20'
                                : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600'
                              }`}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Saran, Aspirasi, atau Keluhan Tambahan (Opsional)
                      </label>
                      <textarea
                        value={saranAspirasi}
                        onChange={(e) => setSaranAspirasi(e.target.value)}
                        rows={3}
                        placeholder="Sampaikan aspirasi Anda untuk memajukan pembangunan dan pelayanan pemerintah daerah..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-6 bg-white dark:bg-slate-900 sticky bottom-0 z-10">
                  <button
                    onClick={() => setCurrentStep("demografi")}
                    className="flex items-center gap-2 px-6 py-3 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <ChevronLeft size={18} />
                    Kembali
                  </button>
                  <button
                    onClick={submitSurvei}
                    disabled={!isKuesionerValid() || isLoading}
                    className="flex items-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:dark:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-all shadow-md active:scale-95"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Kirimkan Survei"}
                    {!isLoading && <Send size={18} />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SELESAI */}
            {currentStep === "selesai" && (
              <motion.div
                key="selesai"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 bg-white dark:bg-slate-900 p-8 md:p-12 flex flex-col items-center justify-center text-center z-10"
              >
                <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mb-8 relative shadow-inner">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-2xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
                  Terkirim! Terima Kasih
                </h2>
                <div className="w-16 h-1 bg-emerald-100 dark:bg-emerald-900/50 rounded-full mb-6 mx-auto"></div>
                <p className="text-slate-600 dark:text-slate-400 mb-10 max-w-md leading-relaxed text-lg">
                  Aspirasi dan penilaian Bapak/Ibu sangat berharga bagi peningkatan mutu layanan kinerja Pemerintah Daerah Hulu Sungai Tengah.
                </p>
                <div className="flex justify-center">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center px-8 py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    Kembali ke Beranda
                  </Link>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
