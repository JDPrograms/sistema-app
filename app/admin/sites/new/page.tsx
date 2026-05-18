"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TEMPLATES = [
  { id: "barbershop", label: "Peluqueria / Barberia",      icon: "✂️",  color: "#1a1a2e", desc: "Barberías, peluquerías y salones de estilo",       features: ["Citas online", "Galeria de servicios", "Estilistas", "Chat IA"],          preview: ["Corte de cabello", "Barba", "Tinte", "Tratamientos"] },
  { id: "salon",      label: "Salon de Belleza / Spa",     icon: "💅",  color: "#be185d", desc: "Spas, salones de uñas, estética y bienestar",      features: ["Citas online", "Tratamientos", "Estilistas", "Chat IA"],                 preview: ["Manicura", "Facial", "Masajes", "Depilacion"] },
  { id: "restaurant", label: "Restaurante / Cafeteria",    icon: "🍽️", color: "#7c2d12", desc: "Restaurantes, cafeterías, bares y negocios de comida", features: ["Menu digital", "Carta de productos", "Reservas", "Chat IA"],           preview: ["Plato del dia", "Bebidas", "Postres", "Combos"] },
  { id: "gym",        label: "Gimnasio / Fitness",         icon: "🏋️", color: "#111827", desc: "Gimnasios, centros de fitness y entrenamiento",     features: ["Clases y horarios", "Entrenadores", "Citas", "Chat IA"],                 preview: ["Musculacion", "Cardio", "Yoga", "Crossfit"] },
  { id: "clinic",     label: "Clinica / Consultorio",      icon: "🏥",  color: "#1d4ed8", desc: "Clínicas médicas, consultorios y centros de salud", features: ["Especialidades", "Medicos", "Turnos online", "Chat IA"],               preview: ["Medicina general", "Pediatria", "Traumatologia", "Nutricion"] },
  { id: "school",     label: "Academia / Escuela",         icon: "🎓",  color: "#4f46e5", desc: "Academias, institutos, cursos y centros educativos", features: ["Cursos", "Instructores", "Inscripciones", "Chat IA"],                 preview: ["Ingles", "Programacion", "Contabilidad", "Marketing"] },
  { id: "veterinary", label: "Veterinaria",                icon: "🐾",  color: "#0f766e", desc: "Clínicas veterinarias y servicios para mascotas",   features: ["Turnos veterinarios", "Servicios", "Veterinarios", "Chat IA"],          preview: ["Vacunacion", "Cirugia", "Grooming", "Guarderia"] },
  { id: "lawyer",     label: "Estudio Juridico",           icon: "⚖️",  color: "#1e293b", desc: "Estudios jurídicos, abogados y consultoras legales", features: ["Areas de practica", "Equipo legal", "Consultas", "Chat IA"],          preview: ["Civil", "Laboral", "Comercial", "Familia"] },
  { id: "realestate", label: "Inmobiliaria",               icon: "🏠",  color: "#065f46", desc: "Inmobiliarias, agentes y desarrolladoras de propiedades", features: ["Propiedades", "Asesores", "Visitas", "Chat IA"],                preview: ["Casas", "Departamentos", "Oficinas", "Locales"] },
  { id: "hotel",      label: "Hotel / Hospedaje",          icon: "🏨",  color: "#78350f", desc: "Hoteles, hostales, cabañas y alojamientos",         features: ["Habitaciones", "Reservas", "Servicios", "Chat IA"],                     preview: ["Suite", "Doble", "Simple", "Familiar"] },
  { id: "hardware",     label: "Ferreteria / Tienda",        icon: "🔧",  color: "#1e3a5f", desc: "Ferreterías, tiendas, distribuidoras y comercios",       features: ["Catalogo de productos", "Control de stock", "Categorias", "Chat IA"],        preview: ["Herramientas", "Materiales", "Electricidad", "Pinturas"] },
  { id: "photographer", label: "Fotografo / Portafolio",    icon: "📷",  color: "#1a1a1a", desc: "Fotógrafos, artistas y creativos que muestran su trabajo", features: ["Portafolio visual", "Paquetes de servicio", "Reservas", "Chat IA"],          preview: ["Bodas", "Eventos", "Retratos", "Productos"] },
  { id: "cafeteria",    label: "Cafeteria / Comida Rapida", icon: "☕",  color: "#6b4226", desc: "Cafeterías, pastelerías, comida rápida y snacks",          features: ["Menú digital", "Especialidades", "Pedidos", "Chat IA"],                     preview: ["Cafe", "Sandwiches", "Postres", "Jugos"] },
  { id: "tutor",        label: "Tutor / Consultor",         icon: "📚",  color: "#2563eb", desc: "Tutores, consultores, coaches y asesores independientes",  features: ["Servicios de consultoría", "Agenda online", "Cómo funciona", "Chat IA"],    preview: ["Clases particulares", "Coaching", "Asesoria", "Mentoria"] },
  { id: "pharmacy",     label: "Farmacia / Salud",          icon: "💊",  color: "#0d9488", desc: "Farmacias, parafarmacias y tiendas de salud",              features: ["Catalogo de productos", "Servicios", "Delivery", "Chat IA"],                 preview: ["Medicamentos", "Vitaminas", "Naturales", "Cosmeticos"] },
  { id: "store",        label: "Tienda / Supermercado",     icon: "🛒",  color: "#1d4ed8", desc: "Tiendas generales, supermercados, bazares y mayoristas",   features: ["Catalogo amplio", "Categorias", "Pedidos online", "Chat IA"],              preview: ["Alimentos", "Limpieza", "Ropa", "Electronicos"] },
  { id: "generic",      label: "Generico / Personalizado",  icon: "⚡",  color: "#374151", desc: "Pagina en blanco para cualquier tipo de negocio",          features: ["Totalmente personalizable", "Servicios o productos", "Citas", "Chat IA"],  preview: ["Sin contenido predefinido"] },
];

