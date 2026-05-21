"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/admin/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al restablecer la contraseña");
    } else {
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600 text-sm">Enlace inválido.</p>
        <Link href="/admin/auth/forgot-password" className="text-blue-600 hover:underline text-sm mt-2 block">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  return done ? (
    <div className="text-center space-y-3">
      <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl text-sm">
        Contraseña actualizada. Redirigiendo...
      </div>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoFocus
          minLength={8}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Mínimo 8 caracteres, 1 mayúscula, 1 número"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
        <input
          type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Repite la contraseña"
        />
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
        {loading ? "Guardando..." : "Guardar contraseña"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔒</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva contraseña</h1>
          <p className="text-gray-500 mt-1 text-sm">Elige una contraseña segura</p>
        </div>
        <Suspense fallback={<p className="text-sm text-gray-400 text-center">Cargando...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
