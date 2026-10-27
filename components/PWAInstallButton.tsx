'use client';

import { useEffect, useState } from 'react';
import { FiDownload, FiX } from 'react-icons/fi';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'default' | 'prominent' | 'compact';
  title?: string;
  description?: string;
  buttonText?: string;
}

export default function PWAInstallButton({
  className = '',
  variant = 'default',
  title,
  description,
  buttonText,
}: PWAInstallButtonProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user has previously dismissed the install prompt
    const hasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasDismissed) {
      setDismissed(true);
    }

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstallButton(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showInstallButton || dismissed) {
    return null;
  }

  if (variant === 'prominent') {
    return (
      <div className={`relative bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-400 rounded-lg p-6 shadow-lg ${className}`}>
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-white hover:text-blue-200 transition-colors"
          aria-label="Dismiss"
        >
          <FiX className="w-5 h-5" />
        </button>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-white mb-2">
              {title || 'Install Our App'}
            </h3>
            <p className="text-blue-100">
              {description || 'Get instant updates and easy access to your orders!'}
            </p>
          </div>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors whitespace-nowrap shadow-lg transform hover:scale-105"
          >
            <FiDownload className="w-5 h-5" />
            {buttonText || 'Install App'}
          </button>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 ${className}`}>
        <button
          onClick={handleDismiss}
          className="text-blue-600 hover:text-blue-800 transition-colors"
          aria-label="Dismiss"
        >
          <FiX className="w-4 h-4" />
        </button>
        <span className="text-sm text-blue-800 flex-1">{title || 'Install our app for better experience'}</span>
        <button
          onClick={handleInstallClick}
          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <FiDownload className="w-3 h-3" />
          {buttonText || 'Install'}
        </button>
      </div>
    );
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-blue-900 mb-1">{title || 'Install Our App'}</h4>
          <p className="text-sm text-blue-700">{description || 'Get faster access and exclusive features'}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Dismiss"
          >
            <FiX className="w-4 h-4" />
          </button>
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <FiDownload className="w-4 h-4" />
            {buttonText || 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
