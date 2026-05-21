"use client";

import { usePathname } from "next/navigation";

const PAGE_INFO: Record<string, { icon: string; title: string; description: string }> = {
  "":            { icon: "📊", title: "Dashboard",              description: "Resumen del día: citas, alertas y métricas clave de tu negocio." },
  "appointments":{ icon: "📅", title: "Citas",                  description: "Gestiona todas las reservas. Confirma, cancela, reprograma y filtra por fecha o estado." },
  "calendar":    { icon: "🗓️", title: "Calendario",             description: "Vista visual de citas por día o semana. Ideal para planificar el trabajo del equipo." },
  "staff":       { icon: "👤", title: "Personal",               description: "Agrega y administra los colaboradores que aparecen disponibles para agendar." },
  "waiting-list":{ icon: "⏳", title: "Lista de espera",        description: "Clientes que quieren una cita pero no encontraron espacio disponible." },
  "products":    { icon: "📦", title: "Productos",              description: "Catálogo con precios, fotos e inventario de tus productos o servicios." },
  "billing":     { icon: "🧾", title: "Contabilidad",           description: "Registra ingresos, gastos y genera facturas. Control financiero del negocio." },
  "coupons":     { icon: "🎟️", title: "Cupones",                description: "Crea códigos de descuento con fechas, límites de uso y porcentajes." },
  "loyalty":     { icon: "⭐", title: "Lealtad",                description: "Programa de puntos para premiar a tus clientes frecuentes y fidelizarlos." },
  "users":       { icon: "👥", title: "Usuarios",               description: "Directorio de clientes registrados. Consulta historial, contacto y actividad." },
  "crm":         { icon: "🗂️", title: "CRM",                    description: "Seguimiento de clientes: notas, etiquetas y pipeline de ventas." },
  "reviews":     { icon: "⭐", title: "Reseñas",                description: "Opiniones de clientes sobre tu negocio. Responde y gestiona tu reputación." },
  "newsletter":  { icon: "📧", title: "Newsletter",             description: "Envía correos masivos a tus suscriptores con novedades o promociones." },
  "content":     { icon: "📋", title: "Contenido",              description: "Edita textos, títulos y descripciones que aparecen en tu sitio público." },
  "gallery":     { icon: "🖼️", title: "Galería",                description: "Sube y organiza las fotos que se muestran en tu sitio." },
  "blog":        { icon: "✍️", title: "Blog",                   description: "Publica artículos para tu sitio. Mejora el SEO y mantén informados a tus clientes." },
  "faq":         { icon: "❓", title: "Preguntas frecuentes",   description: "Define las preguntas y respuestas que aparecen en tu sitio público." },
  "customize":   { icon: "🎨", title: "Personalizar",           description: "Cambia colores, fuentes, logo y estilo visual de tu sitio." },
  "sections":    { icon: "⟡",  title: "Secciones",              description: "Activa o desactiva las secciones visibles en tu página principal." },
  "builder":     { icon: "✦",  title: "Constructor",            description: "Editor visual para crear y reorganizar el contenido de tu sitio con bloques." },
  "ads":         { icon: "📢", title: "Publicidades",           description: "Crea banners o anuncios que aparecen en tu sitio para promocionar algo." },
  "ai":          { icon: "🤖", title: "Asistente IA",           description: "Configura el asistente inteligente que responde dudas de tus clientes automáticamente." },
  "support":     { icon: "💬", title: "Soporte",                description: "Conversaciones de clientes que necesitan ayuda. Responde desde aquí." },
  "tasks":       { icon: "✅", title: "Tareas",                  description: "Lista de pendientes interna para ti y tu equipo. Organiza el trabajo del día." },
  "app":         { icon: "📲", title: "App Android",            description: "Configura y descarga la app de tu negocio para instalarla en dispositivos Android." },
  "reports":     { icon: "📊", title: "Reportes",               description: "Estadísticas detalladas: citas por período, ingresos y productos más vendidos." },
  "audit-log":   { icon: "📋", title: "Actividad",              description: "Historial de acciones realizadas en el panel. Útil para auditoría y control." },
  "admins":      { icon: "👑", title: "Administradores",        description: "Agrega o elimina personas con acceso a este panel de administración." },
  "security":    { icon: "🔐", title: "Seguridad",              description: "Configura contraseñas, accesos y opciones de protección del panel." },
  "help":        { icon: "📖", title: "Guía de módulos",        description: "Explicación de cada función activa en tu sitio y cómo aprovecharla." },
};

interface Props { slug: string; }

export default function SiteAdminPageBanner({ slug }: Props) {
  const pathname = usePathname();
  const base = `/site/${slug}/admin`;

  // Extract first segment after /admin/
  const rest = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  const segment = rest.split("/").filter(Boolean)[0] ?? "";

  const info = PAGE_INFO[segment];
  if (!info) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 px-6 py-3.5 flex items-start gap-3 flex-shrink-0">
      <span className="text-xl leading-none mt-0.5 select-none">{info.icon}</span>
      <div className="min-w-0">
        <p className="font-semibold text-gray-900 dark:text-slate-100 text-sm leading-tight">{info.title}</p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">{info.description}</p>
      </div>
    </div>
  );
}
