"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AdminAppPage() {
  const { slug } = useParams() as { slug: string };
  const [shortName, setShortName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";

  useEffect(() => {
    fetch(`/api/site/${slug}/pwa`).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setShortName(d.pwaShortName || "");
        setPackageName(d.twaPackageName || "");
        setFingerprint(d.twaFingerprint || "");
      }
      setLoading(false);
    });
  }, [slug]);

  async function handleSave() {
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/site/${slug}/pwa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pwaShortName: shortName.trim(), twaPackageName: packageName.trim(), twaFingerprint: fingerprint.trim() }),
    });
    setSaving(false);
    setMsg(res.ok ? { text: "Guardado correctamente", ok: true } : { text: "Error al guardar", ok: false });
    setTimeout(() => setMsg(null), 3000);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">App Android / PWA</h1>
        <p className="text-gray-400 text-sm mt-1">Configura la app instalable de tu sitio</p>
      </div>

      {/* Status */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-green-600 text-lg mt-0.5">✓</span>
        <div>
          <p className="text-sm font-medium text-green-800">PWA activa</p>
          <p className="text-xs text-green-600 mt-0.5">
            Los visitantes que usen Chrome o Edge verán automáticamente un botón para instalar tu sitio como app.
          </p>
        </div>
      </div>

      {/* Manifest URL */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 text-sm">URL del manifest</h2>
        <code className="text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 block text-gray-700 break-all">
          {appUrl}/site/{slug}/manifest.json
        </code>
        <p className="text-xs text-gray-400">Esta URL es la que necesitarás en PWABuilder para generar la app de Android.</p>
      </div>

      {/* Config form */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Configuracion de la app</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre corto</label>
          <input
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            maxLength={12}
            placeholder="Mi negocio"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Aparece bajo el ícono en la pantalla de inicio (máx. 12 caracteres)</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name (Android)</label>
          <input
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder={`com.app.${slug}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">Ejemplo: <span className="font-mono">com.app.{slug}</span> — lo obtienes al generar la app en PWABuilder</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SHA-256 Fingerprint del certificado</label>
          <input
            value={fingerprint}
            onChange={(e) => setFingerprint(e.target.value)}
            placeholder="AA:BB:CC:DD:..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Necesario para que la app de Play Store funcione sin barra del navegador.{" "}
            <span className="font-mono text-gray-500">/.well-known/assetlinks.json?slug={slug}</span>
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          {msg && <span className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Play Store guide */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Guia: subir al Play Store gratis</h2>
          <button
            onClick={() => setGuideOpen((p) => !p)}
            className="text-sm text-blue-600 hover:underline">
            {guideOpen ? "Ocultar" : "Ver guía"}
          </button>
        </div>

        {guideOpen && (
          <div className="text-sm text-gray-700 space-y-3">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
              No necesitas React Native ni programar nada. Tu sitio web ya ES la app.
            </div>

            <ol className="space-y-3 list-decimal list-inside text-sm">
              <li>
                <strong>Genera la app con PWABuilder:</strong> Entra a{" "}
                <span className="font-mono bg-gray-100 px-1 rounded text-xs">pwabuilder.com</span>{" "}
                y pega esta URL:{" "}
                <span className="font-mono bg-gray-100 px-1 rounded text-xs break-all">
                  {appUrl}/site/{slug}
                </span>
              </li>
              <li>
                <strong>Descarga el paquete Android:</strong> PWABuilder genera un archivo <span className="font-mono text-xs bg-gray-100 px-1 rounded">.apk</span> y <span className="font-mono text-xs bg-gray-100 px-1 rounded">.aab</span> listos para Play Store, sin costo.
              </li>
              <li>
                <strong>Anota el Package Name y el fingerprint:</strong> Están en el ZIP descargado (archivo <span className="font-mono text-xs bg-gray-100 px-1 rounded">signing-key-info.txt</span>). Ingrésalos arriba y guarda.
              </li>
              <li>
                <strong>Crea una cuenta de desarrollador en Play Store:</strong> En{" "}
                <span className="font-mono bg-gray-100 px-1 rounded text-xs">play.google.com/console</span>{" "}
                (costo único de $25 USD).
              </li>
              <li>
                <strong>Sube el .aab:</strong> Crea una nueva app, completa los datos básicos y sube el archivo <span className="font-mono text-xs bg-gray-100 px-1 rounded">.aab</span>.
              </li>
              <li>
                <strong>Listo.</strong> Después de revisión de Google (1–3 días), tu app aparece en Play Store.
              </li>
            </ol>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700 space-y-1">
              <p><strong>Importante:</strong> El fingerprint en el campo de arriba es necesario para que la app abra el sitio como experiencia nativa (sin barra del navegador). Si lo dejas vacío, la app funcionará pero mostrará la barra de Chrome.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
