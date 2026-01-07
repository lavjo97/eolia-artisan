'use client';

/**
 * SketchCanvas - Tableau blanc interactif avec tldraw
 * Permet aux artisans de dessiner des schémas de site
 * Interface simplifiée pour mobile
 */

import React, { useCallback, useState, useRef } from 'react';
import { Tldraw, Editor } from 'tldraw';
import 'tldraw/tldraw.css';

interface SketchCanvasProps {
  /** ID du devis/facture pour lier le schéma */
  quoteId: string;
  /** URL initiale du schéma (pour édition) */
  initialSketchUrl?: string;
  /** Callback après enregistrement réussi */
  onSave?: (sketchUrl: string) => void;
  /** Callback en cas d'erreur */
  onError?: (error: string) => void;
  /** Hauteur du canvas (défaut: 500px) */
  height?: number | string;
}

export default function SketchCanvas({
  quoteId,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initialSketchUrl,
  onSave,
  onError,
  height = 500,
}: SketchCanvasProps) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [currentTool, setCurrentTool] = useState('draw');
  const containerRef = useRef<HTMLDivElement>(null);

  // Callback quand l'éditeur est prêt
  const handleMount = useCallback((editorInstance: Editor) => {
    setEditor(editorInstance);
    // Sélectionner l'outil crayon par défaut
    editorInstance.setCurrentTool('draw');
  }, []);

  // Changer d'outil
  const selectTool = useCallback((toolId: string) => {
    if (editor) {
      editor.setCurrentTool(toolId);
      setCurrentTool(toolId);
    }
  }, [editor]);

  // Exporter le dessin en PNG via capture du canvas HTML
  const exportToPng = useCallback(async (): Promise<Blob | null> => {
    if (!editor || !containerRef.current) return null;

    try {
      const shapeIds = editor.getCurrentPageShapeIds();
      if (shapeIds.size === 0) {
        onError?.('Le canvas est vide. Dessinez quelque chose avant d\'enregistrer.');
        return null;
      }

      // Trouver le canvas dans le conteneur tldraw
      const canvas = containerRef.current.querySelector('canvas');
      if (!canvas) {
        onError?.('Canvas non trouvé.');
        return null;
      }

      // Créer un nouveau canvas pour l'export
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return null;

      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      
      // Dessiner le canvas tldraw
      ctx.drawImage(canvas, 0, 0);

      return new Promise((resolve) => {
        exportCanvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/png', 0.9);
      });
    } catch (err) {
      console.error('Erreur export PNG:', err);
      onError?.('Erreur lors de l\'export du dessin.');
      return null;
    }
  }, [editor, onError]);

  // Upload vers Supabase Storage
  const uploadToSupabase = useCallback(async (blob: Blob): Promise<string | null> => {
    try {
      const formData = new FormData();
      const filename = `sketch_${quoteId}_${Date.now()}.png`;
      formData.append('file', blob, filename);
      formData.append('quoteId', quoteId);
      formData.append('bucket', 'site-plans');

      const response = await fetch('/api/sketch/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur upload');
      }

      const data = await response.json();
      return data.url;
    } catch (err) {
      console.error('Erreur upload Supabase:', err);
      return null;
    }
  }, [quoteId]);

  // Enregistrer le schéma
  const handleSave = useCallback(async () => {
    if (!editor || isSaving) return;

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const blob = await exportToPng();
      if (!blob) {
        setIsSaving(false);
        setSaveStatus('error');
        return;
      }

      const url = await uploadToSupabase(blob);
      if (!url) {
        onError?.('Erreur lors de l\'enregistrement. Vérifiez votre connexion.');
        setIsSaving(false);
        setSaveStatus('error');
        return;
      }

      setSaveStatus('success');
      onSave?.(url);
      setTimeout(() => setSaveStatus('idle'), 3000);

    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      onError?.('Erreur inattendue lors de l\'enregistrement.');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [editor, isSaving, exportToPng, uploadToSupabase, onSave, onError]);

  // Effacer tout le canvas
  const handleClear = useCallback(() => {
    if (!editor) return;
    editor.selectAll();
    editor.deleteShapes(editor.getSelectedShapeIds());
  }, [editor]);

  // Outils disponibles
  const tools = [
    { id: 'select', icon: '🖱️', label: 'Sélection' },
    { id: 'draw', icon: '✏️', label: 'Crayon' },
    { id: 'arrow', icon: '➡️', label: 'Flèche' },
    { id: 'geo', icon: '⬜', label: 'Rectangle' },
    { id: 'eraser', icon: '🧹', label: 'Gomme' },
  ];

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      gap: '12px',
      width: '100%',
    }}>
      {/* Barre d'outils personnalisée */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '8px',
      }}>
        {/* Outils */}
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#f5f5f5',
          padding: '4px',
          borderRadius: '12px',
        }}>
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => selectTool(tool.id)}
              title={tool.label}
              style={{
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                background: currentTool === tool.id ? '#3b82f6' : 'transparent',
                color: currentTool === tool.id ? 'white' : 'inherit',
                transition: 'all 0.15s ease',
              }}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 16px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🗑️ Effacer
          </button>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '8px 20px',
              background: saveStatus === 'success' 
                ? '#22c55e' 
                : saveStatus === 'error' 
                  ? '#ef4444' 
                  : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isSaving ? 'wait' : 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: isSaving ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isSaving ? (
              <>⏳ Enregistrement...</>
            ) : saveStatus === 'success' ? (
              <>✅ Enregistré</>
            ) : saveStatus === 'error' ? (
              <>❌ Erreur</>
            ) : (
              <>💾 Enregistrer le schéma</>
            )}
          </button>
        </div>
      </div>

      {/* Canvas tldraw */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: typeof height === 'number' ? `${height}px` : height,
          borderRadius: '12px',
          overflow: 'hidden',
          border: '2px solid #e5e7eb',
          background: '#fafafa',
        }}
      >
        <Tldraw
          onMount={handleMount}
          inferDarkMode={false}
        />
      </div>

      {/* Instructions */}
      <div style={{
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap',
        fontSize: '12px',
        color: '#888',
      }}>
        <span>✏️ Dessinez le plan du site</span>
        <span>➡️ Ajoutez des flèches pour les mesures</span>
        <span>⬜ Utilisez des rectangles pour les zones</span>
      </div>
    </div>
  );
}
