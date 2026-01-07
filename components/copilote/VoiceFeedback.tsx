'use client';

import React, { useEffect, useState } from 'react';

export type FeedbackType = 'success' | 'error' | 'listening' | 'processing' | 'idle';

interface VoiceFeedbackProps {
  type: FeedbackType;
  message?: string;
  className?: string;
}

const FEEDBACK_CONFIG: Record<FeedbackType, { 
  color: string; 
  bgColor: string; 
  icon: React.ReactNode;
  pulseColor?: string;
}> = {
  success: {
    color: 'text-green-400',
    bgColor: 'bg-green-500/20 border-green-500/30',
    pulseColor: 'bg-green-500',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/20 border-red-500/30',
    pulseColor: 'bg-red-500',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
  },
  listening: {
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20 border-blue-500/30',
    pulseColor: 'bg-blue-500',
    icon: (
      <svg className="w-5 h-5 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    ),
  },
  processing: {
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 border-amber-500/30',
    pulseColor: 'bg-amber-500',
    icon: (
      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
    ),
  },
  idle: {
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10 border-gray-500/20',
    icon: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" x2="12" y1="19" y2="22"/>
      </svg>
    ),
  },
};

export function VoiceFeedback({ type, message, className = '' }: VoiceFeedbackProps) {
  const [isVisible, setIsVisible] = useState(false);
  const config = FEEDBACK_CONFIG[type];

  useEffect(() => {
    if (type !== 'idle') {
      setIsVisible(true);
      
      // Auto-hide pour success et error
      if (type === 'success' || type === 'error') {
        const timer = setTimeout(() => setIsVisible(false), 3000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [type, message]);

  if (!isVisible && type === 'idle') return null;

  return (
    <div 
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300
        ${config.bgColor} ${config.color}
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
        ${className}
      `}
    >
      {/* Pulse indicator */}
      {config.pulseColor && (type === 'listening' || type === 'processing') && (
        <span className="relative flex h-3 w-3">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.pulseColor} opacity-75`} />
          <span className={`relative inline-flex rounded-full h-3 w-3 ${config.pulseColor}`} />
        </span>
      )}
      
      {/* Icon */}
      {config.icon}
      
      {/* Message */}
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </div>
  );
}

/**
 * Toast notification pour les feedbacks temporaires
 */
interface ToastProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export function FeedbackToast({ type, message, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = FEEDBACK_CONFIG[type];

  return (
    <div 
      className={`
        fixed bottom-24 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-5 py-3 rounded-xl border shadow-lg
        ${config.bgColor} ${config.color}
        animate-slide-up
      `}
      style={{
        animation: 'slideUp 0.3s ease-out, fadeOut 0.3s ease-in 2.7s forwards',
      }}
    >
      {config.icon}
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

export default VoiceFeedback;
