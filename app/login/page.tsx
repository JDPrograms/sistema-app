"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type Step = "credentials" | "mfa";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/auth/pre-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.valid) {
      setError("Credenciales incorrectas");
      return;
    }
    if (data.mfaRequired) {
      setStep("mfa");
    } else {
      await doSignIn();
    }
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await doSignIn(otp);
  }

  async function doSignIn(otpCode?: string) {
    const res = await signIn("superadmin", {
      email,
      password,
      otp: otpCode ?? "",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Código MFA incorrecto");
    } else {
      router.push("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sistema de Sistemas</h1>
          <p className="text-gray-500 mt-1">Panel de Super Administrador</p>
        </div>

        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@sistema.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verificando..." : "Continuar"}
            </button>
          </form>
        )}

        {step === "mfa" && (
          <form onSubmit={handleMfa} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <p className="text-sm text-gray-600">Ingresa el código de tu aplicación de autenticación</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código MFA</label>
              <input
                type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required maxLength={6} autoFocus autoComplete="one-time-code"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <button type="submit" disabled={loading || otp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button type="button" onClick={() => { setStep("credentials"); setOtp(""); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Volver
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
