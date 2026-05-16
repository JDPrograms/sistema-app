"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

const DAYS = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
const DEFAULT_HOURS = DAYS.map((day, i) => ({
  day,
  isOpen: i < 6,
  open: "09:00",
  close: i === 5 ? "14:00" : "18:00",
}));

const COLOR_PRESETS = [
  { label: "Azul",         primary: "#3b82f6", secondary: "#1e40af" },
  { label: "Indigo",       primary: "#6366f1", secondary: "#3730a3" },
  { label: "Violeta",      primary: "#7c3aed", secondary: "#4c1d95" },
  { label: "Rosa",         primary: "#db2777", secondary: "#831843" },
  { label: "Rojo",         primary: "#dc2626", secondary: "#991b1b" },
  { label: "Naranja",      primary: "#ea580c", secondary: "#9a3412" },
  { label: "Amarillo",     primary: "#ca8a04", secondary: "#713f12" },
  { label: "Verde",        primary: "#16a34a", secondary: "#14532d" },
  { label: "Teal",         primary: "#0d9488", secondary: "#134e4a" },
  { label: "Gris oscuro",  primary: "#374151", secondary: "#111827" },
];

type Tab = "apariencia" | "contacto" | "redes" | "horarios" | "seo";

interface HourRow { day: string; isOpen: boolean; open: string; close: string; }
interface SocialLinks { instagram: string; facebook: string; twitter: string; tiktok: string; youtube: string; }
interface FormData {
  name: string; description: string;
  primaryColor: string; secondaryColor: string;
  logoUrl: string;
  phone: string; address: string; email: string;
  whatsapp: string; mapUrl: string;
  socialLinks: SocialLinks;
  businessHours: HourRow[];
  seoTitle: string; seoDescription: string;
}

const emptyForm: FormData = {
  name: "", description: "",
  primaryColor: "#3b82f6", secondaryColor: "#1e40af",
  logoUrl: "",
  phone: "", address: "", email: "",
  whatsapp: "", mapUrl: "",
  socialLinks: { instagram: "", facebook: "", twitter: "", tiktok: "", youtube: "" },
  businessHours: DEFAULT_HOURS,
  seoTitle: "", seoDescription: "",
};

