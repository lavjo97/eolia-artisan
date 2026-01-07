'use client';

/**
 * Page de démonstration du tableau blanc SketchCanvas
 */

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Import dynamique pour éviter les erreurs SSR avec tldraw
const SketchCanvas = dynamic(
  () => import('@/components/SketchCanvas'),
  { 
    ssr: false,
    loading: () => (
      <div style={{
        height: 500,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        borderRadius: 12,
      }}>
        <p>Chargement du tableau blanc...</p>
      </div>
    ),
  }
);

export default function SketchPage() {
  const [sketchUrl, setSketchUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ID de test pour le devis
  const testQuoteId = 'demo-' + Date.now();

  const handleSave = (url: string) => {
    setSketchUrl(url);
    setError(null);
    console.log('Schéma enregistré:', url);
  };

  const handleError = (err: string) => {
    setError(err);
    console.error('Erreur:', err);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Header */}
        <header style={{
          marginBottom: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#0f172a',
            marginBottom: '0.5rem',
          }}>
            📐 Tableau Blanc Interactif
          </h1>
          <p style={{ color: '#64748b' }}>
            Dessinez le schéma du site pour votre devis
          </p>
        </header>

        {/* Messages */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '1rem',
          }}>
            ⚠️ {error}
          </div>
        )}

        {sketchUrl && (
          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            padding: '1rem',
            borderRadius: 8,
            marginBottom: '1rem',
          }}>
            ✅ Schéma enregistré avec succès !
            <br />
            <a 
              href={sketchUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: '#15803d', textDecoration: 'underline' }}
            >
              Voir l&apos;image
            </a>
          </div>
        )}

        {/* Canvas */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          padding: '1.5rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        }}>
          <SketchCanvas
            quoteId={testQuoteId}
            onSave={handleSave}
            onError={handleError}
            height={600}
          />
        </div>

        {/* Instructions */}
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'white',
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#0f172a',
            marginBottom: '1rem',
          }}>
            💡 Comment utiliser
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
              <strong>✏️ Crayon</strong>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                Dessinez librement des lignes et formes
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
              <strong>➡️ Flèche</strong>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                Indiquez les directions et mesures
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
              <strong>⬜ Rectangle</strong>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                Délimitez les zones et espaces
              </p>
            </div>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8 }}>
              <strong>🧹 Gomme</strong>
              <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                Effacez les éléments indésirables
              </p>
            </div>
          </div>
        </div>

        {/* Aperçu du schéma enregistré */}
        {sketchUrl && (
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 600,
              color: '#0f172a',
              marginBottom: '1rem',
            }}>
              🖼️ Aperçu du schéma enregistré
            </h2>
            <img 
              src={sketchUrl} 
              alt="Schéma du site"
              style={{
                maxWidth: '100%',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
