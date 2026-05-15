"use client";
import { useEffect, useState } from "react";

interface Provider { id: string; name: string; label: string; hasKey: boolean; isActive: boolean; priority: number }
interface Agent { id: string; name: string; description?: string; systemPrompt: string; preferredProvider?: string; isGlobal: boolean; isActive: boolean; siteId?: string; site?: { name: string; slug: string } }

const PROVIDER_INFO: Record<string, { icon: string; desc: string; link: string }> = {
  gemini: { icon: "✨", desc: "Google Gemini 1.5 Flash — 15 req/min, 1M tokens/dia gratis", link: "https://aistudio.google.com/apikey" },
  groq: { icon: "⚡", desc: "Groq — Llama 3 y Mixtral, 14,400 req/dia gratis", link: "https://console.groq.com/keys" },
};

const DEFAULT_PROVIDERS = [
  { name: "gemini", label: "Google Gemini", priority: 0 },
  { name: "groq", label: "Groq", priority: 1 },
];

export default function AdminAiPage() {
  const [tab, setTab] = useState<"providers" | "agents">("providers");
  const [providers, setProviders] = useState<Provider[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const [agentForm, setAgentForm] = useState({ name: "", description: "", systemPrompt: "", preferredProvider: "", isGlobal: true });
  const [savingAgent, setSavingAgent] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  async function loadAll() {
    setLoading(true);
    const [pRes, aRes] = await Promise.all([
      fetch("/api/admin/ai/providers"),
      fetch("/api/admin/ai/agents"),
    ]);
    if (pRes.ok) setProviders(await pRes.json());
    if (aRes.ok) setAgents(await aRes.json());
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function saveProvider(p: { name: string; label: string; priority: number }, key: string, isActive: boolean) {
    setSaving(p.name);
    setMsg("");
    const res = await fetch("/api/admin/ai/providers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: p.name, label: p.label, apiKey: key, isActive, priority: p.priority }),
    });
    setSaving(null);
    if (res.ok) {
      setMsg("Guardado");
      loadAll();
      setEditKey((prev) => ({ ...prev, [p.name]: "" }));
      setTimeout(() => setMsg(""), 2000);
    }
  }

  async function toggleActive(provider: Provider) {
    const res = await fetch(`/api/admin/ai/providers/${provider.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !provider.isActive }),
    });
    if (res.ok) loadAll();
  }

  async function createAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!agentForm.name.trim() || !agentForm.systemPrompt.trim()) return;
    setSavingAgent(true);
    const res = await fetch("/api/admin/ai/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(agentForm),
    });
    setSavingAgent(false);
    if (res.ok) {
      setAgentForm({ name: "", description: "", systemPrompt: "", preferredProvider: "", isGlobal: true });
      loadAll();
    }
  }

  async function updateAgent(id: string, data: Partial<Agent>) {
    const res = await fetch(`/api/admin/ai/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) { setEditingAgent(null); loadAll(); }
  }

  async function deleteAgent(id: string) {
    if (!confirm("Eliminar este agente?")) return;
    await fetch(`/api/admin/ai/agents/${id}`, { method: "DELETE" });
    loadAll();
  }

  const globalAgents = agents.filter((a) => a.isGlobal);
  const siteAgents = agents.filter((a) => !a.isGlobal);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inteligencia Artificial</h1>
        <p className="text-gray-500 mt-1">Configura proveedores y crea agentes IA para los sitios</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(["providers", "agents"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {t === "providers" ? "Proveedores" : "Agentes IA"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : tab === "providers" ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 bg-blue-50 border border-blue-200 rounded-xl p-4">
            Configura las API keys de los proveedores. El sistema usara el de mayor prioridad (menor numero) y cambiara automaticamente al siguiente si alcanza el limite gratuito.
          </p>
          {DEFAULT_PROVIDERS.map((dp) => {
            const existing = providers.find((p) => p.name === dp.name);
            const info = PROVIDER_INFO[dp.name];
            return (
              <div key={dp.name} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{info.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900">{dp.label}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${existing?.isActive ? "bg-green-100 text-green-700" : existing?.hasKey ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                          {existing?.isActive ? "Activo" : existing?.hasKey ? "Inactivo" : "Sin configurar"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-0.5">{info.desc}</p>
                    </div>
                  </div>
                  {existing && (
                    <button onClick={() => toggleActive(existing)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${existing.isActive ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"}`}>
                      {existing.isActive ? "Desactivar" : "Activar"}
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      API Key {existing?.hasKey ? "(ya guardada — deja en blanco para no cambiar)" : ""}
                      {" · "}
                      <a href={info.link} target="_blank" className="text-blue-500 hover:underline">Obtener gratis ↗</a>
                    </label>
                    <input
                      type="password"
                      value={editKey[dp.name] ?? ""}
                      onChange={(e) => setEditKey((prev) => ({ ...prev, [dp.name]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={existing?.hasKey ? "••••••••••••••••" : "Pega tu API key aqui"}
                    />
                  </div>
                  <button
                    onClick={() => saveProvider(dp, editKey[dp.name] ?? "", existing?.isActive ?? false)}
                    disabled={saving === dp.name}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                  >
                    {saving === dp.name ? "Guardando..." : "Guardar"}
                  </button>
                </div>
                {msg && saving === null && <p className="text-xs text-green-600 mt-2">{msg}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Crear agente */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Crear nuevo agente</h2>
            <form onSubmit={createAgent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                  <input value={agentForm.name} onChange={(e) => setAgentForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Asistente Barberia" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor preferido</label>
                  <select value={agentForm.preferredProvider} onChange={(e) => setAgentForm((p) => ({ ...p, preferredProvider: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Auto (mejor disponible)</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="groq">Groq</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
                <input value={agentForm.description} onChange={(e) => setAgentForm((p) => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Agente de atencion al cliente para barberías" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instrucciones del agente (System Prompt) *</label>
                <textarea value={agentForm.systemPrompt} onChange={(e) => setAgentForm((p) => ({ ...p, systemPrompt: e.target.value }))}
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Eres un asistente amable de una barberia. Tu objetivo es ayudar a los clientes a reservar citas, responder preguntas sobre los servicios y horarios. Responde siempre en español de manera profesional y concisa."
                  required />
                <p className="text-xs text-gray-400 mt-1">Define la personalidad, tono y objetivo del agente. El sistema agregara automaticamente la informacion del sitio.</p>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="isGlobal" checked={agentForm.isGlobal} onChange={(e) => setAgentForm((p) => ({ ...p, isGlobal: e.target.checked }))} className="w-4 h-4" />
                <label htmlFor="isGlobal" className="text-sm text-gray-700">Agente global (disponible para todos los sitios)</label>
              </div>
              <div className="flex justify-end">
                <button type="submit" disabled={savingAgent}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  {savingAgent ? "Creando..." : "Crear agente"}
                </button>
              </div>
            </form>
          </div>

          {/* Agentes globales */}
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">Agentes globales ({globalAgents.length})</h2>
            {globalAgents.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400">No hay agentes globales</div>
            ) : (
              <div className="space-y-3">
                {globalAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onDelete={deleteAgent} onUpdate={updateAgent} editing={editingAgent} setEditing={setEditingAgent} />
                ))}
              </div>
            )}
          </div>

          {/* Agentes de sitios */}
          {siteAgents.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-3">Agentes de sitios ({siteAgents.length})</h2>
              <div className="space-y-3">
                {siteAgents.map((agent) => (
                  <AgentCard key={agent.id} agent={agent} onDelete={deleteAgent} onUpdate={updateAgent} editing={editingAgent} setEditing={setEditingAgent} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AgentCard({ agent, onDelete, onUpdate, editing, setEditing }: {
  agent: Agent;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: any) => void;
  editing: Agent | null;
  setEditing: (a: Agent | null) => void;
}) {
  const isEditing = editing?.id === agent.id;
  const [form, setForm] = useState({ name: agent.name, description: agent.description ?? "", systemPrompt: agent.systemPrompt, preferredProvider: agent.preferredProvider ?? "" });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      {isEditing ? (
        <div className="space-y-3">
          <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nombre" />
          <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Descripcion" />
          <textarea value={form.systemPrompt} onChange={(e) => setForm((p) => ({ ...p, systemPrompt: e.target.value }))}
            rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="System prompt" />
          <select value={form.preferredProvider} onChange={(e) => setForm((p) => ({ ...p, preferredProvider: e.target.value }))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Auto</option>
            <option value="gemini">Google Gemini</option>
            <option value="groq">Groq</option>
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => onUpdate(agent.id, form)} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Guardar</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900">{agent.name}</p>
              {agent.isGlobal && <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">Global</span>}
              {!agent.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactivo</span>}
              {agent.preferredProvider && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{agent.preferredProvider}</span>}
              {agent.site && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">{agent.site.name}</span>}
            </div>
            {agent.description && <p className="text-sm text-gray-500 mt-1">{agent.description}</p>}
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{agent.systemPrompt}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setEditing(agent)} className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Editar</button>
            <button onClick={() => onDelete(agent.id)} className="px-3 py-1.5 text-xs border border-red-200 rounded-lg text-red-600 hover:bg-red-50">Eliminar</button>
          </div>
        </div>
      )}
    </div>
  );
}
