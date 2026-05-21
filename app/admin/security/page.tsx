"use client";
import { useState, useEffect } from "react";
import { useFormValidation, required, minLength } from "@/hooks/useFormValidation";

type MfaStatus = "loading" | "disabled" | "setup" | "verify" | "enabled" | "disabling";

async function safeJson(res: Response, fallback: any) {
  try { return await res.json(); } catch { return fallback; }
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

type PwdValues = { current: string; next: string; confirm: string };

function validateNewPassword(value: string): string | undefined {
  if (!value) return "Este campo es requerido";
  if (value.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(value)) return "Debe incluir al menos una mayúscula";
  if (!/[0-9]/.test(value)) return "Debe incluir al menos un número";
  return undefined;
}

const PWD_RULES = {
  current: [required("Ingresa tu contraseña actual")],
  next: [(v: string) => validateNewPassword(v)],
  confirm: [
    required("Confirma la nueva contraseña"),
    (v: string, all: Record<string, unknown>) =>
      v !== (all as PwdValues).next ? "Las contraseñas no coinciden" : undefined,
  ],
};

function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const checks = [
    { label: "8+ caracteres", ok: value.length >= 8 },
    { label: "Mayúscula", ok: /[A-Z]/.test(value) },
    { label: "Número", ok: /[0-9]/.test(value) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ["bg-red-400", "bg-amber-400", "bg-lime-400", "bg-green-500"];
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-gray-200 dark:bg-slate-600"}`} />
        ))}
      </div>
      <div className="flex gap-3">
        {checks.map((c) => (
          <span key={c.label} className={`text-xs ${c.ok ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-slate-500"}`}>
            {c.ok ? "✓" : "○"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SecurityPage() {
  // ── MFA ───────────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<MfaStatus>("loading");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSaving, setMfaSaving] = useState(false);
  const [mfaSuccess, setMfaSuccess] = useState("");

  // ── Password change ───────────────────────────────────────────────────────
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdServerError, setPwdServerError] = useState("");
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });

  const { values: pwd, errors: pwdErrors, setValue: setPwd, handleBlur: pwdBlur, validate: pwdValidate, reset: pwdReset } =
    useFormValidation<PwdValues>({ current: "", next: "", confirm: "" }, PWD_RULES as any);

  useEffect(() => {
    fetch("/api/admin/mfa")
      .then((r) => r.ok ? r.json() : { mfaEnabled: false })
      .then((d) => setStatus(d.mfaEnabled ? "enabled" : "disabled"))
      .catch(() => setStatus("disabled"));
  }, []);

  async function startSetup() {
    setMfaError("");
    const res = await fetch("/api/admin/mfa/setup");
    const data = await res.json();
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStatus("setup");
  }

  async function verifyAndEnable(e: React.FormEvent) {
    e.preventDefault();
    setMfaError("");
    setMfaSaving(true);
    const res = await fetch("/api/admin/mfa/enable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, secret }),
    });
    setMfaSaving(false);
    if (res.ok) {
      setStatus("enabled");
      setCode("");
      setMfaSuccess("MFA activado correctamente. Se pedirá a partir del próximo inicio de sesión.");
    } else {
      const d = await safeJson(res, {});
      setMfaError(d.error || `Error al verificar (${res.status})`);
    }
  }

  async function disableMfa(e: React.FormEvent) {
    e.preventDefault();
    setMfaError("");
    setMfaSaving(true);
    const res = await fetch("/api/admin/mfa/disable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setMfaSaving(false);
    if (res.ok) {
      setStatus("disabled");
      setCode("");
      setMfaSuccess("MFA desactivado.");
    } else {
      const d = await safeJson(res, {});
      setMfaError(d.error || `Error al desactivar (${res.status})`);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdServerError("");
    setPwdSuccess("");
    if (!pwdValidate()) return;
    setPwdSaving(true);
    const res = await fetch("/api/admin/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pwd.current, newPassword: pwd.next }),
    });
    setPwdSaving(false);
    if (res.ok) {
      setPwdSuccess("Contraseña actualizada correctamente.");
      pwdReset();
    } else {
      const d = await safeJson(res, {});
      setPwdServerError(d.error || "Error al cambiar la contraseña.");
    }
  }

  const inputBase = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 transition-colors";

  function PwdField({
    field, label, placeholder,
  }: { field: keyof PwdValues; label: string; placeholder?: string }) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{label}</label>
        <div className="relative">
          <input
            type={showPwd[field] ? "text" : "password"}
            value={pwd[field]}
            onChange={(e) => setPwd(field, e.target.value)}
            onBlur={() => pwdBlur(field)}
            placeholder={placeholder}
            autoComplete={field === "current" ? "current-password" : "new-password"}
            className={`${inputBase} pr-10 ${pwdErrors[field] ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-slate-600"}`}
          />
          <button
            type="button"
            onClick={() => setShowPwd((prev) => ({ ...prev, [field]: !prev[field] }))}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            tabIndex={-1}
          >
            <EyeIcon open={showPwd[field]} />
          </button>
        </div>
        {field === "next" && <PasswordStrength value={pwd.next} />}
        {pwdErrors[field] && (
          <p className="text-xs text-red-500 mt-1">{pwdErrors[field]}</p>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100">Seguridad</h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1 text-sm">Gestiona tu contraseña y autenticación de dos factores.</p>
      </div>

      {/* ── CAMBIAR CONTRASEÑA ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl flex items-center justify-center text-xl">🔑</div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-slate-100">Cambiar contraseña</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Actualiza tu contraseña de acceso al panel</p>
          </div>
        </div>

        {pwdSuccess && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
            ✓ {pwdSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <PwdField field="current" label="Contraseña actual" placeholder="••••••••" />
          <PwdField field="next" label="Nueva contraseña" placeholder="••••••••" />
          <PwdField field="confirm" label="Confirmar nueva contraseña" placeholder="••••••••" />

          {pwdServerError && (
            <p className="text-sm text-red-600 dark:text-red-400">{pwdServerError}</p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={pwdSaving}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {pwdSaving ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </div>
        </form>
      </div>

      {/* ── MFA ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/40 rounded-xl flex items-center justify-center text-xl">🔐</div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-slate-100">Autenticación de dos factores (MFA)</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Requiere un código de tu app de autenticación al iniciar sesión</p>
            </div>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            status === "enabled"
              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
              : "bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400"
          }`}>
            {status === "loading" ? "..." : status === "enabled" ? "Activado" : "Desactivado"}
          </span>
        </div>

        {mfaSuccess && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg text-sm">
            {mfaSuccess}
          </div>
        )}

        {status === "loading" && (
          <p className="text-sm text-gray-400 dark:text-slate-500">Cargando...</p>
        )}

        {status === "disabled" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
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
            <p className="text-sm text-gray-600 dark:text-slate-300">
              1. Escanea este código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.)
            </p>
            {qrDataUrl && (
              <div className="flex justify-center">
                <img src={qrDataUrl} alt="QR MFA" className="w-48 h-48 border border-gray-200 dark:border-slate-600 rounded-xl p-2 bg-white" />
              </div>
            )}
            <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3 border border-dashed border-gray-300 dark:border-slate-500">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">O ingresa este código manualmente:</p>
              <code className="text-sm font-mono text-gray-800 dark:text-slate-200 break-all">{secret}</code>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300">
              2. Ingresa el código de 6 dígitos que muestra la app para confirmar la configuración:
            </p>
            <form onSubmit={verifyAndEnable} className="flex gap-2">
              <input
                type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6} placeholder="000000"
                className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
              <button type="submit" disabled={mfaSaving || code.length < 6}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {mfaSaving ? "Verificando..." : "Activar"}
              </button>
            </form>
            {mfaError && <p className="text-sm text-red-600 dark:text-red-400">{mfaError}</p>}
            <button onClick={() => { setStatus("disabled"); setCode(""); setMfaError(""); }}
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
              Cancelar
            </button>
          </div>
        )}

        {status === "enabled" && (
          <div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">
              MFA está activo. Se te pedirá un código de autenticación cada vez que inicies sesión.
            </p>
            <button onClick={() => { setStatus("disabling"); setCode(""); setMfaError(""); }}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-700 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
              Desactivar MFA
            </button>
          </div>
        )}

        {status === "disabling" && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-slate-300">Para confirmar, ingresa el código actual de tu app de autenticación:</p>
            <form onSubmit={disableMfa} className="flex gap-2">
              <input
                type="text" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                maxLength={6} placeholder="000000" autoFocus
                className="flex-1 border border-gray-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-red-400 bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100"
              />
              <button type="submit" disabled={mfaSaving || code.length < 6}
                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {mfaSaving ? "Verificando..." : "Confirmar"}
              </button>
            </form>
            {mfaError && <p className="text-sm text-red-600 dark:text-red-400">{mfaError}</p>}
            <button onClick={() => { setStatus("enabled"); setCode(""); setMfaError(""); }}
              className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
