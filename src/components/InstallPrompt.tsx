import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    }

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  }

  function handleDismiss() {
    setVisible(false);
    setDismissed(true);
  }

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 z-30 animate-fadeIn">
      <div className="flex items-center gap-3 bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl pl-4 pr-2 py-2.5 max-w-[calc(100vw-2rem)]">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shrink-0">
          <Download size={18} className="text-black" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white leading-tight">Installer PhotoStory</p>
          <p className="text-xs text-neutral-400 leading-tight">Acces rapide depuis votre ecran d'accueil</p>
        </div>
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-all shrink-0 active:scale-95"
        >
          Installer
        </button>
        <button
          onClick={handleDismiss}
          className="p-1.5 text-neutral-500 hover:text-white rounded-lg transition-all shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
