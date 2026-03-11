"use client";

import { LogOut, User, Menu } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AdminHeader({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email ?? "Admin");
      }
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header className="h-16 w-full flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
      
      {/* Left side: Breadcrumb placeholder or Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white hidden sm:block">Dashboard Administrasi</h1>
      </div>

      {/* Right side: User Profile & Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        <ThemeToggle />
        
        <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-700">
            <User size={18} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800 dark:text-white leading-tight">
              {email || "Memuat..."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Administrator</p>
          </div>
        </div>

        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

        <button 
          onClick={handleLogout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          title="Keluar / Logout"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium hidden sm:block">Keluar</span>
        </button>
      </div>

    </header>
  );
}
