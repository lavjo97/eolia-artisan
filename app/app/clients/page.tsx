'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock data pour les clients
const mockClients = [
  { id: '1', nom: 'Dupont', prenom: 'Jean', entreprise: '', ville: 'Fort-de-France', department: '972', email: 'jean.dupont@email.com', telephone: '0696 12 34 56', totalDevis: 3, totalFactures: 2, ca: 5400 },
  { id: '2', nom: 'Rosalie', prenom: 'Marie', entreprise: '', ville: 'Le Lamentin', department: '972', email: 'marie.rosalie@email.com', telephone: '0696 23 45 67', totalDevis: 2, totalFactures: 2, ca: 3700 },
  { id: '3', nom: '', prenom: '', entreprise: 'SCI Les Palmiers', ville: 'Les Abymes', department: '971', email: 'contact@lespalmiers.gp', telephone: '0590 12 34 56', totalDevis: 5, totalFactures: 4, ca: 28000 },
  { id: '4', nom: 'Charles', prenom: 'Pierre', entreprise: '', ville: 'Cayenne', department: '973', email: 'p.charles@email.com', telephone: '0694 34 56 78', totalDevis: 1, totalFactures: 0, ca: 0 },
  { id: '5', nom: 'Bernard', prenom: 'Louis', entreprise: 'Bernard & Fils', ville: 'Saint-Denis', department: '974', email: 'louis@bernardfils.re', telephone: '0692 45 67 89', totalDevis: 4, totalFactures: 3, ca: 12500 },
];

function getDepartmentLabel(dept: string): string {
  const labels: Record<string, string> = {
    '971': 'Guadeloupe',
    '972': 'Martinique',
    '973': 'Guyane',
    '974': 'La Réunion',
    '976': 'Mayotte',
  };
  return labels[dept] || dept;
}

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const filteredClients = mockClients.filter(client => {
    const name = client.entreprise || `${client.prenom} ${client.nom}`;
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         client.ville.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = departmentFilter === 'all' || client.department === departmentFilter;
    return matchesSearch && matchesDept;
  });

  // Stats
  const totalCA = mockClients.reduce((sum, c) => sum + c.ca, 0);
  const totalClients = mockClients.length;

  return (
    <div className="p-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mes Clients</h1>
          <p className="text-slate-500">{totalClients} clients au total</p>
        </div>
        
        <Link
          href="/app/clients/nouveau"
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-500/25"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          <span>Nouveau client</span>
        </Link>
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
            placeholder="Rechercher un client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>

        {/* Department filter */}
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">Tous les départements</option>
          <option value="971">Guadeloupe (971)</option>
          <option value="972">Martinique (972)</option>
          <option value="973">Guyane (973)</option>
          <option value="974">La Réunion (974)</option>
          <option value="976">Mayotte (976)</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-white mb-1">{totalClients}</p>
          <p className="text-sm text-slate-500">Clients</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-white mb-1">{totalCA.toLocaleString('fr-FR')} €</p>
          <p className="text-sm text-slate-500">CA total</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-white mb-1">{mockClients.reduce((sum, c) => sum + c.totalDevis, 0)}</p>
          <p className="text-sm text-slate-500">Devis envoyés</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-white mb-1">{mockClients.reduce((sum, c) => sum + c.totalFactures, 0)}</p>
          <p className="text-sm text-slate-500">Factures émises</p>
        </div>
      </div>

      {/* Clients grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const displayName = client.entreprise || `${client.prenom} ${client.nom}`;
          const initials = client.entreprise 
            ? client.entreprise.substring(0, 2).toUpperCase()
            : `${client.prenom[0] || ''}${client.nom[0] || ''}`.toUpperCase();
          
          return (
            <Link
              key={client.id}
              href={`/app/clients/${client.id}`}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-emerald-500/30 transition-all group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center text-white font-bold group-hover:from-emerald-500 group-hover:to-teal-600 transition-all">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate group-hover:text-emerald-400 transition-colors">
                    {displayName}
                  </h3>
                  <p className="text-sm text-slate-500 truncate">{client.ville}</p>
                </div>
                <span className="px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded-lg">
                  {getDepartmentLabel(client.department)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                {client.email && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.telephone && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{client.telephone}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-white font-medium">{client.totalDevis}</p>
                  <p className="text-xs text-slate-500">Devis</p>
                </div>
                <div>
                  <p className="text-white font-medium">{client.totalFactures}</p>
                  <p className="text-xs text-slate-500">Factures</p>
                </div>
                <div>
                  <p className="text-emerald-400 font-medium">{client.ca > 0 ? `${(client.ca / 1000).toFixed(1)}k€` : '-'}</p>
                  <p className="text-xs text-slate-500">CA</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredClients.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-slate-400 mb-4">Aucun client trouvé</p>
          <Link
            href="/app/clients/nouveau"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
          >
            Ajouter un client
          </Link>
        </div>
      )}
    </div>
  );
}
