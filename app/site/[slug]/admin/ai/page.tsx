"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdminChat from "@/components/ai/AdminChat";

interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  preferredProvider?: string;
  agentType: string;
  isGlobal: boolean;
  isActive: boolean;
}

const ADMIN_PROMPTS = [
  { label: "Asistente de gestion", value: "Eres un asistente experto en gestion de negocios. Ayudas al administrador con tareas del dia a dia: organizar citas, redactar textos, analizar estadisticas y dar ideas para mejorar el negocio. Responde de forma practica y directa." },
  { label: "Consultor de marketing", value: "Eres un consultor de marketing especializado en pequenos negocios. Das ideas para atraer mas clientes, mejorar la presencia en redes sociales y crear promociones efectivas. Responde con ideas concretas y aplicables." },
];

const PUBLIC_PROMPTS = [
  { label: "Atencion al cliente", value: "Eres un asistente amable de atencion al cliente. Respondes preguntas sobre los servicios, precios y horarios del negocio. Si el cliente quiere reservar, indicale que puede hacerlo con el formulario de la pagina." },
  { label: "Asistente de ventas", value: "Eres un asistente de ventas entusiasta. Ayudas a los clientes a elegir el producto o servicio ideal para sus necesidades. Destacas los beneficios del negocio de forma natural y sin presion." },
];

