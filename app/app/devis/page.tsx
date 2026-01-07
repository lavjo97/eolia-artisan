'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock data pour les devis
const mockDevis = [
  { id: '1', number: 'DEV-2026-012', client: 'M. Dupont Jean', objet: 'Installation climatisation', amount: 2712.50, status: 'sent', date: '07/01/2026' },
  { id: '2', number: 'DEV-2026-011', client: 'SCI Les Palmiers', objet: 'Rénovation électrique', amount: 8500.00, status: 'accepted', date: '05/01/2026' },
  { id: '3', number: 'DEV-2026-010', client: 'M. Charles Pierre', objet: 'Dépannage plomberie', amount: 450.00, status: 'draft', date: '04/01/2026' },
  { id: '4', number: 'DEV-2026-009', client: 'Mme Rosalie Marie', objet: 'Peinture salon', amount: 1850.00, status: 'paid', date: '03/01/2026' },
  { id: '5', number: 'DEV-2026-008', client: 'M. Bernard Louis', objet: 'Installation panneaux solaires', amount: 12500.00, status: 'rejected', date: '02/01/2026' },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-300',
    sent: 'bg-blue-500/20 text-blue-400',
    accepted: 'bg-emerald-500/20 text-emerald-400',
    paid: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };
  
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    sent: 'Envoyé',
    accepted: 'Accepté',
    paid: 'Payé',
    rejected: 'Refusé',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}

export default function DevisPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDevis = mockDevis.filter(devis => {
    const matchesSearch = devis.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         devis.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         devis.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || devis.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mes Devis</h1>
          <p className="text-slate-500">{mockDevis.length} devis au total</p>
        </div>
        
        <div className="flex gap-3">
          <Link
            href="/app/copilote"
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all border border-slate-700"
          >
            <span>🎤</span>
            <span>Nouveau vocal</span>
          </Link>
          <Link
            href="/app/devis/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nouveau devis</span>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Rechercher un devis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="draft">Brouillons</option>
          <option value="sent">Envoyés</option>
          <option value="accepted">Acceptés</option>
          <option value="paid">Payés</option>
          <option value="rejected">Refusés</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Brouillons', count: mockDevis.filter(d => d.status === 'draft').length, color: 'slate' },
          { label: 'Envoyés', count: mockDevis.filter(d => d.status === 'sent').length, color: 'blue' },
          { label: 'Acceptés', count: mockDevis.filter(d => d.status === 'accepted').length, color: 'emerald' },
          { label: 'Payés', count: mockDevis.filter(d => d.status === 'paid').length, color: 'green' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-3xl font-bold text-white mb-1">{stat.count}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Devis list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table header - Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 text-sm font-medium text-slate-400 border-b border-slate-800">
          <div className="col-span-2">Numéro</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-3">Objet</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1 text-right">Montant</div>
          <div className="col-span-1 text-center">Statut</div>
          <div className="col-span-1"></div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-800">
          {filteredDevis.map((devis) => (
            <Link
              key={devis.id}
              href={`/app/devis/${devis.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors items-center"
            >
              {/* Mobile layout */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{devis.number}</span>
                  <StatusBadge status={devis.status} />
                </div>
                <p className="text-slate-400">{devis.client}</p>
                <p className="text-sm text-slate-500">{devis.objet}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">{devis.date}</span>
                  <span className="text-white font-medium">{devis.amount.toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:block col-span-2">
                <span className="text-white font-medium">{devis.number}</span>
              </div>
              <div className="hidden md:block col-span-3">
                <span className="text-slate-300">{devis.client}</span>
              </div>
              <div className="hidden md:block col-span-3">
                <span className="text-slate-400">{devis.objet}</span>
              </div>
              <div className="hidden md:block col-span-1">
                <span className="text-slate-500 text-sm">{devis.date}</span>
              </div>
              <div className="hidden md:block col-span-1 text-right">
                <span className="text-white font-medium">{devis.amount.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="hidden md:flex col-span-1 justify-center">
                <StatusBadge status={devis.status} />
              </div>
              <div className="hidden md:flex col-span-1 justify-end">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    // Menu actions
                  }}
                  className="p-1.5 text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {filteredDevis.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-slate-400 mb-4">Aucun devis trouvé</p>
            <Link
              href="/app/devis/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Créer un devis
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
