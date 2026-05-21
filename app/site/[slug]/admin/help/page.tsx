import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

const ALL_MODULES = [
  {
    category: "Citas y agenda",
    icon: "📅",
    color: "blue",
    key: "appointments",
    modules: [
      {
        icon: "📅",
        title: "Citas",
        path: "appointments",
        desc: "Gestiona todas las reservas de tus clientes. Puedes confirmar, cancelar o marcar citas como completadas. Ver el historial por cliente o por servicio.",
        tip: "Revisa las citas pendientes cada mañana y confirma las del día para que el cliente reciba la notificación.",
        key: "appointments",
      },
      {
        icon: "📆",
        title: "Calendario",
        path: "calendar",
        desc: "Vista visual de todas tus citas en formato calendario mensual o semanal. Facilita ver los días más ocupados y organizar la agenda del equipo.",
        tip: "Ideal para revisar disponibilidad antes de agendar manualmente una cita para un cliente.",
        key: "appointments",
      },
      {
        icon: "⏳",
        title: "Lista de espera",
        path: "waiting-list",
        desc: "Cuando todos los horarios están llenos, los clientes pueden anotarse en la lista de espera. Si se libera un turno, puedes asignarlo desde aquí.",
        tip: "Activa notificaciones automáticas para que los clientes sepan cuando hay disponibilidad.",
        key: "appointments",
      },
    ],
  },
  {
    category: "Equipo y personal",
    icon: "🧑‍💼",
    color: "teal",
    key: "appointments",
    modules: [
      {
        icon: "🧑‍💼",
        title: "Personal",
        path: "staff",
        desc: "Administra tu equipo de trabajo. Agrega empleados, define su especialidad y controla quiénes están activos para recibir citas.",
        tip: "Completa la especialidad de cada empleado — aparece en la página pública y ayuda a los clientes a elegir.",
        key: "appointments",
      },
      {
        icon: "✅",
        title: "Tareas",
        path: "tasks",
        desc: "Sistema de gestión de tareas internas para el equipo. Asigna, prioriza y marca tareas como completadas.",
        tip: "Úsalo para organizar el trabajo del día a día: apertura, limpieza, compras, seguimientos, etc.",
        key: "tasks",
      },
    ],
  },
  {
    category: "Contenido y catálogo",
    icon: "📋",
    color: "violet",
    key: "content",
    modules: [
      {
        icon: "📋",
        title: "Servicios y contenido",
        path: "content",
        desc: "Administra los servicios que ofreces: nombre, descripción, precio, duración e imagen. Estos servicios aparecen en tu página web pública.",
        tip: "Agrega una imagen atractiva a cada servicio — los clientes tienen 3x más probabilidad de reservar cuando ven la imagen.",
        key: "content",
      },
      {
        icon: "📦",
        title: "Productos",
        path: "products",
        desc: "Catálogo de productos con control de inventario. Define stock mínimo para recibir alertas antes de quedarte sin mercancía.",
        tip: "Configura el 'alerta de stock bajo' en cada producto para que el dashboard te avise con anticipación.",
        key: "products",
      },
      {
        icon: "🖼️",
        title: "Galería",
        path: "gallery",
        desc: "Sube fotos del local, trabajos realizados o productos. Aparecen en una galería visual en tu página web pública.",
        tip: "Una galería con al menos 6-8 fotos de calidad genera mucha más confianza en los visitantes nuevos.",
        key: "gallery",
      },
      {
        icon: "❓",
        title: "Preguntas frecuentes",
        path: "faq",
        desc: "Crea una sección de preguntas y respuestas que aparece en tu sitio web. Reduce las consultas repetitivas.",
        tip: "Las 5 preguntas más comunes que te hacen tus clientes son el punto de partida perfecto.",
        key: "faq",
      },
    ],
  },
  {
    category: "Comunicación y marketing",
    icon: "📣",
    color: "orange",
    key: "email",
    modules: [
      {
        icon: "✍️",
        title: "Blog",
        path: "blog",
        desc: "Publica artículos, noticias o consejos relacionados con tu negocio. El blog mejora el posicionamiento en Google y fideliza a tus clientes.",
        tip: "Un artículo mensual es suficiente para mantener el blog activo. Escribe sobre temas que le interesen a tus clientes.",
        key: "blog",
      },
      {
        icon: "📧",
        title: "Email marketing",
        path: "email-marketing",
        desc: "Crea y envía campañas de correo a tus clientes registrados. Ideal para promociones, recordatorios de temporada o novedades.",
        tip: "Un email bien redactado con una oferta puntual puede traer una oleada de reservas en pocas horas.",
        key: "email",
      },
      {
        icon: "📰",
        title: "Newsletter",
        path: "newsletter",
        desc: "Gestiona la lista de suscriptores que quieren recibir noticias de tu negocio. Diferente al email marketing: estos clientes se suscribieron voluntariamente.",
        tip: "Ofrece un descuento a cambio de suscribirse — es la forma más rápida de hacer crecer la lista.",
        key: "newsletter",
      },
      {
        icon: "📢",
        title: "Publicidades",
        path: "ads",
        desc: "Crea banners o anuncios que aparecen en tu sitio web. Puedes destacar ofertas especiales, productos nuevos o eventos.",
        tip: "Cambia el anuncio principal cada 2-4 semanas para que los visitantes frecuentes siempre vean algo nuevo.",
        key: "ads",
      },
    ],
  },
  {
    category: "Clientes y fidelización",
    icon: "👥",
    color: "pink",
    key: "users",
    modules: [
      {
        icon: "👥",
        title: "Usuarios (clientes)",
        path: "users",
        desc: "Lista de todos los clientes registrados en tu sitio. Puedes ver su historial de citas, datos de contacto y actividad.",
        tip: "Usa los filtros para identificar clientes que hace tiempo no vienen — son candidatos perfectos para una campaña de reactivación.",
        key: "users",
      },
      {
        icon: "🤝",
        title: "CRM",
        path: "crm",
        desc: "Gestión de relaciones con clientes. Agrega notas, seguimientos y etiquetas a cada cliente para dar un servicio más personalizado.",
        tip: "Anota la preferencia de cada cliente (p.ej. 'prefiere los sábados' o 'es alérgico a...') para sorprenderlos.",
        key: "crm",
      },
      {
        icon: "⭐",
        title: "Reseñas",
        path: "reviews",
        desc: "Administra las opiniones que dejan tus clientes. Puedes responder públicamente y destacar las mejores reseñas en tu sitio.",
        tip: "Responde todas las reseñas, incluso las negativas. Una respuesta profesional a una crítica genera mucha confianza.",
        key: "reviews",
      },
      {
        icon: "🎯",
        title: "Programa de lealtad",
        path: "loyalty",
        desc: "Sistema de puntos o sellos para premiar a los clientes frecuentes. Define cuántas visitas se necesitan para ganar un beneficio.",
        tip: "Los programas de lealtad simples (ej: 5ta visita gratis) aumentan la frecuencia de retorno hasta un 40%.",
        key: "loyalty",
      },
      {
        icon: "🏷️",
        title: "Cupones",
        path: "coupons",
        desc: "Crea códigos de descuento para compartir en redes sociales, campañas de email o referidos. Controla el límite de usos y la fecha de vencimiento.",
        tip: "Un cupón de bienvenida para nuevos registros es la forma más directa de convertir visitas en clientes.",
        key: "coupons",
      },
    ],
  },
  {
    category: "Finanzas",
    icon: "🧾",
    color: "green",
    key: "billing",
    modules: [
      {
        icon: "🧾",
        title: "Contabilidad",
        path: "billing",
        desc: "Gestión completa de ingresos y gastos: emite facturas, cotizaciones y registra tus egresos. El dashboard muestra la ganancia neta del mes.",
        tip: "Registra todos los gastos del negocio (alquiler, insumos, servicios) para tener una imagen real de la rentabilidad.",
        key: "billing",
      },
    ],
  },
  {
    category: "Diseño y apariencia",
    icon: "🎨",
    color: "indigo",
    key: "customize",
    modules: [
      {
        icon: "🎨",
        title: "Personalizar",
        path: "customize",
        desc: "Cambia los colores principales del sitio, sube tu logo y ajusta la información básica (nombre, descripción, dirección, teléfono, redes sociales).",
        tip: "Usa los colores de tu marca para que el sitio se vea profesional y coherente con tu identidad visual.",
        key: "customize",
      },
      {
        icon: "🧱",
        title: "Constructor de secciones",
        path: "builder",
        desc: "Añade bloques de contenido personalizados a tu página: texto libre, imágenes, botones, llamados a la acción. Sin necesidad de saber programar.",
        tip: "Agrega una sección especial antes de fechas importantes (navidad, día de la madre) para comunicar tu oferta.",
        key: "builder",
      },
      {
        icon: "📐",
        title: "Secciones",
        path: "sections",
        desc: "Controla qué secciones de la plantilla se muestran y en qué orden aparecen en tu página principal.",
        tip: "Pon la sección de reservas lo más arriba posible — es la acción más importante que quieres que haga el visitante.",
        key: "customize",
      },
    ],
  },
  {
    category: "Inteligencia Artificial",
    icon: "🤖",
    color: "purple",
    key: "ai",
    modules: [
      {
        icon: "🤖",
        title: "Agentes de IA",
        path: "ai",
        desc: "Configura asistentes virtuales que responden preguntas de tus clientes 24/7. Puedes entrenar al agente con información específica de tu negocio.",
        tip: "Configura el agente con las 10 preguntas más frecuentes que recibes y delégale esas respuestas.",
        key: "ai",
      },
    ],
  },
  {
    category: "Soporte y seguridad",
    icon: "🛡️",
    color: "slate",
    key: null,
    modules: [
      {
        icon: "🎫",
        title: "Soporte",
        path: "support",
        desc: "Sistema de tickets de soporte para atender consultas de tus clientes. Clasifica por prioridad y registra el historial de comunicación.",
        tip: "Responde en menos de 24 horas — el tiempo de respuesta es uno de los factores más valorados por los clientes.",
        key: null,
      },
      {
        icon: "📊",
        title: "Reportes",
        path: "reports",
        desc: "Informes detallados de actividad: citas por período, ingresos, clientes nuevos, servicios más populares y tendencias.",
        tip: "Revisa los reportes cada inicio de mes para identificar qué está funcionando y qué puedes mejorar.",
        key: null,
      },
      {
        icon: "📋",
        title: "Registro de actividad",
        path: "audit-log",
        desc: "Historial de todas las acciones realizadas en el panel: cambios de configuración, citas modificadas, usuarios gestionados.",
        tip: "Si algo cambia sin que tú lo hayas hecho, el audit log te dirá quién y cuándo lo modificó.",
        key: null,
      },
      {
        icon: "🔐",
        title: "Seguridad",
        path: "security",
        desc: "Cambia tu contraseña de acceso. Activa el doble factor de autenticación (2FA) para proteger tu cuenta de accesos no autorizados.",
        tip: "Activa el 2FA. Si alguien obtiene tu contraseña, no podrá entrar sin el código adicional.",
        key: null,
      },
      {
        icon: "👤",
        title: "Administradores",
        path: "admins",
        desc: "Añade otros administradores que puedan acceder al panel de tu negocio. Útil cuando tienes un gerente o encargado.",
        tip: "Solo añade como administrador a personas de confianza — tienen acceso total a tu negocio.",
        key: null,
      },
    ],
  },
];

