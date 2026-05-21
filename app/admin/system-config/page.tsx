"use client";
import { useState, useEffect } from "react";

interface Config { id: string; key: string; value: string; label?: string; group?: string }

const DEFAULT_CONFIGS = [
  { key: "site.defaultModules", label: "Módulos por defecto (JSON)", group: "Sitios", value: "{}" },
  { key: "site.maxUsersPerSite", label: "Máximo usuarios por sitio", group: "Sitios", value: "1000" },
  { key: "ai.defaultProvider", label: "Proveedor IA por defecto", group: "IA", value: "gemini" },
  { key: "ai.maxTokensPerRequest", label: "Tokens máximos por petición IA", group: "IA", value: "2000" },
  { key: "email.senderName", label: "Nombre remitente global", group: "Email", value: "Sistema" },
  { key: "system.maintenanceMode", label: "Modo mantenimiento (true/false)", group: "Sistema", value: "false" },
  { key: "system.registrationEnabled", label: "Registro de sitios habilitado", group: "Sistema", value: "true" },
];

export default function SystemConfigPage() {
  const [configs, setConfigs] = useState<Config[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/system-config");
    if (res.ok) {
      const d = await res.json();
      const map: Record<string, Config> = {};
      d.configs.forEach((c: Config) => { map[c.key] = c; });
      // Merge with defaults
      const merged = DEFAULT_CONFIGS.map((def) => map[def.key] || { ...def, id: "" });
      setConfigs(merged as Config[]);
      const editInit: Record<string, string> = {};
      merged.forEach((c) => { editInit[c.key] = c.value; });
      setEditing(editInit);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(key: string, label?: string, group?: string) {
    setSaving(key);
    const res = await fetch("/api/admin/system-config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: editing[key], label, group }),
    });
    setSaving(null);
    setMsgs((prev) => ({ ...prev, [key]: res.ok ? "Guardado" : "Error" }));
    setTimeout(() => setMsgs((prev) => ({ ...prev, [key]: "" })), 2000);
  }

  // Group configs
  const grouped: Record<string, Config[]> = {};
  configs.forEach((c) => {
    const g = c.group || "General";
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(c);
  });

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Configuración del sistema</h1>

      {Object.entries(grouped).map(([group, items]) => (
        <div key={group} className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">{group}</h2>
          <div className="space-y-4">
            {items.map((c) => (
              <div key={c.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{c.label || c.key}</label>
                <p className="text-xs text-gray-400 font-mono mb-1.5">{c.key}</p>
                <div className="flex gap-2">
                  <input
                    value={editing[c.key] ?? ""}
                    onChange={(e) => setEditing((prev) => ({ ...prev, [c.key]: e.target.value }))}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => handleSave(c.key, c.label, c.group)}
                    disabled={saving === c.key}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {saving === c.key ? "..." : "Guardar"}
                  </button>
                </div>
                {msgs[c.key] && <p className="text-xs text-green-600 mt-1">{msgs[c.key]}</p>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
