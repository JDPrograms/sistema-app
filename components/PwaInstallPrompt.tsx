"use client";
import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PwaInstallPrompt({ siteName }: { siteName: string }) {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Register service worker for PWA
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setDismissed(!!sessionStorage.getItem("pwa-dismissed"));

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  // Don't render during SSR or if already installed
  if (!mounted || isInstalled) return null;

  async function handleInstall() {
    if (prompt) {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === "accepted") {
        setDismissed(true);
        sessionStorage.setItem("pwa-dismissed", "1");
        setShowSheet(false);
      }
      setPrompt(null);
    } else {
      setShowSheet(true);
    }
  }

  function handleDismissFab() {
    setDismissed(true);
    sessionStorage.setItem("pwa-dismissed", "1");
    setShowSheet(false);
  }

  return (
    <>
      {/* Floating install button — always visible unless dismissed */}
      {!dismissed && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
          <button
            onClick={handleInstall}
            className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm transition-all">
            <span className="text-base">📲</span>
            Instalar app gratis
          </button>
          <button
            onClick={handleDismissFab}
            className="text-xs text-gray-400 hover:text-gray-600 bg-white/80 px-3 py-1 rounded-full shadow transition-colors">
            No, gracias
          </button>
        </div>
      )}

      {/* Bottom sheet with manual instructions */}
      {showSheet && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSheet(false); }}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-gray-900 text-lg">Instalar {siteName}</p>
              <button
                onClick={() => setShowSheet(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center">
                ×
              </button>
            </div>

            {isIos ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Sigue estos pasos en Safari:</p>
                <div className="space-y-3">
                  {[
                    { n: 1, text: <>Toca el botón <strong>Compartir</strong> <span className="text-lg">⎙</span> en la barra de Safari</> },
                    { n: 2, text: <><strong>Desplázate hacia abajo</strong> y toca "Añadir a pantalla de inicio"</> },
                    { n: 3, text: <>Toca <strong>Añadir</strong> para confirmar</> },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{n}</span>
                      <p className="text-sm text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  Asegúrate de abrir este sitio en <strong>Safari</strong> (no en Chrome ni otro navegador) para ver la opción.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">Sigue estos pasos en Chrome:</p>
                <div className="space-y-3">
                  {[
                    { n: 1, text: <>Toca el menú <strong>⋮</strong> (tres puntos) en la esquina superior derecha</> },
                    { n: 2, text: <>Selecciona <strong>"Añadir a pantalla de inicio"</strong> o <strong>"Instalar app"</strong></> },
                    { n: 3, text: <>Toca <strong>Instalar</strong> para confirmar</> },
                  ].map(({ n, text }) => (
                    <div key={n} className="flex items-start gap-3">
                      <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{n}</span>
                      <p className="text-sm text-gray-700">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowSheet(false)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors">
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