const colorMap: Record<string, { badge: string; border: string; iconBg: string; dot: string }> = {
  blue:   { badge: "bg-blue-100 text-blue-700",    border: "border-blue-100",   iconBg: "bg-blue-50",    dot: "bg-blue-500" },
  teal:   { badge: "bg-teal-100 text-teal-700",    border: "border-teal-100",   iconBg: "bg-teal-50",    dot: "bg-teal-500" },
  violet: { badge: "bg-violet-100 text-violet-700",border: "border-violet-100", iconBg: "bg-violet-50",  dot: "bg-violet-500" },
  orange: { badge: "bg-orange-100 text-orange-700",border: "border-orange-100", iconBg: "bg-orange-50",  dot: "bg-orange-500" },
  pink:   { badge: "bg-pink-100 text-pink-700",    border: "border-pink-100",   iconBg: "bg-pink-50",    dot: "bg-pink-500" },
  green:  { badge: "bg-green-100 text-green-700",  border: "border-green-100",  iconBg: "bg-green-50",   dot: "bg-green-500" },
  indigo: { badge: "bg-indigo-100 text-indigo-700",border: "border-indigo-100", iconBg: "bg-indigo-50",  dot: "bg-indigo-500" },
  purple: { badge: "bg-purple-100 text-purple-700",border: "border-purple-100", iconBg: "bg-purple-50",  dot: "bg-purple-500" },
  slate:  { badge: "bg-slate-100 text-slate-700",  border: "border-slate-100",  iconBg: "bg-slate-50",   dot: "bg-slate-400" },
};

