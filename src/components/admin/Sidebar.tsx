"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Map, ListTodo, Settings, ChevronLeft, Menu, BarChart, Users, X } from "lucide-react";
import { useState } from "react";

const navigation = [
  { name: 'Dashboard Utama', href: '/admin', icon: LayoutDashboard },
  { name: 'Data Responden', href: '/admin/data-responden', icon: Users },
  { name: 'Laporan Analitik', href: '/admin/laporan', icon: BarChart },
  { name: 'Master Wilayah', href: '/admin/master-wilayah', icon: Map },
  { name: 'Master Survei', href: '/admin/master-survei', icon: ListTodo },
  { name: 'Pengaturan', href: '/admin/pengaturan', icon: Settings },
];

export default function AdminSidebar({ 
  collapsed, 
  setCollapsed,
  mobileOpen,
  setMobileOpen
}: { 
  collapsed: boolean; 
  setCollapsed: (v: boolean) => void;
  mobileOpen?: boolean;
  setMobileOpen?: (v: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      {mobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm"
          onClick={() => setMobileOpen?.(false)}
        />
      )}

      {/* Sidebar container */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 transition-all duration-300 
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-20' : 'w-64'}
        `}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/50 dark:border-slate-800/50 shrink-0">
          {!collapsed && (
            <span className="font-bold text-lg text-slate-800 dark:text-white truncate">
              Survei Admin
            </span>
          )}
          
          {/* Desktop Collapse Toggle */}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:block p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors mx-auto"
          >
            {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
          </button>
          
          {/* Mobile Close Toggle */}
          <button 
            onClick={() => setMobileOpen?.(false)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto"
          >
            <X size={20} />
          </button>
        </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-3 rounded-xl transition-all group
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
              title={collapsed ? item.name : undefined}
              onClick={() => setMobileOpen?.(false)}
            >
              <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'} />
              {(!collapsed || mobileOpen) && <span>{item.name}</span>}
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
}
