'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Stats data mockup
const stats = [
  { label: 'Devis ce mois', value: '12', change: '+3', trend: 'up', icon: '📄' },
  { label: 'Factures', value: '8', change: '+2', trend: 'up', icon: '🧾' },
  { label: 'CA du mois', value: '15 420€', change: '+18%', trend: 'up', icon: '💰' },
  { label: 'En attente', value: '3', change: '-1', trend: 'down', icon: '⏳' },
];

// Recent documents mockup
const recentDocuments = [
  { id: 1, type: 'devis', number: 'DEV-2026-012', client: 'M. Dupont', amount: 2712.50, status: 'sent', date: '07/01/2026' },
  { id: 2, type: 'facture', number: 'FAC-2026-008', client: 'Mme Rosalie', amount: 1850.00, status: 'paid', date: '06/01/2026' },
  { id: 3, type: 'devis', number: 'DEV-2026-011', client: 'SCI Les Palmiers', amount: 8500.00, status: 'accepted', date: '05/01/2026' },
  { id: 4, type: 'devis', number: 'DEV-2026-010', client: 'M. Charles', amount: 450.00, status: 'draft', date: '04/01/2026' },
];

// Quick actions
const quickActions = [
  { label: 'Nouveau devis vocal', href: '/app/copilote', icon: '🎤', color: 'emerald' },
  { label: 'Nouveau devis', href: '/app/devis/nouveau', icon: '📄', color: 'blue' },
  { label: 'Nouvelle facture', href: '/app/factures/nouveau', icon: '🧾', color: 'purple' },
  { label: 'Ajouter client', href: '/app/clients/nouveau', icon: '👤', color: 'orange' },
];

function StatusBadge({ status }: { status: string }) {
  const styles = {
    draft: 'bg-slate-500/20 text-slate-300',
    sent: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-emerald-500/20 text-emerald-400',
    paid: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  
  const labels = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    paid: 'Payé',
    rejected: 'Refusé',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || styles.draft}`}>
      {labels[status as keyof typeof labels] || status}
    </span>
  );
}

export default function DashboardPage() {
  const [greeting, setGreeting] = useState('Bonjour');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bonjour');
    else if (hour < 18) setGreeting('Bon après-midi');
    else setGreeting('Bonsoir');
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-20 hidden lg:block">
        {/* Logo */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Eolia</h1>
              <p className="text-xs text-slate-500">Artisan</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {[
            { label: 'Tableau de bord', href: '/dashboard', icon: '🏠', active: true },
            { label: 'Copilote IA', href: '/app/copilote', icon: '🎤', badge: 'Nouveau' },
            { label: 'Devis', href: '/app/devis', icon: '📄' },
            { label: 'Factures', href: '/app/factures', icon: '🧾' },
            { label: 'Clients', href: '/app/clients', icon: '👥' },
            { label: 'Produits', href: '/app/produits', icon: '📦' },
            { label: 'Statistiques', href: '/app/stats', icon: '📊' },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
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
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
          <Link
            href="/app/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
          >
            <span className="text-lg">⚙️</span>
            <span className="font-medium">Paramètres</span>
          </Link>
          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        {/* Top header */}
        <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side */}
            <div>
              <h2 className="text-2xl font-bold text-white">{greeting} 👋</h2>
              <p className="text-sm text-slate-500 capitalize">{currentTime}</p>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  placeholder="Rechercher..."
                  className="w-64 pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>

              {/* Profile */}
              <button className="flex items-center gap-3 p-1.5 pr-4 bg-slate-800/50 rounded-full hover:bg-slate-800 transition-all">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                  JL
                </div>
                <span className="text-sm text-white hidden sm:block">Jordan</span>
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard content */}
        <div className="p-6 space-y-6">
          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, i) => (
              <Link
                key={i}
                href={action.href}
                className="group bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-emerald-500/30 transition-all"
              >
                <div className="text-3xl mb-3">{action.icon}</div>
                <p className="text-white font-medium group-hover:text-emerald-400 transition-colors">
                  {action.label}
                </p>
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <span className={`text-sm font-medium ${stat.trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Main grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent documents */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <h3 className="text-lg font-semibold text-white">Documents récents</h3>
                <Link href="/app/devis" className="text-sm text-emerald-400 hover:text-emerald-300">
                  Voir tout →
                </Link>
              </div>
              <div className="divide-y divide-slate-800">
                {recentDocuments.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/app/${doc.type === 'devis' ? 'devis' : 'factures'}/${doc.id}`}
                    className="flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        doc.type === 'devis' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {doc.type === 'devis' ? '📄' : '🧾'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{doc.number}</p>
                        <p className="text-sm text-slate-500">{doc.client}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium">{doc.amount.toLocaleString('fr-FR')} €</p>
                      <StatusBadge status={doc.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Copilote CTA */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Copilote IA</h3>
                <p className="text-white/80 mb-6">
                  Créez vos devis par la voix. Dictez naturellement, l&apos;IA comprend tout.
                </p>
              </div>
              <Link
                href="/app/copilote"
                className="w-full py-3 bg-white/20 hover:bg-white/30 text-white font-medium rounded-xl text-center transition-all"
              >
                Lancer le copilote →
              </Link>
            </div>
          </div>

          {/* Chart placeholder */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Évolution du chiffre d&apos;affaires</h3>
              <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white">
                <option>6 derniers mois</option>
                <option>12 derniers mois</option>
                <option>Cette année</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'].map((month, i) => {
                const heights = [45, 62, 55, 78, 85, 92];
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-slate-800 rounded-t-lg relative overflow-hidden" style={{ height: `${heights[i]}%` }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 to-teal-500 opacity-80"></div>
                    </div>
                    <span className="text-xs text-slate-500">{month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 lg:hidden z-20">
        <div className="grid grid-cols-5 gap-1 p-2">
          {[
            { label: 'Accueil', href: '/dashboard', icon: '🏠', active: true },
            { label: 'Copilote', href: '/app/copilote', icon: '🎤' },
            { label: 'Devis', href: '/app/devis', icon: '📄' },
            { label: 'Factures', href: '/app/factures', icon: '🧾' },
            { label: 'Plus', href: '/app/settings', icon: '⚙️' },
          ].map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${
                item.active ? 'text-emerald-400' : 'text-slate-500'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
