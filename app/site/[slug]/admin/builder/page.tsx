"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";

// ---- Types ----
type BlockType = "gallery" | "stats" | "testimonials" | "faq" | "cta" | "text" | "pricing" | "team" | "video" | "schedule" | "map" | "features";
type BlockWidth = "full" | "1/2" | "1/3";

interface PageBlock { id: string; type: BlockType; config: any; order: number; width?: BlockWidth; }

const BLOCK_PALETTE: { type: BlockType; icon: string; label: string; description: string }[] = [
  { type: "gallery",       icon: "🖼️",  label: "Galeria de fotos",   description: "Muestra hasta 8 imagenes en grilla" },
  { type: "stats",         icon: "📊",  label: "Estadisticas",       description: "Numeros destacados (500+ clientes, 10 años...)" },
  { type: "testimonials",  icon: "💬",  label: "Testimonios",        description: "Opiniones y resenas de clientes" },
  { type: "faq",           icon: "❓",  label: "Preguntas frecuentes", description: "Acordeon de preguntas y respuestas" },
  { type: "cta",           icon: "📣",  label: "Banner CTA",         description: "Llamado a la accion con boton" },
  { type: "text",          icon: "📝",  label: "Bloque de texto",    description: "Parrafo libre con titulo" },
  { type: "pricing",       icon: "💰",  label: "Precios / Planes",   description: "Tabla de planes con caracteristicas y botones" },
  { type: "team",          icon: "👥",  label: "Equipo",             description: "Tarjetas de miembros del equipo" },
  { type: "video",         icon: "▶️",  label: "Video",              description: "Embed de YouTube o Vimeo" },
  { type: "schedule",      icon: "🕐",  label: "Horarios",           description: "Tabla de horarios de atencion" },
  { type: "map",           icon: "📍",  label: "Mapa / Ubicacion",   description: "Google Maps embebido" },
  { type: "features",      icon: "✨",  label: "Caracteristicas",    description: "Grid de ventajas con iconos" },
];

function defaultConfig(type: BlockType): any {
  switch (type) {
    case "gallery":      return { title: "Nuestra galeria", images: ["", "", ""] };
    case "stats":        return { title: "Nuestros numeros", items: [{ value: "500+", label: "Clientes satisfechos" }, { value: "10", label: "Anos de experiencia" }, { value: "100%", label: "Compromiso" }] };
    case "testimonials": return { title: "Lo que dicen de nosotros", items: [{ text: "Excelente servicio, muy recomendable.", author: "Maria G.", role: "Cliente" }] };
    case "faq":          return { title: "Preguntas frecuentes", items: [{ q: "¿Como puedo hacer una reserva?", a: "Puedes llamarnos o reservar directamente desde la web." }] };
    case "cta":          return { title: "¿Listo para comenzar?", subtitle: "Contáctanos y recibe una consulta gratuita", buttonText: "Contactar ahora", buttonUrl: "" };
    case "text":         return { title: "Sobre nosotros", body: "Escribe aqui el contenido de esta seccion.", align: "center" };
    case "pricing":      return { title: "Nuestros planes", subtitle: "Elige el plan que mejor se adapte a ti", plans: [{ name: "Basico", price: "$99", period: "mes", features: ["Caracteristica 1", "Caracteristica 2"], ctaText: "Comenzar", ctaUrl: "", highlight: false }, { name: "Pro", price: "$199", period: "mes", features: ["Todo lo del Basico", "Soporte prioritario", "Sin limites"], ctaText: "Comenzar", ctaUrl: "", highlight: true }] };
    case "team":         return { title: "Nuestro equipo", members: [{ name: "Juan Perez", role: "Director", bio: "Mas de 10 años de experiencia en el sector.", photo: "" }] };
    case "video":        return { title: "Conocenos", url: "", caption: "" };
    case "schedule":     return { title: "Horarios de atencion", items: [{ day: "Lunes", open: "08:00", close: "18:00" }, { day: "Martes", open: "08:00", close: "18:00" }, { day: "Miercoles", open: "08:00", close: "18:00" }, { day: "Jueves", open: "08:00", close: "18:00" }, { day: "Viernes", open: "08:00", close: "18:00" }, { day: "Sabado", open: "09:00", close: "13:00" }, { day: "Domingo", open: "", close: "", closed: true }], note: "" };
    case "map":          return { title: "Donde estamos", embedUrl: "", address: "", height: 350 };
    case "features":     return { title: "Por que elegirnos", subtitle: "Estas son nuestras ventajas", items: [{ icon: "⭐", title: "Experiencia", description: "Anos de trayectoria en el sector" }, { icon: "🎯", title: "Precision", description: "Atención personalizada para cada cliente" }, { icon: "💎", title: "Calidad", description: "Los mejores materiales y profesionales" }] };
    default:             return {};
  }
}

