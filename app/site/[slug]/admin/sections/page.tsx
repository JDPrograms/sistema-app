"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { TEMPLATE_SECTIONS, SectionDef } from "@/lib/template-sections";
import { SectionLayout, HeroData } from "@/lib/layout-config";

interface SectionState extends SectionDef {
  order: number;
  hidden: boolean;
  minHeight: number | null;
  maxHeight: number | null;
  paddingY: number | null;
  paddingX: number | null;
  width: string;
  bgColor: string;
  bgImage: string;
  bgOverlay: number;
  textColor: string;
}

const SECTION_ICONS: Record<string, string> = {
  header: "🗂", hero: "🖼", services: "📋", booking: "📅", contact: "📞",
  blocks: "🧩", footer: "🔻", classes: "🏋️", trainers: "💪", team: "👥",
  staff: "🧑‍⚕️", menu: "🍽️", products: "📦", courses: "📚", instructors: "🎓",
  benefits: "🏆", specialties: "🩺", office: "🏥", areas: "⚖️", properties: "🏠",
  advisors: "🤝", rooms: "🛏️", amenities: "✨", extra: "ℹ️",
  portfolio: "🖼", specialty: "⭐", howItWorks: "🔄", trust: "🛡️", features: "✅",
};

const WIDTH_OPTIONS = [
  { label: "Completo (100%)", value: "100%" },
  { label: "Grande (1280px)", value: "1280px" },
  { label: "Mediano (1024px)", value: "1024px" },
  { label: "Compacto (768px)", value: "768px" },
  { label: "Pequeño (640px)", value: "640px" },
  { label: "Mini (480px)", value: "480px" },
];

const EMPTY_HERO: HeroData = { title: "", subtitle: "", bgImage: "", overlay: 50, ctaText: "", ctaUrl: "", align: "center" };

function defaultSection(def: SectionDef, saved?: SectionLayout): SectionState {
  return {
    ...def,
    order: saved?.order ?? def.defaultOrder,
    hidden: saved?.hidden ?? false,
    minHeight: saved?.minHeight ?? null,
    maxHeight: saved?.maxHeight ?? null,
    paddingY: saved?.paddingY ?? null,
    paddingX: saved?.paddingX ?? null,
    width: saved?.width ?? "100%",
    bgColor: saved?.bgColor ?? "",
    bgImage: saved?.bgImage ?? "",
    bgOverlay: saved?.bgOverlay ?? 0,
    textColor: saved?.textColor ?? "",
  };
}

