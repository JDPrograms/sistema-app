"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt({ siteName }: { siteName: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Already installed (standalone mode)
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));

    if (sessionStorage.getItem("pwa-dismissed")) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Don't show if already installed
  if (isInstalled) return null;
  // Don't show if user dismissed
  if (dismissed) return null;

  async function handleInstall() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted" || outcome === "dismissed") {
        setDismissed(true);
        sessionStorage.setItem("pwa-dismissed", "1");
      }
      setPrompt(null);
    } else {
      // No browser prompt available — show manual instructions
      setShowInstructions(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
    setShowInstructions(false);
  }

  return (
    <>
      {/* Bottom install bar — always visible */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 text-lg">
          📲
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">Instalar {siteName}</p>
          <p className="text-xs text-gray-500">Accede más rápido desde tu pantalla de inicio</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors">
            No, gracias
          </button>
          <button
            onClick={handleInstall}
            className="text-xs bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 font-semibold transition-colors">
            Instalar
          </button>
        </div>
      </div>

      {/* Extra space so content isn't hidden behind the bar */}
      <div className="h-16" />

      {/* Instructions modal (when browser prompt not available) */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-900">Cómo instalar la app</p>
              <button onClick={() => setShowInstructions(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {isIos ? (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">En iPhone / iPad (Safari)</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <p>Toca el botón <strong>Compartir</strong> <span className="text-lg">⎙</span> en la barra de Safari</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <p>Toca <strong>Añadir</strong></p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">En Android (Chrome)</p>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <p>Toca el menú <strong>⋮</strong> en la esquina superior derecha de Chrome</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <p>Selecciona <strong>"Añadir a pantalla de inicio"</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <p>Toca <strong>Añadir</strong></p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
