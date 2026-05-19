"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CopySiteUrlBtn from "@/components/CopySiteUrlBtn";

interface Admin { id: string; name: string; email: string; createdAt: string }
interface Site {
  id: string; name: string; slug: string; template: string;
  isActive: boolean; hasAdminPanel: boolean; modules: string;
  primaryColor: string; description?: string;
  planType: string; expiresAt?: string | null; expiryReason?: string | null;
  customDomain?: string | null;
  admins: Admin[]; _count: { users: number };
}

const templateLabels: Record<string, string> = {
  barbershop: "Peluqueria/Barberia",
  salon:      "Salon de Belleza/Spa",
  restaurant: "Restaurante/Cafeteria",
  gym:        "Gimnasio/Fitness",
  clinic:     "Clinica/Consultorio",
  school:     "Academia/Escuela",
  veterinary: "Veterinaria",
  lawyer:     "Estudio Juridico",
  realestate: "Inmobiliaria",
  hotel:      "Hotel/Hospedaje",
  hardware:   "Ferreteria/Tienda",
  generic:    "Generico",
};

const MODULE_CONFIG = [
  { key: "appointments", label: "Citas",             desc: "Sistema de reservas y agenda para clientes", icon: "📅" },
  { key: "content",      label: "Contenido",         desc: "Servicios del negocio y paginas de contenido", icon: "📋" },
  { key: "products",     label: "Productos",         desc: "Catalogo de productos con stock, precios y categorias", icon: "📦" },
  { key: "billing",      label: "Contabilidad",      desc: "Facturas, cotizaciones, gastos e inventario", icon: "🧾" },
  { key: "ads",          label: "Publicidades",      desc: "Banners y anuncios del sitio", icon: "📢" },
  { key: "users",        label: "Usuarios",          desc: "Registro e inicio de sesion de clientes", icon: "👥" },
  { key: "customize",    label: "Personalizar",      desc: "Colores, logo, descripcion y datos de contacto", icon: "🎨" },
  { key: "ai",           label: "Inteligencia Artificial", desc: "Agentes IA, chat publico y asistente admin", icon: "🤖" },
  { key: "support",      label: "Soporte en Vivo",   desc: "Chat en vivo con clientes y transferencia a agente humano", icon: "💬" },
  { key: "whatsapp",     label: "WhatsApp",          desc: "Soporte y bot de IA directamente en WhatsApp Business", icon: "📱" },
  { key: "instagram",    label: "Instagram DM",      desc: "Responde mensajes directos de Instagram con IA", icon: "📸" },
];

function parseMods(s: string): Record<string, boolean> {
  try { return JSON.parse(s); } catch { return {}; }
}

