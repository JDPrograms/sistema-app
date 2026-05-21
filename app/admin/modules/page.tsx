import Link from "next/link";

const MODULES = [
  {
    category: "Principal",
    color: "blue",
    items: [
      {
        icon: "📊",
        title: "Dashboard",
        href: "/admin",
        desc: "Vista general de toda la plataforma. Muestra sitios activos, usuarios totales, citas del día, alertas de vencimiento y métricas de crecimiento mes a mes.",
        use: "Úsalo cada mañana para tener una foto rápida del estado del sistema.",
      },
      {
        icon: "🌐",
        title: "Sitios web",
        href: "/admin/sites",
        desc: "Lista completa de todos los sitios creados. Puedes ver su estado (activo/inactivo), plantilla, plan, fecha de vencimiento y acceder a su gestión individual.",
        use: "Aquí creas, editas y desactivas sitios de clientes. Cada sitio tiene su propio panel de administración.",
      },
      {
        icon: "➕",
        title: "Crear sitio",
        href: "/admin/sites/new",
        desc: "Formulario para crear un nuevo sitio. Define el nombre, slug (URL), plantilla de diseño, colores, plan y módulos habilitados.",
        use: "Cada nuevo cliente que contrate el servicio necesita un sitio. Se crea en menos de 2 minutos.",
      },
    ],
  },
  {
    category: "Gestión y monitoreo",
    color: "cyan",
    items: [
      {
        icon: "📈",
        title: "Reportes",
        href: "/admin/reports",
        desc: "Métricas consolidadas de toda la plataforma: crecimiento de sitios, actividad de usuarios, volumen de citas y tendencias por período.",
        use: "Ideal para reuniones con inversores o para revisar el desempeño mensual de la plataforma.",
      },
      {
        icon: "📢",
        title: "Anuncios",
        href: "/admin/announcements",
        desc: "Crea mensajes que se muestran a los administradores de sitios dentro de su panel. Útil para comunicar mantenimientos, nuevas funciones o avisos importantes.",
        use: "Úsalo cuando necesites notificar a todos tus clientes al mismo tiempo sin enviar emails.",
      },
      {
        icon: "📋",
        title: "Actividad del sistema",
        href: "/admin/audit-log",
        desc: "Registro cronológico de todas las acciones realizadas en el sistema: quién hizo qué y cuándo. Incluye creación de sitios, cambios de configuración y accesos.",
        use: "Fundamental para auditorías, resolver incidentes o detectar accesos no autorizados.",
      },
    ],
  },
  {
    category: "Sistema y configuración",
    color: "purple",
    items: [
      {
        icon: "🤖",
        title: "IA Global",
        href: "/admin/ai",
        desc: "Configura los proveedores de inteligencia artificial (OpenAI, Anthropic, Gemini, etc.) con sus API keys. Define cuál proveedor tiene prioridad cuando los sitios usan agentes de IA.",
        use: "Configura las API keys una sola vez aquí y todos los sitios que tengan el módulo de IA habilitado las usarán automáticamente.",
      },
      {
        icon: "⚙️",
        title: "Configuración del sistema",
        href: "/admin/system-config",
        desc: "Ajustes globales de la plataforma: nombre de la plataforma, configuración de emails, límites de uso, opciones de registro y otras variables del sistema.",
        use: "Solo se modifica en casos puntuales. Cambios aquí afectan a toda la plataforma.",
      },
      {
        icon: "👑",
        title: "Superadmins",
        href: "/admin/admins",
        desc: "Lista y gestión de todos los usuarios con acceso de Super Administrador. Puedes crear nuevos superadmins, ver su actividad y desactivarlos.",
        use: "Solo añade nuevos superadmins a personas de plena confianza — tienen acceso total al sistema.",
      },
      {
        icon: "🔐",
        title: "Seguridad",
        href: "/admin/security",
        desc: "Cambia tu contraseña de acceso y gestiona la autenticación de doble factor (2FA). Incluye indicador de fortaleza de contraseña en tiempo real.",
        use: "Cambia la contraseña periódicamente y activa el 2FA para máxima seguridad.",
      },
    ],
  },
];

const colorMap: Record<string, { badge: string; border: string; icon: string; link: string }> = {
  blue:   { badge: "bg-blue-50 text-blue-700",   border: "border-blue-200",   icon: "bg-blue-50",   link: "text-blue-600 hover:text-blue-800" },
  cyan:   { badge: "bg-cyan-50 text-cyan-700",    border: "border-cyan-200",   icon: "bg-cyan-50",   link: "text-cyan-600 hover:text-cyan-800" },
  purple: { badge: "bg-purple-50 text-purple-700",border: "border-purple-200", icon: "bg-purple-50", link: "text-purple-600 hover:text-purple-800" },
};

export default function SuperAdminModulesPage() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-10">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guía de módulos</h1>
        <p className="text-gray-500 mt-1">
          Descripción de cada sección del panel de Super Administrador y para qué se usa.
        </p>
      </div>

      {MODULES.map((section) => {
        const colors = colorMap[section.color];
        return (
          <div key={section.category}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${colors.badge}`}>
                {section.category}
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.items.map((mod) => (
                <div key={mod.title} className={`bg-white rounded-xl border ${colors.border} p-5 flex gap-4`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors.icon}`}>
                    {mod.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900">{mod.title}</h3>
                      <Link href={mod.href} className={`text-xs font-semibold ${colors.link} flex-shrink-0 ml-2`}>
                        Ir →
                      </Link>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-3">{mod.desc}</p>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">¿Cuándo usarlo? </span>
                        {mod.use}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Quick tips */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="font-bold text-amber-900 mb-4">💡 Consejos rápidos</h2>
        <ul className="space-y-2 text-sm text-amber-800">
          <li className="flex items-start gap-2">
            <span className="mt-0.5">→</span>
            <span>Para crear un cliente nuevo: <strong>Sitios web → Crear sitio</strong>. Define la plantilla según el tipo de negocio.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">→</span>
            <span>Si un cliente no puede acceder a su panel, revisa que su sitio esté <strong>Activo</strong> en la gestión del sitio.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">→</span>
            <span>Los módulos habilitados por sitio se configuran en <strong>Sitios web → [sitio] → Módulos</strong>. Solo activa lo que el plan del cliente incluye.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">→</span>
            <span>Para la IA, configura la API key en <strong>IA Global</strong> una vez y todos los sitios la comparten.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5">→</span>
            <span>El <strong>Registro de actividad</strong> guarda un historial completo. Si algo falla o hay un acceso sospechoso, empieza por ahí.</span>
          </li>
        </ul>
      </div>

    </div>
  );
}
