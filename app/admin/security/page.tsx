"use client";
import { useState, useEffect } from "react";

type MfaStatus = "loading" | "disabled" | "setup" | "verify" | "enabled" | "disabling";

export default function SecurityPage() {
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/admin/mfa")
      .then((r) => r.json())
      .then((d) => setStatus(d.mfaEnabled ? "enabled" : "disabled"));
  }, []);

  async function startSetup() {
    setError("");
    const res = await fetch("/api/admin/mfa/setup");
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStatus("setup");
  }

  async function verifyAndEnable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/mfa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, secret }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus("enabled");
      setCode("");
      setSuccess("MFA activado correctamente. Se pedirá a partir del próximo inicio de sesión.");
    } else {
      const d = await res.json();
      setError(d.error || "Error al verificar");
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/admin/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus("disabled");
      setCode("");
      setSuccess("MFA desactivado.");
    } else {
      const d = await res.json();
      setError(d.error || "Error al desactivar");
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Seguridad</h1>
      <p className="text-gray-500 mb-8 text-sm">Configura la autenticación de dos factores para tu cuenta.</p>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* MFA Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">🔐</div>
            <div>
              <h2 className="font-semibold text-gray-900">Autenticación de dos factores (MFA)</h2>
              <p className="text-xs text-gray-500 mt-0.5">Requiere un código de tu app de autenticación al iniciar sesión</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            status === "enabled" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {status === "loading" ? "..." : status === "enabled" ? "Activado" : "Desactivado"}
          </span>
        </div>

        {status === "loading" && (
          <p className="text-sm text-gray-400">Cargando...</p>
        )}

        {status === "disabled" && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Al activar MFA, necesitarás escanear un código QR con una app como Google Authenticator o Authy.
            </p>
            <button onClick={startSetup}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
              Activar MFA
            </button>
          </div>
        )}

        {status === "setup" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
            </p>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR MFA" className="w-48 h-48 border border-gray-200 rounded-xl p-2" />
              </div>
            )}
            <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
              <p className="text-xs text-gray-500 mb-1">O ingresa este código manualmente:</p>
              <code className="text-sm font-mono text-gray-800 break-all">{secret}</code>
            </div>
            <p className="text-sm text-gray-600">
              2. Ingresa el código de 6 dígitos que muestra la app para confirmar la configuración:
            </p>
            <form onSubmit={verifyAndEnable} className="flex gap-2">
              <input
                type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6} placeholder="000000"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button type="submit" disabled={saving || code.length < 6}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? "Verificando..." : "Activar"}
              </button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={() => { setStatus("disabled"); setCode(""); setError(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Cancelar
            </button>
          </div>
        )}

        {status === "enabled" && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              MFA está activo. Se te pedirá un código de autenticación cada vez que inicies sesión.
            </p>
            <button onClick={() => { setStatus("disabling"); setCode(""); setError(""); }}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 text-sm font-medium rounded-lg hover:bg-red-100 transition-colors">
              Desactivar MFA
            </button>
          </div>
        )}

        {status === "disabling" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Para confirmar, ingresa el código actual de tu app de autenticación:</p>
            <form onSubmit={disableMfa} className="flex gap-2">
              <input
                type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6} placeholder="000000" autoFocus
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <button type="submit" disabled={saving || code.length < 6}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {saving ? "Verificando..." : "Confirmar"}
              </button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={() => { setStatus("enabled"); setCode(""); setError(""); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
