"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt({ siteName }: { siteName: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Register service worker for PWA installability
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    if (sessionStorage.getItem("pwa-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!prompt || dismissed) return null;

  async function handleInstall() {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDismissed(true);
      sessionStorage.setItem("pwa-dismissed", "1");
    }
    setPrompt(null);
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 flex items-center gap-3">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
        📲
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">Instalar {siteName}</p>
        <p className="text-xs text-gray-500 mt-0.5">Accede mas rapido desde tu pantalla de inicio</p>
      </div>
      <div className="flex flex-col gap-1.5 flex-shrink-0">
        <button
          onClick={handleInstall}
          className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 font-medium transition-colors">
          Instalar
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 text-center transition-colors">
          No, gracias
        </button>
      </div>
    </div>
  );
}
