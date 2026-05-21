"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "profile" | "password";

export default function ProfilePage() {
  const { slug } = useParams() as { slug: string };
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("profile");

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password form
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/site/${slug}/users/profile`)
      .then((r) => r.json())
      .then((d) => { setName(d.name ?? ""); setPhone(d.phone ?? ""); })
      .catch(() => {});
  }, [slug]);

  async function handleProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileLoading(true);
    const res = await fetch(`/api/site/${slug}/users/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    setProfileLoading(false);
    if (res.ok) {
      setProfileMsg({ type: "ok", text: "Perfil actualizado correctamente." });
      router.refresh();
    } else {
      setProfileMsg({ type: "err", text: data.error || "Error al guardar" });
    }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ type: "err", text: "Las contraseñas no coinciden" });
      return;
    }
    setPwLoading(true);
    const res = await fetch(`/api/site/${slug}/users/change-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (res.ok) {
      setPwMsg({ type: "ok", text: "Contraseña actualizada." });
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } else {
      setPwMsg({ type: "err", text: data.error || "Error al cambiar contraseña" });
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/site/${slug}/portal`} className="text-sm text-gray-400 hover:text-gray-600">
            ← Volver al portal
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi cuenta</h1>

        {/* Tabs */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-white">
          {(["profile", "password"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:text-gray-700"
              }`}>
              {t === "profile" ? "Datos personales" : "Cambiar contraseña"}
            </button>
          ))}
        </div>

        {tab === "profile" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Datos personales</h2>
            <form onSubmit={handleProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tu nombre completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+1 (000) 000-0000" />
              </div>
              {profileMsg && (
                <div className={`px-4 py-3 rounded-lg text-sm border ${
                  profileMsg.type === "ok"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {profileMsg.text}
                </div>
              )}
              <button type="submit" disabled={profileLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {profileLoading ? "Guardando..." : "Guardar cambios"}
              </button>
            </form>
          </div>
        )}

        {tab === "password" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Cambiar contraseña</h2>
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña actual</label>
                <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mín. 8 caracteres, 1 mayúscula, 1 número" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Repite la contraseña" />
              </div>
              {pwMsg && (
                <div className={`px-4 py-3 rounded-lg text-sm border ${
                  pwMsg.type === "ok"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}>
                  {pwMsg.text}
                </div>
              )}
              <button type="submit" disabled={pwLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {pwLoading ? "Actualizando..." : "Cambiar contraseña"}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-4 text-center">
              ¿Iniciaste sesión con código? Puedes crear una contraseña nueva aquí dejando la actual en blanco si es tu primer acceso.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