// ---- Helper: unique ID ----
const uid = () => Math.random().toString(36).slice(2, 9);

// ---- Block config editors ----
function GalleryEditor({ config, onChange, slug }: { config: any; onChange: (c: any) => void; slug?: string }) {
  const images: string[] = config.images || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo de la seccion">
        <input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} />
      </Field>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Imagenes</label>
        <div className="space-y-3">
          {images.map((url, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1">
                <ImageUpload
                  value={url}
                  onChange={(next) => {
                    const arr = [...images]; arr[i] = next; onChange({ ...config, images: arr });
                  }}
                  slug={slug}
                  label=""
                  previewHeight="h-12"
                />
              </div>
              <button type="button" className="text-red-400 hover:text-red-600 px-1 mt-8 flex-shrink-0" onClick={() => { const next = images.filter((_, j) => j !== i); onChange({ ...config, images: next }); }}>×</button>
            </div>
          ))}
          {images.length < 8 && (
            <button type="button" className={addBtn} onClick={() => onChange({ ...config, images: [...images, ""] })}>+ Agregar imagen</button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatsEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: any[] = config.items || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Estadisticas</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input className={inp + " w-28"} value={item.value || ""} placeholder="500+" onChange={(e) => { const next = [...items]; next[i] = { ...item, value: e.target.value }; onChange({ ...config, items: next }); }} />
              <input className={inp + " flex-1"} value={item.label || ""} placeholder="Clientes" onChange={(e) => { const next = [...items]; next[i] = { ...item, label: e.target.value }; onChange({ ...config, items: next }); }} />
              <button type="button" className="text-red-400 hover:text-red-600 px-2" onClick={() => onChange({ ...config, items: items.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          {items.length < 4 && <button type="button" className={addBtn} onClick={() => onChange({ ...config, items: [...items, { value: "", label: "" }] })}>+ Agregar stat</button>}
        </div>
      </div>
    </div>
  );
}

function TestimonialsEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: any[] = config.items || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Testimonios</label>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <textarea className={inp + " resize-none"} rows={2} value={item.text || ""} placeholder="Excelente servicio..." onChange={(e) => { const next = [...items]; next[i] = { ...item, text: e.target.value }; onChange({ ...config, items: next }); }} />
              <div className="flex gap-2">
                <input className={inp + " flex-1"} value={item.author || ""} placeholder="Nombre" onChange={(e) => { const next = [...items]; next[i] = { ...item, author: e.target.value }; onChange({ ...config, items: next }); }} />
                <input className={inp + " flex-1"} value={item.role || ""} placeholder="Rol/Empresa" onChange={(e) => { const next = [...items]; next[i] = { ...item, role: e.target.value }; onChange({ ...config, items: next }); }} />
                <button type="button" className="text-red-400 hover:text-red-600 px-2 flex-shrink-0" onClick={() => onChange({ ...config, items: items.filter((_, j) => j !== i) })}>×</button>
              </div>
            </div>
          ))}
          {items.length < 6 && <button type="button" className={addBtn} onClick={() => onChange({ ...config, items: [...items, { text: "", author: "", role: "" }] })}>+ Agregar testimonio</button>}
        </div>
      </div>
    </div>
  );
}

function FaqEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: any[] = config.items || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-2">Preguntas y respuestas</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <input className={inp} value={item.q || ""} placeholder="Pregunta..." onChange={(e) => { const next = [...items]; next[i] = { ...item, q: e.target.value }; onChange({ ...config, items: next }); }} />
              <textarea className={inp + " resize-none"} rows={2} value={item.a || ""} placeholder="Respuesta..." onChange={(e) => { const next = [...items]; next[i] = { ...item, a: e.target.value }; onChange({ ...config, items: next }); }} />
              <button type="button" className="text-xs text-red-400 hover:text-red-600" onClick={() => onChange({ ...config, items: items.filter((_, j) => j !== i) })}>Eliminar pregunta</button>
            </div>
          ))}
          {items.length < 10 && <button type="button" className={addBtn} onClick={() => onChange({ ...config, items: [...items, { q: "", a: "" }] })}>+ Agregar pregunta</button>}
        </div>
      </div>
    </div>
  );
}

function CtaEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Titulo *"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="Subtitulo (opcional)"><input className={inp} value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} /></Field>
      <Field label="Texto del boton"><input className={inp} value={config.buttonText || ""} onChange={(e) => onChange({ ...config, buttonText: e.target.value })} placeholder="Contactar ahora" /></Field>
      <Field label="URL del boton (opcional)"><input className={inp} value={config.buttonUrl || ""} onChange={(e) => onChange({ ...config, buttonUrl: e.target.value })} placeholder="https://... o #seccion" /></Field>
    </div>
  );
}

function TextEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Titulo (opcional)"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="Contenido">
        <textarea className={inp + " resize-none"} rows={5} value={config.body || ""} onChange={(e) => onChange({ ...config, body: e.target.value })} placeholder="Escribe el contenido de esta seccion..." />
      </Field>
      <Field label="Alineacion">
        <select className={inp} value={config.align || "center"} onChange={(e) => onChange({ ...config, align: e.target.value })}>
          <option value="center">Centrado</option>
          <option value="left">Izquierda</option>
        </select>
      </Field>
    </div>
  );
}

// ---- Shared UI pieces ----
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white";
const addBtn = "text-xs text-blue-600 hover:text-blue-800 font-medium border border-dashed border-blue-300 rounded-lg px-3 py-1.5 w-full hover:bg-blue-50 transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      {children}
    </div>
  );
}

function PricingEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const plans: any[] = config.plans || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="Subtitulo"><input className={inp} value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} /></Field>
      {plans.map((plan, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Plan {i + 1}</span>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-xs text-gray-500"><input type="checkbox" checked={!!plan.highlight} onChange={(e) => { const n=[...plans]; n[i]={...plan,highlight:e.target.checked}; onChange({...config,plans:n}); }} /> Popular</label>
              <button type="button" className="text-red-400 hover:text-red-600 text-xs" onClick={() => onChange({...config,plans:plans.filter((_,j)=>j!==i)})}>× Eliminar</button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input className={inp} placeholder="Nombre" value={plan.name||""} onChange={(e)=>{const n=[...plans];n[i]={...plan,name:e.target.value};onChange({...config,plans:n});}} />
            <input className={inp} placeholder="Precio ($99)" value={plan.price||""} onChange={(e)=>{const n=[...plans];n[i]={...plan,price:e.target.value};onChange({...config,plans:n});}} />
            <input className={inp} placeholder="Periodo (mes)" value={plan.period||""} onChange={(e)=>{const n=[...plans];n[i]={...plan,period:e.target.value};onChange({...config,plans:n});}} />
          </div>
          <textarea className={inp+" resize-none"} rows={3} placeholder={"Caracteristica 1\nCaracteristica 2"} value={(plan.features||[]).join("\n")} onChange={(e)=>{const n=[...plans];n[i]={...plan,features:e.target.value.split("\n")};onChange({...config,plans:n});}} />
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Texto boton" value={plan.ctaText||""} onChange={(e)=>{const n=[...plans];n[i]={...plan,ctaText:e.target.value};onChange({...config,plans:n});}} />
            <input className={inp} placeholder="URL boton" value={plan.ctaUrl||""} onChange={(e)=>{const n=[...plans];n[i]={...plan,ctaUrl:e.target.value};onChange({...config,plans:n});}} />
          </div>
        </div>
      ))}
      {plans.length < 4 && <button type="button" className={addBtn} onClick={()=>onChange({...config,plans:[...plans,{name:"",price:"",period:"mes",features:[],ctaText:"Comenzar",ctaUrl:"",highlight:false}]})}>+ Agregar plan</button>}
    </div>
  );
}

