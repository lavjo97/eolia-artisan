'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Navigation items
const navItems = [
  { label: 'Tableau de bord', href: '/dashboard', icon: '🏠' },
  { label: 'Copilote IA', href: '/app/copilote', icon: '🎤', badge: 'IA' },
  { label: 'Devis', href: '/app/devis', icon: '📄' },
  { label: 'Factures', href: '/app/factures', icon: '🧾' },
  { label: 'Clients', href: '/app/clients', icon: '👥' },
  { label: 'Produits', href: '/app/produits', icon: '📦' },
  { label: 'Statistiques', href: '/app/stats', icon: '📊' },
];

const bottomNavItems = [
  { label: 'Paramètres', href: '/app/settings', icon: '⚙️' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-40 transform transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Eolia</h1>
              <p className="text-xs text-slate-500">Artisan Pro</p>
            </div>
          </Link>
          
          {/* Close button mobile */}
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-900">
          {bottomNavItems.map((item, i) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={i}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* User profile */}
          <div className="flex items-center gap-3 px-4 py-3 mt-2 bg-slate-800/50 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium">
              JL
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Jordan Laville</p>
              <p className="text-xs text-slate-500 truncate">Plan Premium</p>
            </div>
            <button className="text-slate-400 hover:text-red-400 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen flex flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-20 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-slate-400 hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <span className="font-bold text-white">Eolia</span>
            </Link>

            <button className="p-2 text-slate-400 hover:text-white relative">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 lg:hidden z-20 safe-area-pb">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { label: 'Accueil', href: '/dashboard', icon: '🏠' },
            { label: 'Copilote', href: '/app/copilote', icon: '🎤' },
            { label: 'Devis', href: '/app/devis', icon: '📄' },
            { label: 'Factures', href: '/app/factures', icon: '🧾' },
            { label: 'Plus', href: '/app/settings', icon: '⚙️' },
          ].map((item, i) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={i}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                  isActive ? 'text-emerald-400' : 'text-slate-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
