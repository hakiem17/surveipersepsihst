"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled ? "py-2" : "py-4"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div
            className={`flex items-center justify-between transition-all duration-300 ${
              isScrolled
                ? "glass rounded-full px-6 py-3"
                : "bg-transparent px-2 py-2"
            }`}
          >
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-blue-600 text-white p-1.5 rounded-xl group-hover:scale-105 transition-transform">
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Survey<span className="text-blue-600 dark:text-blue-400">HST</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600 dark:text-slate-300">
              <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Beranda</Link>
              <Link href="#tentang" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Tentang</Link>
              <Link href="#statistik" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Statistik</Link>
            </nav>

            <div className="hidden md:block">
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Login
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-60 md:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-900 z-70 p-6 shadow-2xl flex flex-col md:hidden border-l border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600 text-white p-1.5 rounded-xl">
                    <CheckCircle2 size={24} strokeWidth={2.5} />
                  </div>
                  <span className="font-bold text-lg tracking-tight">SurveyHST</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="flex flex-col gap-4 flex-1">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Beranda
                </Link>
                <Link
                  href="#tentang"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Tentang Survei
                </Link>
                <Link
                  href="#statistik"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors"
                >
                  Statistik & Hasil
                </Link>
              </nav>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center items-center w-full bg-blue-600 hover:bg-blue-700 text-white px-5 py-3.5 rounded-xl font-medium transition-all shadow-md active:scale-95 text-center"
                >
                  Login
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
