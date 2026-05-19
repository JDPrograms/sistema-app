"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const REPO_URL = "https://github.com/JDPrograms/sistema-app";

export default function AdminAppPage() {
  const { slug } = useParams() as { slug: string };
  const [shortName, setShortName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [fingerprint, setFingerprint] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    setAppUrl(window.location.origin);
    fetch(`/api/site/${slug}/pwa`).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        setShortName(d.pwaShortName || "");
        setPackageName(d.twaPackageName || `com.app.${slug}`);
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
    setMsg(res.ok ? { text: "Guardado", ok: true } : { text: "Error al guardar", ok: false });
    setTimeout(() => setMsg(null), 3000);
  }

  const siteUrl = appUrl ? `${appUrl}/site/${slug}` : "";
  const actionsUrl = `${REPO_URL}/actions/workflows/build-apk.yml`;
  const actionsNewUrl = `${REPO_URL}/actions/workflows/build-apk.yml?query=event%3Aworkflow_dispatch`;

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
        <h1 className="text-2xl font-bold text-gray-900">App Android</h1>
        <p className="text-gray-400 text-sm mt-1">Genera la app de Android para tus clientes</p>
      </div>

      {/* Generate APK — main CTA */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <p className="font-bold text-lg">Generar APK automáticamente</p>
            <p className="text-blue-100 text-sm">Gratis con GitHub Actions — sin Android Studio</p>
          </div>
        </div>

        <div className="bg-white/10 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-semibold text-white">Parámetros para la build:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-blue-100 text-xs font-mono">
            <span className="text-white/60">site_slug</span>
            <span>{slug}</span>
            <span className="text-white/60">package_name</span>
            <span className="break-all">{packageName || `com.app.${slug}`}</span>
            <span className="text-white/60">app_name</span>
            <span>{shortName || slug}</span>
            <span className="text-white/60">site_url</span>
            <span className="break-all">{siteUrl}</span>
          </div>
        </div>

        <a
          href={actionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-white text-blue-700 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors text-sm">
          <span>⚡</span>
          Abrir GitHub Actions → Run workflow
        </a>
      </div>

      {/* Step by step */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pasos para generar la app</h2>
          <button onClick={() => setGuideOpen((p) => !p)} className="text-sm text-blue-600 hover:underline">
            {guideOpen ? "Ocultar" : "Ver pasos"}
          </button>
        </div>

        {guideOpen && (
          <ol className="space-y-4 text-sm">
            {[
              {
                n: 1,
                title: "Guarda la configuración (abajo)",
                body: "Asegúrate de tener el nombre corto y el package name correctos antes de generar.",
              },
              {
                n: 2,
                title: 'Abre GitHub Actions',
                body: (
                  <>
                    Ve a{" "}
                    <a href={actionsUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline break-all">
                      {actionsUrl}
                    </a>
                  </>
                ),
              },
              {
                n: 3,
                title: 'Haz clic en "Run workflow"',
                body: "Aparece un botón azul en la esquina derecha. Haz clic y llena los campos con los valores de arriba.",
              },
              {
                n: 4,
                title: "Espera ~5 minutos",
                body: "GitHub Actions descarga las herramientas y genera el APK automáticamente.",
              },
              {
                n: 5,
                title: "Descarga el APK",
                body: 'Al terminar, haz clic en el workflow completado → sección "Artifacts" → descarga el archivo .apk',
              },
              {
                n: 6,
                title: "Copia el Fingerprint",
                body: 'En el log del workflow busca la línea "SHA-256 Fingerprint para assetlinks.json" y copia el valor. Pégalo en el campo de abajo.',
              },
              {
                n: 7,
                title: "Sube a Play Store",
                body: (
                  <>
                    Crea tu app en{" "}
                    <a href="https://play.google.com/console" target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      play.google.com/console
                    </a>{" "}
                    y sube el .aab. Google la revisará en 1–3 días.
                  </>
                ),
              },
            ].map(({ n, title, body }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="bg-blue-100 text-blue-700 rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">{n}</span>
                <div>
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="text-gray-500 mt-0.5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Config */}
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Package Name (Android)</label>
          <input
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            placeholder={`com.app.${slug}`}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">Solo letras, números y puntos. Ej: <span className="font-mono">com.app.{slug}</span></p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SHA-256 Fingerprint <span className="text-gray-400 font-normal">(después del build)</span></label>
          <input
            value={fingerprint}
            onChange={(e) => setFingerprint(e.target.value)}
            placeholder="AA:BB:CC:DD:..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <p className="text-xs text-gray-400 mt-1">
            Necesario para que la app abra sin barra del navegador.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          {msg && <span className={`text-sm ${msg.ok ? "text-green-600" : "text-red-600"}`}>{msg.text}</span>}
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Guardando..." : "Guardar configuracion"}
          </button>
        </div>
      </div>

      {/* Test on mobile */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-medium text-green-800 mb-1">Probar la app en tu celular ahora</p>
        <p className="text-xs text-green-600 mb-3">Sin esperar el APK, puedes probar la experiencia de app instalando desde el navegador:</p>
        <a
          href={`/site/${slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-xs bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium transition-colors">
          Abrir sitio público ↗
        </a>
      </div>
    </div>
  );
}
