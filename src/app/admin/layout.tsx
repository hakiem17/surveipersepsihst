"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";
import { Loader2 } from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session || error) {
        // Jika tidak ada sesi aktif, tendang balik ke halam login
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    };

    checkAuth();
  }, [router]);

  // Tampilkan layar loading selama mengecek sesi
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
        <p className="text-slate-500 font-medium">Memeriksa otentikasi sesi...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 font-sans relative">
      {/* Animated Mesh Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 dark:bg-blue-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-[10000ms]" />
         <div className="absolute top-[20%] -right-[10%] w-[45%] h-[55%] rounded-full bg-indigo-400/20 dark:bg-indigo-900/20 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-[8000ms] delay-700" />
         <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[60%] rounded-full bg-purple-400/20 dark:bg-emerald-900/10 blur-[120px] mix-blend-multiply dark:mix-blend-lighten animate-pulse duration-[12000ms] delay-1000" />
      </div>

      {/* Main UI Wrapper (z-10 to stay above mesh) */}
      <div className="relative z-10 flex w-full flex-col min-h-screen">
      <AdminSidebar 
        collapsed={sidebarCollapsed} 
        setCollapsed={setSidebarCollapsed} 
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />
      
      {/* Konten Utama (Bergeser saat sidebar ditarik pada desktop) */}
      <div 
        className={`flex flex-col h-screen transition-all duration-300 ${
          sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
        }`}
      >
        <AdminHeader onMenuClick={() => setMobileMenuOpen(true)} />
        
        {/* Area Scrollable untuk Konten Panel Utama */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-transparent p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto h-full relative z-10">
             {children}
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
