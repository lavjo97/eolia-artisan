'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock data pour les factures
const mockFactures = [
  { id: '1', number: 'FAC-2026-008', client: 'Mme Rosalie Marie', objet: 'Peinture salon', amount: 1850.00, status: 'paid', date: '06/01/2026', dueDate: '06/02/2026' },
  { id: '2', number: 'FAC-2026-007', client: 'M. Bernard Louis', objet: 'Réparation toiture', amount: 3200.00, status: 'pending', date: '03/01/2026', dueDate: '03/02/2026' },
  { id: '3', number: 'FAC-2026-006', client: 'SCI Les Palmiers', objet: 'Maintenance mensuelle', amount: 850.00, status: 'overdue', date: '15/12/2025', dueDate: '15/01/2026' },
  { id: '4', number: 'FAC-2026-005', client: 'M. Dupont Jean', objet: 'Installation électrique', amount: 4500.00, status: 'paid', date: '10/12/2025', dueDate: '10/01/2026' },
  { id: '5', number: 'FAC-2026-004', client: 'Mme Charles Anne', objet: 'Plomberie salle de bain', amount: 1200.00, status: 'paid', date: '01/12/2025', dueDate: '01/01/2026' },
];

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: 'bg-slate-500/20 text-slate-300',
    pending: 'bg-amber-500/20 text-amber-400',
    paid: 'bg-green-500/20 text-green-400',
    overdue: 'bg-red-500/20 text-red-400',
    cancelled: 'bg-slate-500/20 text-slate-400',
  };
  
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
    cancelled: 'Annulée',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
}

export default function FacturesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredFactures = mockFactures.filter(facture => {
    const matchesSearch = facture.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facture.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         facture.number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || facture.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calcul des totaux
  const totalPaid = mockFactures.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = mockFactures.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = mockFactures.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mes Factures</h1>
          <p className="text-slate-500">{mockFactures.length} factures au total</p>
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
            href="/app/factures/nouveau"
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Nouvelle facture</span>
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
            placeholder="Rechercher une facture..."
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
          <option value="pending">En attente</option>
          <option value="paid">Payées</option>
          <option value="overdue">En retard</option>
        </select>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-green-400 text-sm">Payées</span>
            <span className="text-2xl">💰</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalPaid.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-amber-400 text-sm">En attente</span>
            <span className="text-2xl">⏳</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalPending.toLocaleString('fr-FR')} €</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-red-400 text-sm">En retard</span>
            <span className="text-2xl">⚠️</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalOverdue.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Factures list */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {/* Table header - Desktop */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-800/50 text-sm font-medium text-slate-400 border-b border-slate-800">
          <div className="col-span-2">Numéro</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Objet</div>
          <div className="col-span-1">Date</div>
          <div className="col-span-1">Échéance</div>
          <div className="col-span-1 text-right">Montant</div>
          <div className="col-span-1 text-center">Statut</div>
          <div className="col-span-1"></div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-800">
          {filteredFactures.map((facture) => (
            <Link
              key={facture.id}
              href={`/app/factures/${facture.id}`}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-800/50 transition-colors items-center"
            >
              {/* Mobile layout */}
              <div className="md:hidden space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">{facture.number}</span>
                  <StatusBadge status={facture.status} />
                </div>
                <p className="text-slate-400">{facture.client}</p>
                <p className="text-sm text-slate-500">{facture.objet}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-500">Échéance: {facture.dueDate}</span>
                  <span className="text-white font-medium">{facture.amount.toLocaleString('fr-FR')} €</span>
                </div>
              </div>

              {/* Desktop layout */}
              <div className="hidden md:block col-span-2">
                <span className="text-white font-medium">{facture.number}</span>
              </div>
              <div className="hidden md:block col-span-3">
                <span className="text-slate-300">{facture.client}</span>
              </div>
              <div className="hidden md:block col-span-2">
                <span className="text-slate-400">{facture.objet}</span>
              </div>
              <div className="hidden md:block col-span-1">
                <span className="text-slate-500 text-sm">{facture.date}</span>
              </div>
              <div className="hidden md:block col-span-1">
                <span className={`text-sm ${facture.status === 'overdue' ? 'text-red-400' : 'text-slate-500'}`}>
                  {facture.dueDate}
                </span>
              </div>
              <div className="hidden md:block col-span-1 text-right">
                <span className="text-white font-medium">{facture.amount.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="hidden md:flex col-span-1 justify-center">
                <StatusBadge status={facture.status} />
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
        {filteredFactures.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🧾</div>
            <p className="text-slate-400 mb-4">Aucune facture trouvée</p>
            <Link
              href="/app/factures/nouveau"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Créer une facture
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
