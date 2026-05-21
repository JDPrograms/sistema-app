"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";

type AdminStep = "credentials" | "mfa" | "forgot" | "forgot-sent";
type UserStep = "credentials" | "otp-send" | "otp-verify";

export default function SiteLoginPage() {
  const { slug } = useParams() as { slug: string };
  const searchParams = useSearchParams();
  const router = useRouter();

  const [tab, setTab] = useState<"admin" | "user">("admin");

  // --- Admin state ---
  const [adminStep, setAdminStep] = useState<AdminStep>("credentials");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminOtp, setAdminOtp] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");

  // --- User state ---
  const [userStep, setUserStep] = useState<UserStep>("credentials");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState(""); // email used for OTP flow

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const verified = searchParams.get("verified") === "1";
  const googleError = searchParams.get("error") === "google" || searchParams.get("error") === "no_admin";

  // ── ADMIN FLOW ─────────────────────────────────────────────────────
  async function handleAdminCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/admins/auth/pre-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.valid) {
      setError(res.status === 429 ? "Demasiados intentos. Espera un minuto." : "Credenciales incorrectas");
      return;
    }
    if (data.mfaRequired) {
      setAdminStep("mfa");
    } else {
      await doAdminSignIn();
    }
  }

  async function handleAdminMfa(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    await doAdminSignIn(adminOtp);
  }

  async function doAdminSignIn(otp?: string) {
    const res = await signIn("siteadmin", {
      email: adminEmail,
      password: adminPassword,
      siteSlug: slug,
      otp: otp ?? "",
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(otp ? "Código MFA incorrecto" : "Credenciales incorrectas");
    } else {
      router.push(`/site/${slug}/admin`);
    }
  }

  async function handleAdminForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch(`/api/site/${slug}/admins/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    setLoading(false);
    setAdminStep("forgot-sent");
  }

  // ── USER FLOW ──────────────────────────────────────────────────────
  async function handleUserCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("siteuser", { email: userEmail, password: userPassword, siteSlug: slug, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales incorrectas o cuenta no verificada. Revisa tu correo.");
    } else {
      router.push(`/site/${slug}/portal`);
    }
  }

  async function handleOtpSend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/users/email-otp/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmail }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al enviar el código");
      return;
    }
    setUserStep("otp-verify");
    setOtpCode("");
    setError("");
  }

  async function handleOtpVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/users/email-otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: otpEmail, code: otpCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      setLoading(false);
      setError(data.error || "Código incorrecto");
      return;
    }
    const signInRes = await signIn("google-siteuser", { token: data.token, siteSlug: slug, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      setError("Error al iniciar sesión");
    } else {
      router.push(`/site/${slug}/portal`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="mb-6">
          <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600">&#8592; Volver al sitio</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3">Iniciar sesión</h1>
          <p className="text-gray-500 text-sm mt-1">Acceso a <span className="font-medium">{slug}</span></p>
        </div>

        {verified && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm font-medium">
            ✅ Cuenta verificada. Ahora puedes iniciar sesión.
          </div>
        )}
        {googleError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {searchParams.get("error") === "no_admin"
              ? "No existe una cuenta de administrador con ese correo."
              : "Error al iniciar sesión. Intenta de nuevo."}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
          <button onClick={() => { setTab("admin"); setError(""); setAdminStep("credentials"); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === "admin" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Administrador
          </button>
          <button onClick={() => { setTab("user"); setError(""); setUserStep("credentials"); }}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === "user" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Usuario
          </button>
        </div>

        {/* ── ADMIN FORMS ── */}
        {tab === "admin" && adminStep === "credentials" && (
          <form onSubmit={handleAdminCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} required autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verificando..." : "Continuar"}
            </button>
            <div className="text-center">
              <button type="button" onClick={() => { setAdminStep("forgot"); setForgotEmail(adminEmail); setError(""); }}
                className="text-sm text-gray-400 hover:text-blue-600 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
        )}

        {tab === "admin" && adminStep === "mfa" && (
          <form onSubmit={handleAdminMfa} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">🔐</span>
              </div>
              <p className="text-sm text-gray-600">Ingresa el código de tu aplicación de autenticación</p>
            </div>
            <input
              type="text" value={adminOtp} onChange={(e) => setAdminOtp(e.target.value.replace(/\D/g, ""))}
              required maxLength={6} autoFocus autoComplete="one-time-code"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
            />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading || adminOtp.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verificando..." : "Verificar"}
            </button>
            <button type="button" onClick={() => { setAdminStep("credentials"); setAdminOtp(""); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Volver
            </button>
          </form>
        )}

        {tab === "admin" && adminStep === "forgot" && (
          <form onSubmit={handleAdminForgot} className="space-y-4">
            <p className="text-sm text-gray-600">Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="correo@ejemplo.com" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Enviando..." : "Enviar enlace"}
            </button>
            <button type="button" onClick={() => { setAdminStep("credentials"); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Volver
            </button>
          </form>
        )}

        {tab === "admin" && adminStep === "forgot-sent" && (
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm">
              Si el correo está registrado, recibirás las instrucciones en breve. Revisa también tu carpeta de spam.
            </div>
            <button onClick={() => { setAdminStep("credentials"); setError(""); }}
              className="text-sm text-blue-600 hover:underline">
              ← Volver al inicio de sesión
            </button>
          </div>
        )}

        {/* ── USER FORMS ── */}
        {tab === "user" && userStep === "credentials" && (
          <div className="space-y-5">
            {/* Email OTP option */}
            <div>
              <p className="text-xs text-gray-500 font-medium mb-2">Acceso con código por email</p>
              <button type="button"
                onClick={() => { setUserStep("otp-send"); setOtpEmail(""); setOtpCode(""); setError(""); }}
                className="flex items-center justify-center gap-3 w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-lg">✉️</span>
                Continuar con código por email
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-gray-400">o con contraseña</span></div>
            </div>
            <form onSubmit={handleUserCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="correo@ejemplo.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <input type="password" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {loading ? "Entrando..." : "Entrar"}
              </button>
            </form>
            <p className="text-center text-sm text-gray-500">
              ¿No tienes cuenta?{" "}
              <Link href={`/site/${slug}/portal/register`} className="text-blue-600 hover:underline font-medium">
                Regístrate gratis
              </Link>
            </p>
          </div>
        )}

        {tab === "user" && userStep === "otp-send" && (
          <form onSubmit={handleOtpSend} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✉️</span>
              </div>
              <p className="text-sm text-gray-600">Ingresa tu email y te enviaremos un código de 6 dígitos</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={otpEmail} onChange={(e) => setOtpEmail(e.target.value)} required autoFocus
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu@gmail.com" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Enviando..." : "Enviar código"}
            </button>
            <button type="button" onClick={() => { setUserStep("credentials"); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
              ← Volver
            </button>
          </form>
        )}

        {tab === "user" && userStep === "otp-verify" && (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div className="text-center mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">📩</span>
              </div>
              <p className="text-sm text-gray-600">
                Enviamos un código a <strong>{otpEmail}</strong>. Ingresa el código de 6 dígitos.
              </p>
            </div>
            <input
              type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              required maxLength={6} autoFocus autoComplete="one-time-code"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest font-mono"
              placeholder="000000"
            />
            {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <button type="submit" disabled={loading || otpCode.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? "Verificando..." : "Verificar código"}
            </button>
            <button type="button" onClick={() => { setUserStep("otp-send"); setOtpCode(""); setError(""); }}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Reenviar código
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