function TeamEditor({ config, onChange, slug }: { config: any; onChange: (c: any) => void; slug?: string }) {
  const members: any[] = config.members || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      {members.map((m, i) => (
        <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase">Miembro {i+1}</span>
            <button type="button" className="text-red-400 text-xs" onClick={()=>onChange({...config,members:members.filter((_,j)=>j!==i)})}>× Eliminar</button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Nombre" value={m.name||""} onChange={(e)=>{const n=[...members];n[i]={...m,name:e.target.value};onChange({...config,members:n});}} />
            <input className={inp} placeholder="Cargo / Rol" value={m.role||""} onChange={(e)=>{const n=[...members];n[i]={...m,role:e.target.value};onChange({...config,members:n});}} />
          </div>
          <input className={inp} placeholder="Breve bio (opcional)" value={m.bio||""} onChange={(e)=>{const n=[...members];n[i]={...m,bio:e.target.value};onChange({...config,members:n});}} />
          <ImageUpload value={m.photo||""} onChange={(v)=>{const n=[...members];n[i]={...m,photo:v};onChange({...config,members:n});}} slug={slug} label="Foto" previewHeight="h-12" />
        </div>
      ))}
      {members.length < 8 && <button type="button" className={addBtn} onClick={()=>onChange({...config,members:[...members,{name:"",role:"",bio:"",photo:""}]})}>+ Agregar miembro</button>}
    </div>
  );
}

function VideoEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Titulo (opcional)"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="URL del video (YouTube o Vimeo)"><input className={inp} value={config.url || ""} placeholder="https://www.youtube.com/watch?v=..." onChange={(e) => onChange({ ...config, url: e.target.value })} /></Field>
      <Field label="Pie de video (opcional)"><input className={inp} value={config.caption || ""} onChange={(e) => onChange({ ...config, caption: e.target.value })} /></Field>
    </div>
  );
}

function ScheduleEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: any[] = config.items || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input className={inp + " w-28"} placeholder="Lunes" value={item.day||""} onChange={(e)=>{const n=[...items];n[i]={...item,day:e.target.value};onChange({...config,items:n});}} />
            <label className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0"><input type="checkbox" checked={!!item.closed} onChange={(e)=>{const n=[...items];n[i]={...item,closed:e.target.checked};onChange({...config,items:n});}} />Cerrado</label>
            {!item.closed && (<><input className={inp + " w-20"} placeholder="09:00" value={item.open||""} onChange={(e)=>{const n=[...items];n[i]={...item,open:e.target.value};onChange({...config,items:n});}} /><span className="text-gray-400 flex-shrink-0">–</span><input className={inp + " w-20"} placeholder="18:00" value={item.close||""} onChange={(e)=>{const n=[...items];n[i]={...item,close:e.target.value};onChange({...config,items:n});}} /></>)}
            <button type="button" className="text-red-400 hover:text-red-600 text-sm flex-shrink-0" onClick={()=>onChange({...config,items:items.filter((_,j)=>j!==i)})}>×</button>
          </div>
        ))}
        <button type="button" className={addBtn} onClick={()=>onChange({...config,items:[...items,{day:"",open:"",close:"",closed:false}]})}>+ Agregar dia</button>
      </div>
      <Field label="Nota adicional (opcional)"><input className={inp} value={config.note || ""} onChange={(e) => onChange({ ...config, note: e.target.value })} /></Field>
    </div>
  );
}

function MapEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  return (
    <div className="space-y-3">
      <Field label="Titulo (opcional)"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="URL del embed de Google Maps"><input className={inp} value={config.embedUrl || ""} placeholder="https://www.google.com/maps/embed?pb=..." onChange={(e) => onChange({ ...config, embedUrl: e.target.value })} /></Field>
      <Field label="Direccion visible (opcional)"><input className={inp} value={config.address || ""} placeholder="Calle 123, Ciudad" onChange={(e) => onChange({ ...config, address: e.target.value })} /></Field>
      <Field label="Altura del mapa (px)"><input type="number" className={inp} value={config.height || 350} min={200} max={600} onChange={(e) => onChange({ ...config, height: Number(e.target.value) })} /></Field>
    </div>
  );
}

function FeaturesEditor({ config, onChange }: { config: any; onChange: (c: any) => void }) {
  const items: any[] = config.items || [];
  return (
    <div className="space-y-3">
      <Field label="Titulo"><input className={inp} value={config.title || ""} onChange={(e) => onChange({ ...config, title: e.target.value })} /></Field>
      <Field label="Subtitulo"><input className={inp} value={config.subtitle || ""} onChange={(e) => onChange({ ...config, subtitle: e.target.value })} /></Field>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input className={inp + " w-14 text-center"} placeholder="⭐" value={item.icon||""} onChange={(e)=>{const n=[...items];n[i]={...item,icon:e.target.value};onChange({...config,items:n});}} />
          <input className={inp + " flex-1"} placeholder="Titulo" value={item.title||""} onChange={(e)=>{const n=[...items];n[i]={...item,title:e.target.value};onChange({...config,items:n});}} />
          <input className={inp + " flex-1"} placeholder="Descripcion" value={item.description||""} onChange={(e)=>{const n=[...items];n[i]={...item,description:e.target.value};onChange({...config,items:n});}} />
          <button type="button" className="text-red-400 hover:text-red-600 text-sm flex-shrink-0 mt-2" onClick={()=>onChange({...config,items:items.filter((_,j)=>j!==i)})}>×</button>
        </div>
      ))}
      {items.length < 9 && <button type="button" className={addBtn} onClick={()=>onChange({...config,items:[...items,{icon:"",title:"",description:""}]})}>+ Agregar caracteristica</button>}
    </div>
  );
}

function BlockEditor({ block, onChange, slug }: { block: PageBlock; onChange: (c: any) => void; slug?: string }) {
  switch (block.type) {
    case "gallery":      return <GalleryEditor config={block.config} onChange={onChange} slug={slug} />;
    case "stats":        return <StatsEditor config={block.config} onChange={onChange} />;
    case "testimonials": return <TestimonialsEditor config={block.config} onChange={onChange} />;
    case "faq":          return <FaqEditor config={block.config} onChange={onChange} />;
    case "cta":          return <CtaEditor config={block.config} onChange={onChange} />;
    case "text":         return <TextEditor config={block.config} onChange={onChange} />;
    case "pricing":      return <PricingEditor config={block.config} onChange={onChange} />;
    case "team":         return <TeamEditor config={block.config} onChange={onChange} slug={slug} />;
    case "video":        return <VideoEditor config={block.config} onChange={onChange} />;
    case "schedule":     return <ScheduleEditor config={block.config} onChange={onChange} />;
    case "map":          return <MapEditor config={block.config} onChange={onChange} />;
    case "features":     return <FeaturesEditor config={block.config} onChange={onChange} />;
    default:             return null;
  }
}