export default function CustomizePage() {
  const { slug } = useParams() as { slug: string };
  const [tab, setTab] = useState<Tab>("apariencia");
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch(`/api/site/${slug}/customize`).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        let socialLinks: SocialLinks = { instagram: "", facebook: "", twitter: "", tiktok: "", youtube: "" };
        let businessHours: HourRow[] = DEFAULT_HOURS;
        try { socialLinks = { ...socialLinks, ...JSON.parse(d.socialLinks || "{}") }; } catch {}
        try {
          const parsed = JSON.parse(d.businessHours || "[]");
          if (Array.isArray(parsed) && parsed.length === 7) businessHours = parsed;
        } catch {}
        setForm({
          name: d.name || "",
          description: d.description || "",
          primaryColor: d.primaryColor || "#3b82f6",
          secondaryColor: d.secondaryColor || "#1e40af",
          logoUrl: d.logoUrl || "",
          phone: d.phone || "",
          address: d.address || "",
          email: d.email || "",
          whatsapp: d.whatsapp || "",
          mapUrl: d.mapUrl || "",
          socialLinks,
          businessHours,
          seoTitle: d.seoTitle || "",
          seoDescription: d.seoDescription || "",
        });
      }
      setLoading(false);
    });
  }, [slug]);

  function set(key: keyof FormData, value: any) {
    setForm((p) => ({ ...p, [key]: value }));
  }
  function setSocial(key: keyof SocialLinks, value: string) {
    setForm((p) => ({ ...p, socialLinks: { ...p.socialLinks, [key]: value } }));
  }
  function setHour(i: number, key: keyof HourRow, value: any) {
    setForm((p) => {
      const hours = [...p.businessHours];
      hours[i] = { ...hours[i], [key]: value };
      return { ...p, businessHours: hours };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch(`/api/site/${slug}/customize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        socialLinks: JSON.stringify(form.socialLinks),
        businessHours: JSON.stringify(form.businessHours),
      }),
    });
    setSaving(false);
    setMsg({ text: res.ok ? "Cambios guardados" : "Error al guardar", ok: res.ok });
    if (res.ok) setTimeout(() => setMsg(null), 3000);
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "apariencia", label: "Apariencia", icon: "🎨" },
    { id: "contacto",   label: "Contacto",   icon: "📞" },
    { id: "redes",      label: "Redes sociales", icon: "🔗" },
    { id: "horarios",   label: "Horarios",    icon: "🕐" },
    { id: "seo",        label: "SEO",         icon: "🔍" },
  ];

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Personalizar sitio</h1>
        <p className="text-gray-500 mt-1">Configura todos los aspectos de tu sitio</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ===== APARIENCIA ===== */}
        {tab === "apariencia" && (
          <>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Identidad</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio *</label>
                <input name="name" value={form.name} onChange={(e) => set("name", e.target.value)}
                  className={inp} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion corta</label>
                <textarea name="description" value={form.description}
                  onChange={(e) => set("description", e.target.value)} rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Describe tu negocio en pocas palabras..." />
              </div>
              <ImageUpload
                label="Logo del negocio"
                value={form.logoUrl}
                onChange={(url) => set("logoUrl", url)}
                slug={slug}
                previewHeight="h-16"
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Colores</h2>

              {/* Presets */}
              <div>
                <p className="text-xs text-gray-500 mb-2 font-medium">Paletas predefinidas</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((p) => (
                    <button key={p.label} type="button"
                      onClick={() => { set("primaryColor", p.primary); set("secondaryColor", p.secondary); }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.primaryColor === p.primary ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-200 hover:border-gray-300"
                      }`}>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondary }} />
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color principal</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.primaryColor}
                      onChange={(e) => set("primaryColor", e.target.value)}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer flex-shrink-0" />
                    <input value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color secundario</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.secondaryColor}
                      onChange={(e) => set("secondaryColor", e.target.value)}
                      className="w-10 h-10 rounded border border-gray-200 cursor-pointer flex-shrink-0" />
                    <input value={form.secondaryColor} onChange={(e) => set("secondaryColor", e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="rounded-xl p-4 flex items-center gap-3" style={{ backgroundColor: form.primaryColor }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: form.secondaryColor }}>
                  {form.logoUrl
                    ? <img src={form.logoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover"
                        onError={(e) => (e.currentTarget.style.display = "none")} />
                    : (form.name || "N")[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{form.name || "Nombre del negocio"}</p>
                  <p className="text-white/70 text-xs">{form.description || "Descripcion del sitio"}</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== CONTACTO ===== */}
        {tab === "contacto" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Datos de contacto y ubicacion</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
                <input value={form.phone} onChange={(e) => set("phone", e.target.value)}
                  className={inp} placeholder="+54 9 11 1234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">📱</span>
                  <input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)}
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+54 9 11 1234 5678" />
                </div>
                <p className="text-xs text-gray-400 mt-1">Se mostrara como boton de chat en el sitio</p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de contacto</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                  className={inp} placeholder="contacto@negocio.com" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Direccion</label>
                <input value={form.address} onChange={(e) => set("address", e.target.value)}
                  className={inp} placeholder="Av. Siempre Viva 742, Springfield" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de Google Maps</label>
                <input value={form.mapUrl} onChange={(e) => set("mapUrl", e.target.value)}
                  className={inp} placeholder="https://maps.google.com/..." />
                <p className="text-xs text-gray-400 mt-1">Pega el link de "Compartir ubicacion" de Google Maps</p>
              </div>
            </div>

            {/* Preview de contacto */}
            {(form.phone || form.whatsapp || form.email || form.address) && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Vista previa del contacto</p>
                {form.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>📞</span> {form.phone}
                  </div>
                )}
                {form.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>📱</span> WhatsApp: {form.whatsapp}
                  </div>
                )}
                {form.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>✉️</span> {form.email}
                  </div>
                )}
                {form.address && (
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>📍</span> {form.address}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== REDES SOCIALES ===== */}
        {tab === "redes" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Redes sociales</h2>
              <p className="text-sm text-gray-400 mt-0.5">Los iconos aparecen en el pie de pagina de tu sitio</p>
            </div>
            {([
              { key: "instagram", label: "Instagram", icon: "📸", placeholder: "https://instagram.com/tunegocio" },
              { key: "facebook",  label: "Facebook",  icon: "👤", placeholder: "https://facebook.com/tunegocio" },
              { key: "twitter",   label: "Twitter / X", icon: "🐦", placeholder: "https://x.com/tunegocio" },
              { key: "tiktok",    label: "TikTok",    icon: "🎵", placeholder: "https://tiktok.com/@tunegocio" },
              { key: "youtube",   label: "YouTube",   icon: "▶️", placeholder: "https://youtube.com/@tunegocio" },
            ] as { key: keyof SocialLinks; label: string; icon: string; placeholder: string }[]).map((s) => (
              <div key={s.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {s.icon} {s.label}
                </label>
                <input value={form.socialLinks[s.key]}
                  onChange={(e) => setSocial(s.key, e.target.value)}
                  className={inp} placeholder={s.placeholder} />
              </div>
            ))}

            {/* Preview icons */}
            {Object.values(form.socialLinks).some(Boolean) && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Iconos que se mostraran</p>
                <div className="flex gap-3 flex-wrap">
                  {form.socialLinks.instagram && (
                    <a href={form.socialLinks.instagram} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-pink-600 transition-colors">
                      📸 Instagram
                    </a>
                  )}
                  {form.socialLinks.facebook && (
                    <a href={form.socialLinks.facebook} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                      👤 Facebook
                    </a>
                  )}
                  {form.socialLinks.twitter && (
                    <a href={form.socialLinks.twitter} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-sky-500 transition-colors">
                      🐦 Twitter
                    </a>
                  )}
                  {form.socialLinks.tiktok && (
                    <a href={form.socialLinks.tiktok} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-black transition-colors">
                      🎵 TikTok
                    </a>
                  )}
                  {form.socialLinks.youtube && (
                    <a href={form.socialLinks.youtube} target="_blank" rel="noopener"
                      className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors">
                      ▶️ YouTube
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== HORARIOS ===== */}
        {tab === "horarios" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Horarios de atencion</h2>
              <p className="text-sm text-gray-400 mt-0.5">Se muestran en la pagina publica del sitio</p>
            </div>
            <div className="space-y-2">
              {form.businessHours.map((row, i) => (
                <div key={row.day} className={`flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5 px-3 rounded-xl border transition-colors ${row.isOpen ? "border-gray-100 bg-white" : "border-gray-100 bg-gray-50"}`}>
                  <div className="flex items-center gap-2 w-[130px] flex-shrink-0">
                    <button type="button"
                      onClick={() => setHour(i, "isOpen", !row.isOpen)}
                      className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${row.isOpen ? "bg-green-500" : "bg-gray-300"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${row.isOpen ? "translate-x-4" : "translate-x-0.5"}`} />
                    </button>
                    <span className={`text-sm font-medium ${row.isOpen ? "text-gray-900" : "text-gray-400"}`}>{row.day}</span>
                  </div>
                  {row.isOpen ? (
                    <div className="flex items-center gap-3 flex-wrap flex-1">
                      <div className="flex-1 min-w-[90px]">
                        <label className="block text-xs text-gray-400 mb-1">Apertura</label>
                        <input type="time" value={row.open} onChange={(e) => setHour(i, "open", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div className="flex-1 min-w-[90px]">
                        <label className="block text-xs text-gray-400 mb-1">Cierre</label>
                        <input type="time" value={row.close} onChange={(e) => setHour(i, "close", e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400 italic pl-2">Cerrado</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button type="button"
                onClick={() => setForm((p) => ({
                  ...p,
                  businessHours: p.businessHours.map((h, i) => i < 5 ? { ...h, isOpen: true } : i === 5 ? { ...h, isOpen: true, open: "09:00", close: "14:00" } : { ...h, isOpen: false }),
                }))}
                className="text-xs text-blue-600 hover:underline">
                Restaurar horario predeterminado (Lun–Vie 9-18, Sab 9-14, Dom cerrado)
              </button>
              <span className="text-xs text-gray-300">|</span>
              <button type="button"
                onClick={() => setForm((p) => ({
                  ...p,
                  businessHours: p.businessHours.map((h) => ({ ...h, isOpen: false })),
                }))}
                className="text-xs text-gray-400 hover:underline">
                Cerrar todos
              </button>
            </div>
          </div>
        )}

        {/* ===== SEO ===== */}
        {tab === "seo" && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">SEO — Busqueda y redes</h2>
              <p className="text-sm text-gray-400 mt-0.5">Controla como aparece tu sitio en Google y al compartir en redes</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titulo SEO
                <span className="ml-2 text-xs text-gray-400 font-normal">(aparece en la pestana del navegador y Google)</span>
              </label>
              <input value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)}
                className={inp} placeholder={form.name || "Nombre del negocio"}
                maxLength={60} />
              <p className="text-xs text-gray-400 mt-1">{form.seoTitle.length}/60 caracteres — si lo dejas vacio, se usa el nombre del negocio</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta descripcion
                <span className="ml-2 text-xs text-gray-400 font-normal">(snippet que aparece bajo el titulo en Google)</span>
              </label>
              <textarea value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)}
                rows={3} maxLength={160}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder={form.description || "Describe tu negocio para los buscadores..."} />
              <p className="text-xs text-gray-400 mt-1">{form.seoDescription.length}/160 caracteres — si lo dejas vacio, se usa la descripcion del negocio</p>
            </div>

            {/* Google preview */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Como se ve en Google</p>
              <div className="space-y-1">
                <p className="text-sm text-blue-600 hover:underline cursor-default font-medium truncate">
                  {form.seoTitle || form.name || "Nombre del negocio"}
                </p>
                <p className="text-xs text-green-700">tusitio.com/site/{slug}</p>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {form.seoDescription || form.description || "Descripcion del sitio web. Se muestra en los resultados de busqueda de Google."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer con boton guardar */}
        <div className="flex items-center gap-4 pt-2">
          <button type="submit" disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-8 py-3 rounded-xl transition-colors">
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          {msg && (
            <span className={`text-sm font-medium ${msg.ok ? "text-green-600" : "text-red-600"}`}>
              {msg.ok ? "✓" : "✕"} {msg.text}
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
