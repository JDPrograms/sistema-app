"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { TEMPLATE_SECTIONS, SectionDef } from "@/lib/template-sections";
import { SectionLayout, HeroData } from "@/lib/layout-config";

interface SectionState extends SectionDef {
  order: number;
  hidden: boolean;
  minHeight: number | null;
}

const SECTION_ICONS: Record<string, string> = {
  header: "🗂", hero: "🖼", services: "📋", booking: "📅", contact: "📞",
  blocks: "🧩", footer: "🔻", classes: "🏋️", trainers: "💪", team: "👥",
  staff: "🧑‍⚕️", menu: "🍽️", products: "📦", courses: "📚", instructors: "🎓",
  benefits: "🏆", specialties: "🩺", office: "🏥", areas: "⚖️", properties: "🏠",
  advisors: "🤝", rooms: "🛏️", amenities: "✨", extra: "ℹ️",
  portfolio: "🖼", specialty: "⭐", howItWorks: "🔄", trust: "🛡️", features: "✅",
};

const EMPTY_HERO: HeroData = { title: "", subtitle: "", bgImage: "", overlay: 50, ctaText: "", ctaUrl: "", align: "center" };

export default function SectionsAdminPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [activeTab, setActiveTab] = useState<"sections" | "hero">("sections");
  const [sections, setSections] = useState<SectionState[]>([]);
  const [heroData, setHeroData] = useState<HeroData>(EMPTY_HERO);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewRefreshing, setPreviewRefreshing] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const dragItem = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const resizeRef = useRef<{ index: number; startY: number; startHeight: number } | null>(null);
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
      const merged: SectionState[] = defs.map((def) => {
        const saved = savedSections.find((s) => s.key === def.key);
        return {
          ...def,
          order: saved?.order ?? def.defaultOrder,
          hidden: saved?.hidden ?? false,
          minHeight: saved?.minHeight ?? null,
        };
      });
      merged.sort((a, b) => a.order - b.order);
      setSections(merged);
      setHeroData(savedHero);
      setLoading(false);
    }
    load();
  }, [slug]);

  // Push layout to DB and refresh preview (used for both manual save and auto-preview)
  async function pushLayout(secs: SectionState[], hero: HeroData, isManual: boolean) {
    const layoutSections: SectionLayout[] = secs.map((s, i) => ({
      key: s.key,
      order: i,
      hidden: s.hidden,
      minHeight: s.minHeight,
    }));
    await fetch(`/api/site/${slug}/customize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ layoutConfig: JSON.stringify({ sections: layoutSections, heroData: hero }) }),
    });
    refreshPreview();
    if (isManual) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
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

  // Auto-preview: debounce 1.2s after any section/hero change
  function schedulePreview(newSections: SectionState[], newHero?: HeroData) {
    if (previewDebounce.current) clearTimeout(previewDebounce.current);
    previewDebounce.current = setTimeout(() => {
      pushLayout(newSections, newHero ?? heroData, false);
    }, 1200);
  }

  function updateHero(field: keyof HeroData, value: string | number) {
    setHeroData((prev) => {
      const next = { ...prev, [field]: value };
      schedulePreview(sections, next);
      return next;
    });
  }

  // ---- Drag-to-reorder ----
  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    setDragOverIndex(index);
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverIndex === null) {
      dragItem.current = null;
      setDragOverIndex(null);
      return;
    }
    if (dragItem.current !== dragOverIndex) {
      setSections((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragItem.current!, 1);
        next.splice(dragOverIndex, 0, moved);
        schedulePreview(next, heroData);
        return next;
      });
    }
    dragItem.current = null;
    setDragOverIndex(null);
  }

  // ---- Mouse-resize ----
  const handleResizeMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = {
      index,
      startY: e.clientY,
      startHeight: sections[index].minHeight ?? 80,
    };

    function onMouseMove(ev: MouseEvent) {
      if (!resizeRef.current) return;
      const delta = ev.clientY - resizeRef.current.startY;
      const newHeight = Math.max(40, resizeRef.current.startHeight + delta);
      setSections((prev) => {
        const next = [...prev];
        next[resizeRef.current!.index] = { ...next[resizeRef.current!.index], minHeight: Math.round(newHeight) };
        return next;
      });
    }

    function onMouseUp() {
      resizeRef.current = null;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      setSections((current) => {
        schedulePreview(current, heroData);
        return current;
      });
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [sections]);

  function toggleHidden(index: number) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], hidden: !next[index].hidden };
      schedulePreview(next, heroData);
      return next;
    });
  }

  function resetHeight(index: number) {
    setSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], minHeight: null };
      schedulePreview(next, heroData);
      return next;
    });
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
      {/* ---- LEFT PANEL: Controls ---- */}
      <div className="w-full lg:w-[400px] lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col lg:max-h-screen lg:sticky lg:top-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Diseño del Sitio</h1>
            <p className="text-xs text-gray-400 mt-0.5">Personaliza el aspecto de tu página</p>
          </div>
          <button
            onClick={save}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
            style={{ backgroundColor: "#3b82f6" }}
          >
            {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar"}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setActiveTab("sections")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "sections" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🗂 Secciones
          </button>
          <button
            onClick={() => setActiveTab("hero")}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "hero" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500 hover:text-gray-700"}`}
          >
            🖼 Hero / Banner
          </button>
        </div>

        {/* Hero editing panel */}
        {activeTab === "hero" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <p className="text-xs text-gray-400">Personaliza el banner principal de tu sitio. Los campos vacíos usan los valores por defecto del sitio.</p>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Título principal</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Ej: Bienvenido a Mi Negocio"
                value={heroData.title ?? ""}
                onChange={(e) => updateHero("title", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Subtítulo / Descripción</label>
              <textarea
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none"
                placeholder="Ej: Los mejores servicios al mejor precio"
                value={heroData.subtitle ?? ""}
                onChange={(e) => updateHero("subtitle", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Imagen de fondo (URL)</label>
              <input
                type="url"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="https://..."
                value={heroData.bgImage ?? ""}
                onChange={(e) => updateHero("bgImage", e.target.value)}
              />
              {heroData.bgImage && (
                <div className="mt-2 rounded-lg overflow-hidden h-24 bg-gray-100 border border-gray-200">
                  <img src={heroData.bgImage} alt="preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Opacidad del overlay: {heroData.overlay ?? 50}%</label>
              <input
                type="range" min={0} max={90} step={5}
                className="w-full"
                value={heroData.overlay ?? 50}
                onChange={(e) => updateHero("overlay", Number(e.target.value))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Texto del botón CTA</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Ej: Ver Servicios"
                value={heroData.ctaText ?? ""}
                onChange={(e) => updateHero("ctaText", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">URL del botón CTA</label>
              <input
                type="text"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                placeholder="Ej: #servicios"
                value={heroData.ctaUrl ?? ""}
                onChange={(e) => updateHero("ctaUrl", e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Alineación del texto</label>
              <div className="flex gap-2">
                {(["left", "center", "right"] as const).map((align) => (
                  <button
                    key={align}
                    onClick={() => updateHero("align", align)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${heroData.align === align ? "border-blue-400 text-blue-600 bg-blue-50" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {align === "left" ? "⬅ Izq" : align === "center" ? "↔ Centro" : "Dcha ➡"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={save}
              disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-60"
              style={{ backgroundColor: "#3b82f6" }}
            >
              {saving ? "Guardando..." : saved ? "✓ Guardado" : "Guardar cambios del Hero"}
            </button>
          </div>
        )}

        {/* Section list */}
        {activeTab === "sections" && <div className="flex-1 overflow-y-auto p-4 space-y-1 select-none">
          {sections.map((sec, index) => {
            const isDragging = dragItem.current === index;
            const isOver = dragOverIndex === index && dragItem.current !== null && dragItem.current !== index;
            const icon = SECTION_ICONS[sec.key] ?? "▪";
            const cardHeight = sec.minHeight ?? 64;

            return (
              <div
                key={sec.key}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`relative bg-white rounded-xl border transition-all ${
                  isDragging ? "opacity-40 scale-95" : "opacity-100"
                } ${isOver ? "border-blue-400 shadow-md" : "border-gray-200"}`}
                style={{ minHeight: `${cardHeight}px` }}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing text-lg select-none" title="Arrastrar para reordenar">
                    ⠿
                  </span>
                  <span className="text-xl">{icon}</span>
                  <span className={`font-medium text-sm flex-1 ${sec.hidden ? "line-through text-gray-400" : "text-gray-800"}`}>
                    {sec.label}
                  </span>

                  {sec.minHeight && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      {sec.minHeight}px
                      <button
                        onClick={() => resetHeight(index)}
                        className="text-gray-400 hover:text-red-400 leading-none"
                        title="Restablecer altura"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  <button
                    onClick={() => toggleHidden(index)}
                    className={`text-lg transition-colors ${sec.hidden ? "text-gray-300 hover:text-gray-500" : "text-gray-600 hover:text-blue-600"}`}
                    title={sec.hidden ? "Mostrar sección" : "Ocultar sección"}
                  >
                    {sec.hidden ? "🙈" : "👁"}
                  </button>
                </div>

                {/* Height visual bar */}
                {sec.minHeight && sec.minHeight > 64 && (
                  <div
                    className="mx-4 mb-2 rounded-lg opacity-30"
                    style={{ height: `${Math.min(sec.minHeight - 64, 120)}px`, backgroundColor: "#3b82f6" }}
                  />
                )}

                {/* Resize handle */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize rounded-b-xl flex items-center justify-center group"
                  onMouseDown={(e) => handleResizeMouseDown(e, index)}
                  title="Arrastrar para cambiar altura"
                >
                  <div className="w-8 h-0.5 bg-gray-200 group-hover:bg-blue-400 rounded-full transition-colors" />
                </div>
              </div>
            );
          })}
        </div>}

        {activeTab === "sections" && (
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs text-blue-700 font-medium mb-1">Cómo usar</p>
              <ul className="text-xs text-blue-600 space-y-0.5">
                <li>• <strong>Reordenar:</strong> arrastra desde ⠿</li>
                <li>• <strong>Cambiar altura:</strong> arrastra el borde inferior</li>
                <li>• <strong>Mostrar/ocultar:</strong> clic en el ojo 👁</li>
                <li>• El preview se actualiza automáticamente</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ---- RIGHT PANEL: Preview ---- */}
      <div className="flex-1 bg-gray-100 flex flex-col min-h-[60vh] lg:min-h-screen">
        {/* Preview toolbar */}
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 rounded px-3 py-1 font-mono hidden sm:inline">
              /site/{slug}
            </span>
            {previewRefreshing && (
              <span className="text-xs text-blue-500 flex items-center gap-1 ml-2">
                <span className="w-3 h-3 border border-blue-400 border-t-transparent rounded-full animate-spin" />
                Actualizando...
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={refreshPreview}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 hover:bg-gray-50 transition-colors"
            >
              ↻ Actualizar
            </button>
            <a
              href={`/site/${slug}`}
              target="_blank"
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition-colors"
            >
              Abrir ↗
            </a>
          </div>
        </div>

        {/* iframe */}
        <div className="flex-1 p-4">
          <iframe
            ref={iframeRef}
            src={`/site/${slug}`}
            className="w-full h-full rounded-xl border border-gray-200 shadow-sm bg-white"
            style={{ minHeight: "calc(100vh - 120px)" }}
            title="Vista previa del sitio"
          />
        </div>
      </div>
    </div>
  );
}
