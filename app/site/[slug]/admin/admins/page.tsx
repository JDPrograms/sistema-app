"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SITEADMIN_PERMS } from "@/lib/permissions";

type PermKey = keyof typeof SITEADMIN_PERMS;

interface Admin {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
  permissions: string;
  createdAt: string;
}

const EMPTY_PERMS = Object.fromEntries(
  Object.keys(SITEADMIN_PERMS).map((k) => [k, false])
) as Record<PermKey, boolean>;

function parsePerms(json: string): Record<PermKey, boolean> {
  try { return { ...EMPTY_PERMS, ...JSON.parse(json || "{}") }; }
  catch { return { ...EMPTY_PERMS }; }
}

export default function SiteAdminsPage() {
  const { slug } = useParams() as { slug: string };
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [perms, setPerms] = useState<Record<PermKey, boolean>>({ ...EMPTY_PERMS });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const r = await fetch(`/api/site/${slug}/admins`);
    if (r.ok) setAdmins(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  function startEdit(a: Admin) {
    setEditingId(a.id);
    setForm({ name: a.name, email: a.email, password: "" });
    setPerms(parsePerms(a.permissions));
    setShowForm(false);
    setError("");
  }

  function startNew() {
    setEditingId(null);
    setForm({ name: "", email: "", password: "" });
    setPerms({ ...EMPTY_PERMS });
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    if (editingId) {
      const body: any = { permissions: perms };
      if (form.name) body.name = form.name;
      if (form.password) body.password = form.password;
      const r = await fetch(`/api/site/${slug}/admins/${editingId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const data = await r.json();
      if (r.ok) {
        setAdmins((p) => p.map((a) => a.id === editingId ? data : a));
        setEditingId(null);
      } else { setError(data.error || "Error al guardar"); }
    } else {
      const r = await fetch(`/api/site/${slug}/admins`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, permissions: perms }),
      });
      const data = await r.json();
      if (r.ok) {
        setAdmins((p) => [...p, data]);
        setShowForm(false);
      } else { setError(data.error || "Error al crear"); }
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Eliminar admin "${name}"? Esta acción no se puede deshacer.`)) return;
    const r = await fetch(`/api/site/${slug}/admins/${id}`, { method: "DELETE" });
    if (r.ok) setAdmins((p) => p.filter((a) => a.id !== id));
    else { const d = await r.json(); alert(d.error || "Error al eliminar"); }
  }

  const isEditing = editingId !== null;
  const showPanel = showForm || isEditing;

  return (
    <div className="p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administradores del sitio</h1>
          <p className="text-gray-500 mt-1">{admins.length} admin(s) registrado(s)</p>
        </div>
        <button
          onClick={startNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors"
        >
          + Nuevo admin
        </button>
      </div>

      {showPanel && (
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-5">
          <h2 className="font-semibold text-gray-900">{isEditing ? "Editar admin" : "Nuevo admin"}</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required={!isEditing} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {!isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {isEditing ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña"}
              </label>
              <input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required={!isEditing} minLength={isEditing ? 0 : 6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Permisos</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.entries(SITEADMIN_PERMS) as [PermKey, string][]).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!perms[key]}
                    onChange={(e) => setPerms((p) => ({ ...p, [key]: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors">
              {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear admin"}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); setError(""); }}
              className="px-5 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : admins.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay admins registrados.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {admins.map((a) => {
              const p = parsePerms(a.permissions);
              const activePerms = a.isOwner
                ? Object.values(SITEADMIN_PERMS)
                : (Object.entries(SITEADMIN_PERMS) as [PermKey, string][])
                    .filter(([k]) => p[k]).map(([, v]) => v);
              return (
                <div key={a.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: a.isOwner ? "#2563eb" : "#6b7280" }}>
                        {a.name[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{a.name}</p>
                          {a.isOwner && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Propietario</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate">{a.email}</p>
                      </div>
                    </div>
                    {!a.isOwner && (
                      <div className="flex gap-3 flex-shrink-0">
                        <button onClick={() => startEdit(a)}
                          className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium">
                          Editar
                        </button>
                        <button onClick={() => handleDelete(a.id, a.name)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors">
                          Eliminar
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {activePerms.length === 0 ? (
                      <span className="text-xs text-gray-400">Sin permisos asignados</span>
                    ) : (
                      activePerms.map((label) => (
                        <span key={label} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                          {label}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
