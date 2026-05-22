"use client";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function QrPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [copied, setCopied] = useState(false);

  const siteUrl = typeof window !== "undefined"
    ? `${window.location.origin}/site/${slug}`
    : `/site/${slug}`;

  const qrUrl = `/api/site/${slug}/qr`;

  function copyLink() {
    navigator.clipboard.writeText(siteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadQr() {
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `qr-${slug}.png`;
    a.click();
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Código QR</h1>
      <p className="text-gray-500 mb-8">
        Descarga el QR de tu sitio e imprímelo para que tus clientes accedan directamente.
      </p>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-6">
        {/* QR Image */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <img
            src={qrUrl}
            alt={`QR de ${slug}`}
            className="w-64 h-64"
          />
        </div>

        {/* Site URL */}
        <div className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-2">
          <span className="text-sm text-gray-500 flex-1 truncate font-mono">{siteUrl}</span>
          <button
            onClick={copyLink}
            className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {copied ? "✓ Copiado" : "Copiar"}
          </button>
        </div>

        {/* Download button */}
        <button
          onClick={downloadQr}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar QR (PNG)
        </button>

        <p className="text-xs text-gray-400 text-center">
          400×400 px · Fondo blanco · Ideal para imprimir y pegar en tu negocio
        </p>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <strong>Tip:</strong> Imprime el QR en una hoja A4 o en una tarjeta y pégalo en la entrada de tu local. Tus clientes solo tienen que apuntarlo con la cámara para acceder a tu sitio web.
      </div>
    </div>
  );
}