export default function SiteManageClient({ site }: { site: Site }) {
  const router = useRouter();
  const [name, setName] = useState(site.name);
  const [isActive, setIsActive] = useState(site.isActive);
  const [hasAdminPanel, setHasAdminPanel] = useState(site.hasAdminPanel);
  const [mods, setMods] = useState<Record<string, boolean>>(parseMods(site.modules));
  const [saving, setSaving] = useState(false);
  const [savingMods, setSavingMods] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState("");
  const [modsMsg, setModsMsg] = useState("");
  const [planMsg, setPlanMsg] = useState("");
  const [planType, setPlanType] = useState(site.planType ?? "unlimited");
  const [expiresAt, setExpiresAt] = useState(site.expiresAt ? new Date(site.expiresAt).toISOString().split("T")[0] : "");
  const [expiryReason, setExpiryReason] = useState(site.expiryReason ?? "");
  const [customDomain, setCustomDomain] = useState(site.customDomain ?? "");
  const [domainInput, setDomainInput] = useState(site.customDomain ?? "");
  const [domainStatus, setDomainStatus] = useState<{ verified?: boolean; misconfigured?: boolean } | null>(null);
  const [savingDomain, setSavingDomain] = useState(false);
  const [domainMsg, setDomainMsg] = useState("");

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const res = await fetch(`/api/admin/sites/${site.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, isActive }),
    });
    setSaving(false);
    if (res.ok) setMsg("Guardado correctamente");
    else setMsg("Error al guardar");
  }

  async function handleSaveModules() {
    setSavingMods(true);
    setModsMsg("");
    const res = await fetch(`/api/admin/sites/${site.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modules: JSON.stringify(mods), hasAdminPanel }),
    });
    setSavingMods(false);
    if (res.ok) setModsMsg("Guardado correctamente");
    else setModsMsg("Error al guardar");
  }

  async function handleDelete() {
    if (!confirm(`Eliminar el sitio "${site.name}"? Esta accion no se puede deshacer.`)) return;
    setDeleting(true);
    await fetch(`/api/admin/sites/${site.id}`, { method: "DELETE" });
    router.push("/admin/sites");
  }

  async function handleSavePlan() {
    setSavingPlan(true);
    setPlanMsg("");
    const res = await fetch(`/api/admin/sites/${site.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planType,
        expiresAt: planType === "timed" && expiresAt ? new Date(expiresAt).toISOString() : null,
        expiryReason: expiryReason || null,
      }),
    });
    setSavingPlan(false);
    if (res.ok) { setPlanMsg("Plan guardado"); setTimeout(() => setPlanMsg(""), 2000); }
    else setPlanMsg("Error al guardar");
  }

  async function handleSaveDomain() {
    setSavingDomain(true);
    setDomainMsg("");
    const res = await fetch(`/api/admin/sites/${site.id}/domain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: domainInput }),
    });
    setSavingDomain(false);
    const d = await res.json();
    if (res.ok) {
      setCustomDomain(d.domain);
      setDomainMsg(d.vercelOk ? "Dominio asignado. Configura el DNS." : `Dominio guardado (${d.vercelMsg || "configura Vercel manualmente"}).`);
      const statusRes = await fetch(`/api/admin/sites/${site.id}/domain`);
      if (statusRes.ok) { const sd = await statusRes.json(); setDomainStatus(sd.status); }
    } else {
      setDomainMsg(d.error || "Error al guardar");
    }
  }

  async function handleRemoveDomain() {
    if (!confirm("¿Quitar el dominio personalizado de este sitio?")) return;
    setSavingDomain(true);
    await fetch(`/api/admin/sites/${site.id}/domain`, { method: "DELETE" });
    setCustomDomain("");
    setDomainInput("");
    setDomainStatus(null);
    setDomainMsg("Dominio eliminado");
    setSavingDomain(false);
    setTimeout(() => setDomainMsg(""), 3000);
  }

  function toggleMod(key: string) {
    setMods((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const quickLinks = [
    { href: `/site/${site.slug}/admin`,              label: "Dashboard",       icon: "📊", desc: "Panel principal y métricas" },
    { href: `/site/${site.slug}/admin/appointments`, label: "Citas",           icon: "📅", desc: "Reservas y agenda" },
    { href: `/site/${site.slug}/admin/staff`,        label: "Personal",        icon: "🧑‍💼", desc: "Equipo y asignacion de citas" },
    { href: `/site/${site.slug}/admin/products`,     label: "Productos",       icon: "📦", desc: "Catalogo de productos y stock" },
    { href: `/site/${site.slug}/admin/content`,      label: "Contenido",       icon: "📋", desc: "Servicios y paginas" },
    { href: `/site/${site.slug}/admin/billing`,      label: "Contabilidad",    icon: "🧾", desc: "Facturas, gastos e inventario" },
    { href: `/site/${site.slug}/admin/customize`,    label: "Personalizar",    icon: "🎨", desc: "Colores, logo, contacto" },
    { href: `/site/${site.slug}/admin/sections`,     label: "Secciones",       icon: "⊞",  desc: "Secciones del sitio publico" },
    { href: `/site/${site.slug}/admin/builder`,      label: "Constructor",     icon: "✦",  desc: "Constructor visual de paginas" },
    { href: `/site/${site.slug}/admin/ads`,          label: "Publicidades",    icon: "📢", desc: "Banners y anuncios" },
    { href: `/site/${site.slug}/admin/users`,        label: "Usuarios",        icon: "👥", desc: "Clientes registrados" },
    { href: `/site/${site.slug}/admin/ai`,           label: "IA",              icon: "🤖", desc: "Agentes y asistente IA" },
    { href: `/site/${site.slug}/admin/admins`,       label: "Administradores", icon: "🔐", desc: "Admins del sitio" },
  ];

  return (
    <div className="space-y-6">
      {/* Acceso rapido completo */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="font-semibold text-blue-900">Administracion completa del sitio</p>
            <p className="text-sm text-blue-600 mt-0.5">Como super admin tienes acceso total a este sitio</p>
          </div>
          <Link
            href={`/site/${site.slug}/admin`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Abrir panel completo →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map((link) => (
            <Link key={link.href} href={link.href}
              className="bg-white rounded-lg border border-blue-100 px-4 py-3 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-3">
              <span className="text-xl">{link.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{link.label}</p>
                <p className="text-xs text-gray-400">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Config general */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Configuracion general</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del sitio</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="active" checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)} className="w-4 h-4 rounded" />
          <label htmlFor="active" className="text-sm text-gray-700">Sitio activo (visible al publico)</label>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-green-600">{msg}</span>}
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>

      {/* Modulos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="font-semibold text-gray-900">Modulos del sitio</h2>
          <p className="text-sm text-gray-400 mt-0.5">Activa o desactiva funcionalidades para este sitio</p>
        </div>

        {/* Panel de administracion */}
        <div className="flex items-center justify-between py-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">🔐</span>
            <div>
              <p className="text-sm font-medium text-gray-900">Panel de administracion</p>
              <p className="text-xs text-gray-400">Permite a admins del sitio acceder al panel. Si se desactiva, solo tu (superadmin) puedes gestionar este sitio.</p>
            </div>
          </div>
          <button
            onClick={() => setHasAdminPanel((p) => !p)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${hasAdminPanel ? "bg-blue-600" : "bg-gray-200"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${hasAdminPanel ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Modulos individuales */}
        <div className="divide-y divide-gray-50">
          {MODULE_CONFIG.map(({ key, label, desc, icon }) => {
            const enabled = mods[key] === true;
            return (
              <div key={key} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleMod(key)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-blue-600" : "bg-gray-200"}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-1"}`} />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
          {modsMsg && <span className="text-sm text-green-600">{modsMsg}</span>}
          <button onClick={handleSaveModules} disabled={savingMods}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {savingMods ? "Guardando..." : "Guardar modulos"}
          </button>
        </div>
      </div>

      {/* URLs del sitio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">URLs del sitio</h2>
        <p className="text-sm text-gray-400 mb-4">Comparte estas URLs con el administrador o los clientes del sitio</p>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1.5">Sitio publico (clientes)</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate">
                /site/{site.slug}
              </code>
              <CopySiteUrlBtn slug={site.slug} variant="public" label="Copiar" />
              <Link href={`/site/${site.slug}`} target="_blank"
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Abrir ↗
              </Link>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1.5">Login admin del sitio</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 truncate">
                /site/{site.slug}/login
              </code>
              <CopySiteUrlBtn slug={site.slug} variant="login" label="Copiar" />
              <Link href={`/site/${site.slug}/login`} target="_blank"
                className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
                Abrir ↗
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Dominio personalizado */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Dominio personalizado</h2>
          <p className="text-sm text-gray-400 mt-0.5">Asigna un dominio propio. Los clientes accederán directamente desde ese dominio.</p>
        </div>

        {customDomain && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
            <span className="text-green-600 text-lg">✓</span>
            <code className="text-sm font-mono text-green-800">{customDomain}</code>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
              domainStatus?.verified ? "bg-green-100 text-green-700" :
              domainStatus?.misconfigured ? "bg-red-100 text-red-700" :
              "bg-amber-100 text-amber-700"
            }`}>
              {domainStatus?.verified ? "✓ Verificado" : domainStatus?.misconfigured ? "DNS incorrecto" : "Pendiente DNS"}
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="ejemplo.com"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
          <button
            onClick={handleSaveDomain}
            disabled={savingDomain || !domainInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
            {savingDomain ? "Guardando..." : customDomain ? "Actualizar" : "Asignar dominio"}
          </button>
          {customDomain && (
            <button
              onClick={handleRemoveDomain}
              disabled={savingDomain}
              className="px-3 py-2 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Quitar
            </button>
          )}
        </div>

        {domainMsg && (
          <p className={`text-sm ${domainMsg.includes("Error") || domainMsg.includes("error") ? "text-red-600" : "text-green-600"}`}>
            {domainMsg}
          </p>
        )}

        {customDomain && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
            <p className="font-medium text-gray-700">Configura estos registros DNS en tu proveedor de dominio:</p>
            <div className="font-mono text-xs bg-white border border-gray-200 rounded-lg p-3 space-y-1">
              <div className="grid grid-cols-3 gap-2 text-gray-400 font-sans text-xs font-semibold uppercase mb-1">
                <span>Tipo</span><span>Nombre</span><span>Valor</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-blue-600">CNAME</span>
                <span>@</span>
                <span className="text-gray-700">cname.vercel-dns.com</span>
              </div>
            </div>
            <p className="text-xs text-gray-400">Los cambios DNS pueden tardar hasta 48 horas. Vercel verificará automáticamente.</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Informacion</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400">Plantilla</p><p className="font-medium">{templateLabels[site.template]}</p></div>
          <div><p className="text-gray-400">URL</p><p className="font-medium">/site/{site.slug}</p></div>
          <div><p className="text-gray-400">Administradores</p><p className="font-medium">{site.admins.length}</p></div>
          <div><p className="text-gray-400">Usuarios</p><p className="font-medium">{site._count.users}</p></div>
        </div>
      </div>

      {/* Admins del sitio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Administradores del sitio</h2>
        <div className="space-y-2">
          {site.admins.map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600 text-sm">
                {a.name[0]}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{a.name}</p>
                <p className="text-xs text-gray-400">{a.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan del sitio */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <h2 className="font-semibold text-gray-900">Plan del sitio</h2>
          <p className="text-sm text-gray-400 mt-0.5">Define si el sitio tiene fecha de vencimiento o es ilimitado</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => setPlanType("unlimited")}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${planType === "unlimited" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
            <p className="font-medium text-sm text-gray-900">♾️ Ilimitado</p>
            <p className="text-xs text-gray-400 mt-0.5">Sin fecha de vencimiento. El sitio permanece activo hasta que lo desactives manualmente.</p>
          </button>
          <button onClick={() => setPlanType("timed")}
            className={`p-4 rounded-xl border-2 text-left transition-colors ${planType === "timed" ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-gray-300"}`}>
            <p className="font-medium text-sm text-gray-900">⏱️ Con tiempo</p>
            <p className="text-xs text-gray-400 mt-0.5">El sitio se desactiva automaticamente al llegar a la fecha. El admin recibe avisos de vencimiento.</p>
          </button>
        </div>

        {planType === "timed" && (
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de vencimiento</label>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (opcional)</label>
              <select value={expiryReason} onChange={(e) => setExpiryReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Sin motivo especifico</option>
                <option value="payment">Pendiente de pago</option>
                <option value="trial">Periodo de prueba</option>
                <option value="maintenance">Mantenimiento programado</option>
                <option value="other">Otro motivo</option>
              </select>
              {expiryReason === "payment" && (
                <p className="text-xs text-amber-600 mt-1">El admin vera un aviso indicando que debe realizar el pago para mantener el sitio activo.</p>
              )}
            </div>
            {expiresAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                El sitio vencera el <strong>{new Date(expiresAt + "T12:00:00").toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}</strong>.
                El admin recibira avisos desde 10 dias antes. Despues del vencimiento tendra 10 dias de gracia antes de la desactivacion definitiva.
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
          {planMsg && <span className={`text-sm ${planMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>{planMsg}</span>}
          <button onClick={handleSavePlan} disabled={savingPlan}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
            {savingPlan ? "Guardando..." : "Guardar plan"}
          </button>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <Link href={`/site/${site.slug}`} target="_blank"
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          Ver sitio publico ↗
        </Link>
        <button onClick={handleDelete} disabled={deleting}
          className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50">
          {deleting ? "Eliminando..." : "Eliminar sitio"}
        </button>
      </div>
    </div>
  );
}