export default function SectionsAdminPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"sections" | "hero">("sections");
  const [sections, setSections] = useState<SectionState[]>([]);
  const [heroData, setHeroData] = useState<HeroData>(EMPTY_HERO);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/site/${slug}/customize`);
      const data = await res.json();
      const tmpl = data.template || "generic";
      const defs: SectionDef[] = TEMPLATE_SECTIONS[tmpl] ?? TEMPLATE_SECTIONS["generic"];
      let savedSections: SectionLayout[] = [];
      let savedHero: HeroData = EMPTY_HERO;
      try {
        const lc = JSON.parse(data.layoutConfig || "null");
        savedSections = lc?.sections ?? [];
        if (lc?.heroData) savedHero = { ...EMPTY_HERO, ...lc.heroData };
      } catch {}
      const merged = defs.map((def) => defaultSection(def, savedSections.find((s) => s.key === def.key)));
      merged.sort((a, b) => a.order - b.order);
      setSections(merged);
      setHeroData(savedHero);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function pushLayout(secs: SectionState[], hero: HeroData, isManual: boolean) {
    const layoutSections: SectionLayout[] = secs.map((s, i) => ({
      key: s.key, order: i, hidden: s.hidden,
      minHeight: s.minHeight, maxHeight: s.maxHeight,
      paddingY: s.paddingY, paddingX: s.paddingX,
      width: s.width !== "100%" ? s.width : null,
      bgColor: s.bgColor || null, bgImage: s.bgImage || null,
      bgOverlay: s.bgOverlay || null, textColor: s.textColor || null,
    }));
    await fetch(`/api/site/${slug}/customize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutConfig: JSON.stringify({ sections: layoutSections, heroData: hero }) }),
    });
    refreshPreview();
    if (isManual) { setSaved(true); setTimeout(() => setSaved(false), 2000); }
  }

  function refreshPreview() {
    if (!iframeRef.current) return;
    setPreviewRefreshing(true);
    iframeRef.current.src = `/site/${slug}?_t=${Date.now()}`;
    setTimeout(() => setPreviewRefreshing(false), 1200);
  }

  async function save() {
    setSaving(true);
    await pushLayout(sections, heroData, true);
    setSaving(false);
  }

  function schedulePreview(newSections: SectionState[], newHero?: HeroData) {
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(() => {
      pushLayout(newSections, newHero ?? heroData, false);
    }, 900);
  }

  function updateSection(index: number, patch: Partial<SectionState>) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      schedulePreview(next, heroData);
      return next;
    });
  }

  function updateHero(field: keyof HeroData, value: string | number) {
    setHeroData((prev) => {
      const next = { ...prev, [field]: value };
      schedulePreview(sections, next);
      return next;
    });
  }

  // ---- Drag-to-reorder ----
  function handleDragStart(index: number) { dragItem.current = index; }
  function handleDragEnter(index: number) { setDragOverIndex(index); }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverIndex === null) { dragItem.current = null; setDragOverIndex(null); return; }
    if (dragItem.current !== dragOverIndex) {
      setSections((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragItem.current!, 1);
        next.splice(dragOverIndex, 0, moved);
        schedulePreview(next, heroData);
        return next;
      });
    }
    dragItem.current = null; setDragOverIndex(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px]">
        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* ---- LEFT PANEL ---- */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:max-h-screen lg:sticky lg:top-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Diseño del Sitio</h1>
            <p className="text-xs text-gray-400 mt-0.5">Personaliza cada sección en detalle</p>
          </div>
          <button onClick={save} disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-60"
            style={{ backgroundColor: "#3b82f6" }}>
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          {(["sections", "hero"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === tab ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}>
              {tab === "sections" ? "🗂 Secciones" : "🖼 Hero / Banner"}
            </button>
          ))}
        </div>

        {/* ===== HERO TAB ===== */}
        {activeTab === "hero" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs text-gray-400">Personaliza el banner principal. Los campos vacíos usan los valores por defecto del sitio.</p>
            {[
              { label: "Título principal", field: "title" as const, type: "text", placeholder: "Ej: Bienvenido a Mi Negocio" },
              { label: "Texto del botón CTA", field: "ctaText" as const, type: "text", placeholder: "Ej: Ver Servicios" },
              { label: "URL del botón CTA", field: "ctaUrl" as const, type: "text", placeholder: "Ej: #servicios" },
            ].map(({ label, field, type, placeholder }) => (
              <div key={field}>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
                <input type={type} placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  value={(heroData[field] as string) ?? ""}
                  onChange={(e) => updateHero(field, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subtítulo / Descripción</label>
              <textarea rows={2} placeholder="Ej: Los mejores servicios al mejor precio"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                value={heroData.subtitle ?? ""} onChange={(e) => updateHero("subtitle", e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen de fondo (URL)</label>
              <input type="url" placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                value={heroData.bgImage ?? ""} onChange={(e) => updateHero("bgImage", e.target.value)} />
              {heroData.bgImage && (
                <div className="mt-2 rounded-lg overflow-hidden h-20 bg-gray-100 border border-gray-200">
                  <img src={heroData.bgImage} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Opacidad overlay: {heroData.overlay ?? 50}%</label>
              <input type="range" min={0} max={90} step={5} className="w-full"
                value={heroData.overlay ?? 50} onChange={(e) => updateHero("overlay", Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alineación del texto</label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button key={align} onClick={() => updateHero("align", align)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${heroData.align === align ? "border-blue-400 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                    {align === "left" ? "⬅" : align === "center" ? "↔" : "➡"}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={save} disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: "#3b82f6" }}>
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar Hero"}
            </button>
          </div>
        )}

        {/* ===== SECTIONS TAB ===== */}
        {activeTab === "sections" && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 select-none">
            {sections.map((sec, index) => {
              const isDragging = dragItem.current === index;
              const isOver = dragOverIndex === index && dragItem.current !== null && dragItem.current !== index;
              const icon = SECTION_ICONS[sec.key] ?? "▪";
              const isExpanded = expandedKey === sec.key;
              const hasCustomStyle = !!(sec.bgColor || sec.bgImage || sec.textColor || sec.paddingY || sec.paddingX || sec.minHeight || sec.width !== "100%");

              return (
                <div key={sec.key}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={`bg-white rounded-xl border transition-all overflow-hidden ${isDragging ? "opacity-40 scale-95" : ""} ${isOver ? "border-blue-400 shadow-md" : isExpanded ? "border-blue-300 shadow-sm" : "border-gray-200"}`}>

                  {/* Card row */}
                  <div className="flex items-center gap-2 px-3 py-3">
                    <span className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg flex-shrink-0" title="Arrastrar">⠿</span>
                    <span className="text-lg flex-shrink-0">{icon}</span>

                    {/* Clickable label to expand */}
                    <button className="flex-1 text-left min-w-0" onClick={() => setExpandedKey(isExpanded ? null : sec.key)}>
                      <span className={`font-semibold text-sm block truncate ${sec.hidden ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {sec.label}
                      </span>
                      {hasCustomStyle && !isExpanded && (
                        <span className="text-xs text-blue-500">Personalizado</span>
                      )}
                    </button>

                    {/* Indicators */}
                    {sec.minHeight && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded flex-shrink-0">{sec.minHeight}px</span>
                    )}

                    {/* Expand button */}
                    <button onClick={() => setExpandedKey(isExpanded ? null : sec.key)}
                      className={`text-base flex-shrink-0 transition-transform duration-200 ${isExpanded ? "rotate-180 text-blue-500" : "text-gray-400 hover:text-gray-600"}`}
                      title="Editar en detalle">
                      ▾
                    </button>

                    {/* Visibility */}
                    <button onClick={() => updateSection(index, { hidden: !sec.hidden })}
                      className={`text-base flex-shrink-0 transition-colors ${sec.hidden ? "text-gray-300 hover:text-gray-500" : "text-gray-500 hover:text-blue-600"}`}
                      title={sec.hidden ? "Mostrar" : "Ocultar"}>
                      {sec.hidden ? "🙈" : "👁"}
                    </button>
                  </div>

                  {/* ---- DETAIL PANEL (expanded) ---- */}
                  {isExpanded && (
                    <div className="border-t border-blue-100 bg-blue-50/40 px-4 py-4 space-y-5">

                      {/* === DIMENSIONES === */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">📐 Dimensiones</p>

                        {/* Alto mínimo */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">Alto mínimo</label>
                            <div className="flex items-center gap-1">
                              <input type="number" min={0} max={2000} step={10}
                                className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:border-blue-400"
                                value={sec.minHeight ?? ""}
                                placeholder="auto"
                                onChange={(e) => updateSection(index, { minHeight: e.target.value ? Number(e.target.value) : null })} />
                              <span className="text-xs text-gray-400">px</span>
                              {sec.minHeight && (
                                <button onClick={() => updateSection(index, { minHeight: null })} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
                              )}
                            </div>
                          </div>
                          <input type="range" min={0} max={1200} step={10} className="w-full h-1.5 accent-blue-500"
                            value={sec.minHeight ?? 0}
                            onChange={(e) => updateSection(index, { minHeight: Number(e.target.value) || null })} />
                          <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>0</span><span>1200px</span></div>
                        </div>

                        {/* Alto máximo */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">Alto máximo</label>
                            <div className="flex items-center gap-1">
                              <input type="number" min={0} max={2000} step={10}
                                className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:border-blue-400"
                                value={sec.maxHeight ?? ""}
                                placeholder="auto"
                                onChange={(e) => updateSection(index, { maxHeight: e.target.value ? Number(e.target.value) : null })} />
                              <span className="text-xs text-gray-400">px</span>
                              {sec.maxHeight && (
                                <button onClick={() => updateSection(index, { maxHeight: null })} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
                              )}
                            </div>
                          </div>
                          <input type="range" min={0} max={1200} step={10} className="w-full h-1.5 accent-blue-500"
                            value={sec.maxHeight ?? 0}
                            onChange={(e) => updateSection(index, { maxHeight: Number(e.target.value) || null })} />
                        </div>

                        {/* Padding vertical */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">Padding vertical</label>
                            <div className="flex items-center gap-1">
                              <input type="number" min={0} max={400} step={4}
                                className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:border-blue-400"
                                value={sec.paddingY ?? ""}
                                placeholder="auto"
                                onChange={(e) => updateSection(index, { paddingY: e.target.value ? Number(e.target.value) : null })} />
                              <span className="text-xs text-gray-400">px</span>
                              {sec.paddingY && (
                                <button onClick={() => updateSection(index, { paddingY: null })} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
                              )}
                            </div>
                          </div>
                          <input type="range" min={0} max={400} step={4} className="w-full h-1.5 accent-blue-500"
                            value={sec.paddingY ?? 0}
                            onChange={(e) => updateSection(index, { paddingY: Number(e.target.value) || null })} />
                          <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>0</span><span>400px</span></div>
                        </div>

                        {/* Padding horizontal */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-gray-600">Padding horizontal</label>
                            <div className="flex items-center gap-1">
                              <input type="number" min={0} max={400} step={4}
                                className="w-16 border border-gray-200 rounded px-2 py-0.5 text-xs text-center focus:outline-none focus:border-blue-400"
                                value={sec.paddingX ?? ""}
                                placeholder="auto"
                                onChange={(e) => updateSection(index, { paddingX: e.target.value ? Number(e.target.value) : null })} />
                              <span className="text-xs text-gray-400">px</span>
                              {sec.paddingX && (
                                <button onClick={() => updateSection(index, { paddingX: null })} className="text-gray-300 hover:text-red-400 text-xs ml-1">✕</button>
                              )}
                            </div>
                          </div>
                          <input type="range" min={0} max={400} step={4} className="w-full h-1.5 accent-blue-500"
                            value={sec.paddingX ?? 0}
                            onChange={(e) => updateSection(index, { paddingX: Number(e.target.value) || null })} />
                        </div>

                        {/* Ancho máximo */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Ancho máximo</label>
                          <select
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"
                            value={sec.width}
                            onChange={(e) => updateSection(index, { width: e.target.value })}>
                            {WIDTH_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* === FONDO === */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">🎨 Fondo</p>

                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex-1">
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Color de fondo</label>
                            <div className="flex items-center gap-2">
                              <input type="color"
                                className="w-10 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                                value={sec.bgColor || "#ffffff"}
                                onChange={(e) => updateSection(index, { bgColor: e.target.value })} />
                              <input type="text"
                                className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 font-mono"
                                value={sec.bgColor}
                                placeholder="#ffffff o vacío"
                                onChange={(e) => updateSection(index, { bgColor: e.target.value })} />
                              {sec.bgColor && (
                                <button onClick={() => updateSection(index, { bgColor: "" })} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen de fondo (URL)</label>
                          <input type="url" placeholder="https://..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-400"
                            value={sec.bgImage}
                            onChange={(e) => updateSection(index, { bgImage: e.target.value })} />
                          {sec.bgImage && (
                            <div className="mt-1.5 rounded-lg overflow-hidden h-16 bg-gray-100 border border-gray-200 relative group">
                              <img src={sec.bgImage} alt="preview" className="w-full h-full object-cover"
                                onError={(e) => (e.currentTarget.style.display = "none")} />
                              <button onClick={() => updateSection(index, { bgImage: "" })}
                                className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                            </div>
                          )}
                        </div>

                        {sec.bgImage && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Oscurecer imagen: {sec.bgOverlay}%</label>
                            <input type="range" min={0} max={90} step={5} className="w-full h-1.5 accent-blue-500"
                              value={sec.bgOverlay}
                              onChange={(e) => updateSection(index, { bgOverlay: Number(e.target.value) })} />
                            <div className="flex justify-between text-xs text-gray-300 mt-0.5"><span>Sin oscurecer</span><span>90%</span></div>
                          </div>
                        )}
                      </div>

                      {/* === TEXTO === */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">✏️ Texto</p>
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">Color del texto</label>
                          <div className="flex items-center gap-2">
                            <input type="color"
                              className="w-10 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
                              value={sec.textColor || "#000000"}
                              onChange={(e) => updateSection(index, { textColor: e.target.value })} />
                            <input type="text"
                              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-400 font-mono"
                              value={sec.textColor}
                              placeholder="#000000 o vacío"
                              onChange={(e) => updateSection(index, { textColor: e.target.value })} />
                            {sec.textColor && (
                              <button onClick={() => updateSection(index, { textColor: "" })} className="text-gray-300 hover:text-red-400 text-xs">✕</button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reset all */}
                      <button
                        onClick={() => updateSection(index, {
                          minHeight: null, maxHeight: null, paddingY: null, paddingX: null,
                          width: "100%", bgColor: "", bgImage: "", bgOverlay: 0, textColor: "",
                        })}
                        className="w-full py-2 rounded-lg text-xs text-gray-400 border border-gray-200 hover:border-red-300 hover:text-red-400 transition-colors">
                        Restablecer sección
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "sections" && (
          <div className="p-3 border-t border-gray-100 flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">
              ⠿ arrastrar · 👁 ocultar · ▾ editar · preview automático
            </p>
          </div>
        )}
      </div>

      {/* ---- RIGHT PANEL: Preview ---- */}
      <div className="flex-1 bg-gray-100 flex flex-col min-h-[60vh] lg:min-h-screen">
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 rounded px-3 py-1 font-mono hidden sm:inline">/site/{slug}</span>
            {previewRefreshing && (
              <span className="text-xs text-blue-500 flex items-center gap-1 ml-2">
                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                Actualizando...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={refreshPreview} className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 hover:bg-gray-50 transition-colors">
              ↻ Actualizar
            </button>
            <a href={`/site/${slug}`} target="_blank" className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition-colors">
              Abrir ↗
            </a>
          </div>
        </div>
        <div className="flex-1 p-4">
          <iframe ref={iframeRef} src={`/site/${slug}`}
            className="w-full h-full rounded-xl border border-gray-200 shadow-sm bg-white"
            style={{ minHeight: "calc(100vh - 120px)" }}
            title="Vista previa del sitio" />
        </div>
      </div>
    </div>
  );
}