export default function SiteAiPage() {
  const { slug } = useParams() as { slug: string };
  const [siteAgents, setSiteAgents] = useState<Agent[]>([]);
  const [globalAgents, setGlobalAgents] = useState<Agent[]>([]);
  const [chatAgentId, setChatAgentId] = useState("");
  const [adminAgentId, setAdminAgentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configMsg, setConfigMsg] = useState("");
  const [tab, setTab] = useState<"config" | "admin-agents" | "public-agents" | "test">("config");

  const [adminForm, setAdminForm] = useState({ name: "", description: "", systemPrompt: "", preferredProvider: "" });
  const [publicForm, setPublicForm] = useState({ name: "", description: "", systemPrompt: "", preferredProvider: "" });
  const [savingAdmin, setSavingAdmin] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/site/${slug}/ai/agents`);
    if (r.ok) {
      const data = await r.json();
      setSiteAgents(data.siteAgents ?? []);
      setGlobalAgents(data.globalAgents ?? []);
      setChatAgentId(data.chatAgentId ?? "");
      setAdminAgentId(data.adminAgentId ?? "");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function saveConfig() {
    setSavingConfig(true);
    setConfigMsg("");
    const r = await fetch(`/api/site/${slug}/ai/config`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatAgentId: chatAgentId || null, adminAgentId: adminAgentId || null }),
    });
    setSavingConfig(false);
    if (r.ok) { setConfigMsg("Guardado"); setTimeout(() => setConfigMsg(""), 2000); }
  }

  async function createAgent(type: "admin" | "public") {
    const form = type === "admin" ? adminForm : publicForm;
    const setSaving = type === "admin" ? setSavingAdmin : setSavingPublic;
    const setForm = type === "admin" ? setAdminForm : setPublicForm;
    if (!form.name.trim() || !form.systemPrompt.trim()) return;
    setSaving(true);
    await fetch(`/api/site/${slug}/ai/agents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, agentType: type }),
    });
    setSaving(false);
    setForm({ name: "", description: "", systemPrompt: "", preferredProvider: "" });
    load();
  }

  async function deleteAgent(id: string) {
    if (!confirm("Eliminar este agente?")) return;
    await fetch(`/api/site/${slug}/ai/agents/${id}`, { method: "DELETE" });
    load();
  }

  const adminAgents = [...globalAgents.filter(a => a.agentType !== "public"), ...siteAgents.filter(a => a.agentType === "admin" || a.agentType === "general")];
  const publicAgents = [...globalAgents.filter(a => a.agentType !== "admin"), ...siteAgents.filter(a => a.agentType === "public" || a.agentType === "general")];
  const allAgents = [...globalAgents, ...siteAgents];
  const activeAdminAgent = allAgents.find(a => a.id === adminAgentId);

  const selectedChatAgent = allAgents.find(a => a.id === chatAgentId);
  const chatAgentIsAdmin = selectedChatAgent?.agentType === "admin";

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inteligencia Artificial</h1>
        <p className="text-gray-500 mt-1">Configura agentes IA para tu sitio y panel de administracion</p>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {([
          ["config", "Configuracion"],
          ["admin-agents", "Agentes admin"],
          ["public-agents", "Agentes publicos"],
          ["test", "Probar"],
        ] as const).map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? <div className="text-gray-400 text-center py-12">Cargando...</div> : tab === "config" ? (
        <div className="space-y-5">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            Asigna un agente para cada funcion. Los agentes de admin tienen acceso a citas, usuarios y estadisticas. Los agentes publicos solo ven informacion del negocio apta para clientes.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
            {/* Asistente admin */}
            <div>
              <label className="block font-medium text-gray-900 mb-0.5">🤖 Asistente para panel admin</label>
              <p className="text-xs text-gray-400 mb-2">Tiene acceso completo: citas, usuarios, estadisticas, personal y contenido.</p>
              <select value={adminAgentId} onChange={(e) => setAdminAgentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin asistente admin</option>
                {adminAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.isGlobal ? " (global)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Chat publico */}
            <div>
              <label className="block font-medium text-gray-900 mb-0.5">💬 Chat para sitio publico</label>
              <p className="text-xs text-gray-400 mb-2">Aparece como boton de chat para tus clientes. Solo debe tener informacion publica.</p>
              <select value={chatAgentId} onChange={(e) => setChatAgentId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin chat publico</option>
                {publicAgents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.isGlobal ? " (global)" : ""}
                  </option>
                ))}
              </select>
              {chatAgentIsAdmin && (
                <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-800">
                  <span className="text-base leading-none">⚠️</span>
                  <span>Este agente es de tipo admin y tiene acceso a datos privados como citas y usuarios. No es recomendable usarlo en el chat publico ya que podria revelar informacion sensible a los clientes.</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
              {configMsg && <span className="text-sm text-green-600">{configMsg}</span>}
              <button onClick={saveConfig} disabled={savingConfig}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium">
                {savingConfig ? "Guardando..." : "Guardar configuracion"}
              </button>
            </div>
          </div>
        </div>

      ) : tab === "admin-agents" ? (
        <div className="space-y-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700">
            Los agentes admin tienen acceso a todo el contexto del negocio: citas, usuarios, estadisticas, personal y contenido. Usaros solo en el panel de administracion.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Crear agente admin</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={adminForm.name} onChange={(e) => setAdminForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mi asistente admin" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Instrucciones *</label>
                  <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500"
                    onChange={(e) => e.target.value && setAdminForm(p => ({ ...p, systemPrompt: e.target.value }))}>
                    <option value="">Usar plantilla...</option>
                    {ADMIN_PROMPTS.map(t => <option key={t.label} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <textarea value={adminForm.systemPrompt} onChange={(e) => setAdminForm(p => ({ ...p, systemPrompt: e.target.value }))}
                  rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Define como debe ayudarte este agente en el panel de administracion..." />
              </div>
              <div className="flex justify-end">
                <button onClick={() => createAgent("admin")} disabled={savingAdmin || !adminForm.name.trim() || !adminForm.systemPrompt.trim()}
                  className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  {savingAdmin ? "Creando..." : "Crear agente admin"}
                </button>
              </div>
            </div>
          </div>

          <AgentList
            title="Agentes admin del sitio"
            agents={siteAgents.filter(a => a.agentType === "admin")}
            globalAgents={globalAgents.filter(a => a.agentType === "admin" || a.agentType === "general")}
            onDelete={deleteAgent}
            badge="🔒 Admin"
            badgeColor="bg-slate-100 text-slate-700"
          />
        </div>

      ) : tab === "public-agents" ? (
        <div className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            Los agentes publicos solo tienen acceso a informacion del negocio apta para clientes: servicios, productos y contacto. Son los que puedes poner en el chat de tu sitio web.
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Crear agente publico</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre *</label>
                <input value={publicForm.name} onChange={(e) => setPublicForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Asistente de clientes" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-gray-700">Instrucciones *</label>
                  <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-500"
                    onChange={(e) => e.target.value && setPublicForm(p => ({ ...p, systemPrompt: e.target.value }))}>
                    <option value="">Usar plantilla...</option>
                    {PUBLIC_PROMPTS.map(t => <option key={t.label} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <textarea value={publicForm.systemPrompt} onChange={(e) => setPublicForm(p => ({ ...p, systemPrompt: e.target.value }))}
                  rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Define como debe atender a los clientes en el chat publico..." />
              </div>
              <div className="flex justify-end">
                <button onClick={() => createAgent("public")} disabled={savingPublic || !publicForm.name.trim() || !publicForm.systemPrompt.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium">
                  {savingPublic ? "Creando..." : "Crear agente publico"}
                </button>
              </div>
            </div>
          </div>

          <AgentList
            title="Agentes publicos del sitio"
            agents={siteAgents.filter(a => a.agentType === "public")}
            globalAgents={globalAgents.filter(a => a.agentType === "public" || a.agentType === "general")}
            onDelete={deleteAgent}
            badge="🌐 Publico"
            badgeColor="bg-green-100 text-green-700"
          />
        </div>

      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-4">Prueba el asistente admin configurado para tu panel. Aparece en la esquina inferior derecha.</p>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm" style={{ minHeight: 300 }}>
            El asistente aparece como boton flotante abajo a la derecha →
            <AdminChat agentId={activeAdminAgent?.id} siteSlug={slug} siteName="tu sitio" />
          </div>
        </div>
      )}
    </div>
  );
}

function AgentList({ title, agents, globalAgents, onDelete, badge, badgeColor }: {
  title: string;
  agents: Agent[];
  globalAgents: Agent[];
  onDelete: (id: string) => void;
  badge: string;
  badgeColor: string;
}) {
  return (
    <div className="space-y-4">
      {globalAgents.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Disponibles (globales)</h3>
          <div className="space-y-2">
            {globalAgents.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-purple-100 p-4 flex items-start gap-3">
                <span className="text-lg">🌐</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-900">{a.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">Global</span>
                  </div>
                  {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{title} ({agents.length})</h3>
        {agents.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm">
            No has creado agentes de este tipo aun
          </div>
        ) : (
          <div className="space-y-2">
            {agents.map(a => (
              <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
                <span className="text-lg">🤖</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm text-gray-900">{a.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${badgeColor}`}>{badge}</span>
                  </div>
                  {a.description && <p className="text-xs text-gray-500 mt-0.5">{a.description}</p>}
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{a.systemPrompt}</p>
                </div>
                <button onClick={() => onDelete(a.id)}
                  className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex-shrink-0">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