export default async function SiteAdminHelpPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, modules: true } });
  if (!site) notFound();

  const mods = (() => { try { return JSON.parse(site.modules || "{}"); } catch { return {}; } })();

  return (
    <div className="p-4 sm:p-8 max-w-5xl space-y-10">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Guía de módulos</h1>
        <p className="text-gray-500 mt-1">
          Explora para qué sirve cada sección de tu panel y cómo sacarle el máximo provecho.
        </p>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-gray-500 bg-gray-50 rounded-xl px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span>Módulo activo en tu plan</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
          <span>Módulo no incluido / disponible</span>
        </div>
      </div>

      {ALL_MODULES.map((section) => {
        const colors = colorMap[section.color];
        return (
          <div key={section.category}>
            <div className="flex items-center gap-3 mb-5">
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${colors.badge}`}>
                <span>{section.icon}</span>
                <span>{section.category}</span>
              </span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.modules.map((mod) => {
                const isEnabled = mod.key === null || mods[mod.key] === true
                  || (mod.key === "products" && (mods.products === true || mods.content === true));
                return (
                  <div key={mod.title} className={`bg-white rounded-xl border ${colors.border} p-5 flex gap-4 ${!isEnabled ? "opacity-60" : ""}`}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${colors.iconBg}`}>
                        {mod.icon}
                      </div>
                      <span className={`w-2 h-2 rounded-full ${isEnabled ? "bg-green-400" : "bg-gray-300"}`} title={isEnabled ? "Activo" : "No disponible"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900">{mod.title}</h3>
                        {isEnabled && (
                          <Link href={`/site/${slug}/admin/${mod.path}`} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex-shrink-0 ml-2">
                            Ir →
                          </Link>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mb-3">{mod.desc}</p>
                      {isEnabled && (
                        <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                          <p className="text-xs text-amber-800">
                            <span className="font-semibold">💡 Consejo: </span>
                            {mod.tip}
                          </p>
                        </div>
                      )}
                      {!isEnabled && (
                        <p className="text-xs text-gray-400 italic">Este módulo no está incluido en tu plan actual. Contacta a soporte para activarlo.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Support CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
        <div>
          <h3 className="font-bold text-gray-900 mb-1">¿Tienes dudas o necesitas ayuda?</h3>
          <p className="text-sm text-gray-600">Nuestro equipo puede guiarte a configurar cualquier módulo paso a paso.</p>
        </div>
        <Link href={`/site/${slug}/admin/support`}
          className="flex-shrink-0 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
          Abrir soporte →
        </Link>
      </div>

    </div>
  );
}
