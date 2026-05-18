"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function SiteLoginPage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [tab, setTab] = useState<"admin" | "user">("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const provider = tab === "admin" ? "siteadmin" : "siteuser";
    const res = await signIn(provider, { email, password, siteSlug: slug, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales incorrectas");
    } else {
      router.push(tab === "admin" ? `/site/${slug}/admin` : `/site/${slug}/portal`);
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

        <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
          <button onClick={() => setTab("admin")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === "admin" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Administrador
          </button>
          <button onClick={() => setTab("user")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${tab === "user" ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"}`}>
            Usuario
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="correo@ejemplo.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {tab === "user" && (
          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{" "}
            <Link href={`/site/${slug}/portal/register`} className="text-blue-600 hover:underline font-medium">
              Regístrate gratis
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
