import Link from "next/link";
import { BarChart3, ShieldCheck, Smartphone } from "lucide-react";
import { SurveyCTA } from "@/components/home/SurveyCTA";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen w-full relative overflow-hidden bg-[#f4f7fe] dark:bg-slate-950">
      {/* Background Decor */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-500/20 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 md:px-6 container mx-auto flex flex-col items-center text-center relative z-10">
        
        <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight max-w-5xl mb-6 text-slate-900 dark:text-white leading-[1.1] md:leading-[1.15]">
          Survei Persepsi Publik <br className="hidden md:block" />
          <span className="text-[#3b5fff] dark:text-blue-500">Kabupaten Hulu Sungai Tengah</span>
        </h1>
        
        <p className="text-base md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-10 leading-relaxed px-4">
          Suara Anda sangat berarti untuk mengevaluasi dan meningkatkan kualitas layanan publik Pemerintah Kabupaten Hulu Sungai Tengah.
        </p>
        
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-white/50 dark:bg-slate-900/30 relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Mudah & Cepat</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                Dioptimalkan untuk peramban ponsel. Isi survei kapan saja dan di mana saja.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Aman & Rahasia</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                Data terenkripsi. Identitas Anda dijaga kerahasiaannya untuk agregasi data kinerja.
              </p>
            </div>
            
            <div className="flex flex-col items-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 size={32} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-3 text-slate-900 dark:text-white">Transparan</h3>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm md:text-base">
                Hasil survei diperbarui secara real-time pada Dashboard Eksekutif.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <SurveyCTA />
    </div>
  );
}