export default function NewSitePage() {
  const router = useRouter();
  const [step, setStep] = useState<"template" | "details">("template");
  const [selectedTemplate, setSelectedTemplate] = useState<typeof TEMPLATES[0] | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", adminName: "", adminEmail: "", adminPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "name" ? { slug: value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") } : {}),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTemplate) return;
    setError("");
    setLoading(true);
    const res = await fetch("/api/admin/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, template: selectedTemplate.id, primaryColor: selectedTemplate.color }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error || "Error al crear el sitio");
    } else {
      router.push(`/admin/sites/${data.id}`);
    }
  }

  if (step === "template") {
    return (
      <div className="p-4 sm:p-8 max-w-5xl">
        <div className="mb-8">
          <Link href="/admin/sites" className="text-sm text-gray-500 hover:text-gray-700">← Volver</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Crear nuevo sitio</h1>
          <p className="text-gray-500 mt-1">Elige la plantilla que mejor se adapte al negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setSelectedTemplate(t); setStep("details"); }}
              className="text-left bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-md transition-all overflow-hidden group"
            >
              {/* Header con color */}
              <div className="p-5 text-white" style={{ backgroundColor: t.color }}>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{t.icon}</span>
                  <div>
                    <p className="font-bold text-lg leading-tight">{t.label}</p>
                    <p className="text-white/70 text-sm">{t.desc}</p>
                  </div>
                </div>
                {/* Preview de contenido */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {t.preview.map((p) => (
                    <span key={p} className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">{p}</span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Incluye</p>
                <div className="grid grid-cols-2 gap-1">
                  {t.features.map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <span className="text-xs font-medium text-blue-600 group-hover:underline">Seleccionar →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-2xl">
      <div className="mb-8">
        <button onClick={() => setStep("template")} className="text-sm text-gray-500 hover:text-gray-700">← Cambiar plantilla</button>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Configurar el sitio</h1>
      </div>

      {/* Template seleccionada */}
      {selectedTemplate && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 mb-6" style={{ backgroundColor: selectedTemplate.color + "15" }}>
          <span className="text-2xl">{selectedTemplate.icon}</span>
          <div>
            <p className="font-semibold text-gray-900">{selectedTemplate.label}</p>
            <p className="text-sm text-gray-500">{selectedTemplate.desc}</p>
          </div>
          <button onClick={() => setStep("template")} className="ml-auto text-xs text-gray-400 hover:text-gray-600 border border-gray-200 px-3 py-1.5 rounded-lg">
            Cambiar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informacion del sitio</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del negocio</label>
            <input name="name" value={form.name} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mi Peluqueria" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL del sitio</label>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
              <span className="px-3 py-2.5 bg-gray-50 text-gray-400 text-sm border-r border-gray-300">/site/</span>
              <input name="slug" value={form.slug}
                onChange={(e) => setForm(p => ({ ...p, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }))}
                required className="flex-1 px-3 py-2.5 focus:outline-none" placeholder="mi-peluqueria" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Administrador del sitio</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
            <input name="adminName" value={form.adminName} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Juan Perez" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="adminEmail" value={form.adminEmail} onChange={handleChange} required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@mipeluqueria.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contrasena</label>
            <input type="password" name="adminPassword" value={form.adminPassword} onChange={handleChange} required minLength={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••" />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

        <button type="submit" disabled={loading}
          className="w-full text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          style={{ backgroundColor: selectedTemplate?.color ?? "#3b82f6" }}>
          {loading ? "Creando sitio..." : `Crear sitio ${selectedTemplate ? `(${selectedTemplate.label})` : ""}`}
        </button>
      </form>
    </div>
  );
}
