import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-1.5 rounded-xl">
              <CheckCircle2 size={24} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Survey<span className="text-blue-600 dark:text-blue-400">HST</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center md:text-left">
            © {new Date().getFullYear()} Pemerintah Kabupaten Hulu Sungai Tengah. <br className="md:hidden" /> Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