// ---- Main page ----
export default function BuilderPage() {
  const { slug } = useParams() as { slug: string };
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Drag-and-drop state
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);

  useEffect(() => {
    fetch(`/api/site/${slug}/customize`).then(async (r) => {
      if (r.ok) {
        const d = await r.json();
        try { setBlocks(JSON.parse(d.pageBlocks || "[]")); } catch {}
      }
      setLoading(false);
    });
  }, [slug]);

  function addBlock(type: BlockType) {
    const block: PageBlock = { id: uid(), type, config: defaultConfig(type), order: blocks.length };
    setBlocks((p) => [...p, block]);
    setExpanded(block.id);
  }

  function updateConfig(id: string, config: any) {
    setBlocks((p) => p.map((b) => b.id === id ? { ...b, config } : b));
  }

  function removeBlock(id: string) {
    setBlocks((p) => p.filter((b) => b.id !== id));
    if (expanded === id) setExpanded(null);
  }

  function moveBlock(id: string, dir: -1 | 1) {
    setBlocks((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((b) => b.id === id);
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= sorted.length) return prev;
      const next = sorted.map((b, i) => {
        if (i === idx) return { ...b, order: sorted[newIdx].order };
        if (i === newIdx) return { ...b, order: sorted[idx].order };
        return b;
      });
      return next;
    });
  }

  function setBlockWidth(id: string, width: BlockWidth) {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, width } : b));
  }

  function handleDragStart(id: string) {
    dragItem.current = id;
  }

  function handleDragEnter(id: string) {
    if (dragItem.current !== id) setDragOverId(id);
  }

  function handleDragEnd() {
    const from = dragItem.current;
    const to = dragOverId;
    dragItem.current = null;
    setDragOverId(null);
    if (!from || !to || from === to) return;
    setBlocks((prev) => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const fromIdx = sorted.findIndex((b) => b.id === from);
      const toIdx = sorted.findIndex((b) => b.id === to);
      const reordered = [...sorted];
      const [moved] = reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, moved);
      return reordered.map((b, i) => ({ ...b, order: i }));
    });
  }

  async function handleSave() {
    setSaving(true);
    const ordered = [...blocks].sort((a, b) => a.order - b.order).map((b, i) => ({ ...b, order: i }));
    await fetch(`/api/site/${slug}/customize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageBlocks: JSON.stringify(ordered) }),
    });
    setBlocks(ordered);
    setSaving(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
    if (iframeRef.current) iframeRef.current.src = iframeRef.current.src;
  }

  const sorted = [...blocks].sort((a, b) => a.order - b.order);
  const palette = BLOCK_PALETTE;

  if (loading) return <div className="p-8 text-gray-400">Cargando constructor...</div>;

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-screen">
      {/* ---- LEFT PANEL ---- */}
      <div className="w-full lg:w-[420px] lg:flex-shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col overflow-hidden lg:max-h-screen lg:sticky lg:top-0">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Constructor de pagina</h1>
            <p className="text-xs text-gray-400 mt-0.5">Agrega secciones extra a tu sitio</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            {saving ? "Guardando..." : "Guardar"}
            {savedMsg && <span className="text-green-300">✓</span>}
          </button>
        </div>

        {/* Palette */}
        <div className="p-4 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Agregar seccion</p>
          <div className="grid grid-cols-2 gap-2">
            {palette.map((p) => (
              <button key={p.type} onClick={() => addBlock(p.type)}
                className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group">
                <span className="text-xl flex-shrink-0 mt-0.5">{p.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-700 truncate">{p.label}</p>
                  <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">{p.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {sorted.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-3xl mb-2">🧩</p>
              <p className="text-sm font-medium">No hay secciones aun</p>
              <p className="text-xs mt-1">Agrega bloques desde el panel de arriba</p>
            </div>
          )}
          {sorted.map((block, idx) => {
            const meta = palette.find((p) => p.type === block.type)!;
            const isExpanded = expanded === block.id;
            const isDragging = dragItem.current === block.id;
            const isDragOver = dragOverId === block.id;
            const w = block.width ?? "full";
            return (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(block.id)}
                onDragEnter={() => handleDragEnter(block.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className={`rounded-xl border transition-all select-none ${
                  isDragOver ? "border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-300" :
                  isExpanded ? "border-blue-300 bg-blue-50/40 shadow-sm" :
                  "border-gray-200 bg-white hover:border-gray-300"
                } ${isDragging ? "opacity-40" : ""}`}
              >
                {/* Block header */}
                <div className="flex items-center gap-1.5 px-2 py-2.5">
                  {/* Drag handle */}
                  <span className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing flex-shrink-0 px-1 text-base leading-none" title="Arrastar para reordenar">⠿</span>
                  <span className="text-base flex-shrink-0">{meta.icon}</span>
                  <button className="flex-1 text-left min-w-0" onClick={() => setExpanded(isExpanded ? null : block.id)}>
                    <p className="text-sm font-semibold text-gray-900 truncate">{meta.label}</p>
                    {block.config.title && <p className="text-xs text-gray-400 truncate">{block.config.title}</p>}
                  </button>

                  {/* Width control */}
                  <div className="flex gap-0.5 flex-shrink-0 border border-gray-200 rounded-lg p-0.5" title="Ancho del bloque">
                    {(["full", "1/2", "1/3"] as BlockWidth[]).map((bw) => (
                      <button key={bw} onClick={() => setBlockWidth(block.id, bw)}
                        title={bw === "full" ? "Ancho completo" : bw === "1/2" ? "Mitad" : "Un tercio"}
                        className={`h-5 px-1.5 rounded text-xs font-mono transition-colors ${
                          w === bw ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                        }`}>
                        {bw === "full" ? "1/1" : bw}
                      </button>
                    ))}
                  </div>

                  {/* Order buttons */}
                  <div className="flex gap-0.5 flex-shrink-0">
                    <button onClick={() => moveBlock(block.id, -1)} disabled={idx === 0}
                      className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors text-xs">↑</button>
                    <button onClick={() => moveBlock(block.id, 1)} disabled={idx === sorted.length - 1}
                      className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 transition-colors text-xs">↓</button>
                    <button onClick={() => removeBlock(block.id)}
                      className="w-5 h-5 rounded flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors text-xs">×</button>
                  </div>
                </div>
                {/* Block editor */}
                {isExpanded && (
                  <div className="px-3 pb-4 pt-1 border-t border-blue-200/50">
                    <BlockEditor block={block} onChange={(c) => updateConfig(block.id, c)} slug={slug} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer save */}
        {sorted.length > 0 && (
          <div className="p-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
              {saving ? "Guardando..." : savedMsg ? "✓ Guardado" : "Guardar cambios"}
            </button>
            {savedMsg && <p className="text-center text-xs text-green-600 mt-2">El preview se actualiza automaticamente</p>}
          </div>
        )}
      </div>

      {/* ---- RIGHT PANEL: PREVIEW ---- */}
      <div className="flex-1 bg-gray-100 flex flex-col min-h-[60vh] lg:min-h-screen">
        <div className="px-4 py-3 bg-white border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 rounded px-3 py-1 font-mono">
              /site/{slug}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => iframeRef.current && (iframeRef.current.src = iframeRef.current.src)}
              className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded px-3 py-1 hover:bg-gray-50 transition-colors">
              ↻ Actualizar
            </button>
            <a href={`/site/${slug}`} target="_blank"
              className="text-xs text-blue-600 hover:text-blue-800 border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition-colors">
              Abrir en nueva pestaña ↗
            </a>
          </div>
        </div>
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
