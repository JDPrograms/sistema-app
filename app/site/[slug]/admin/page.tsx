import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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

const statusLabels: Record<string, { label: string; color: string }> = {
  pending:   { label: "Pendiente",  color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada",  color: "bg-red-100 text-red-600" },
  completed: { label: "Completada", color: "bg-blue-100 text-blue-700" },
};

export default async function SiteAdminDashboard({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const site = await prisma.site.findUnique({
    where: { slug },
    include: {
      _count: { select: { users: true, services: true, products: true, ads: true, staff: true, aiAgents: true } },
    },
  });
  if (!site) notFound();

  const mods = (() => { try { return JSON.parse(site.modules || "{}"); } catch { return {}; } })();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const weekStr = startOfWeek.toISOString().split("T")[0];

  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [
    pendingCount, confirmedCount, cancelledCount, completedCount,
    todayCount, weekCount,
    recentAppointments,
    // Metricas del mes
    appointmentsThisMonth, appointmentsLastMonth,
    // Proximas citas (hoy y manana, no canceladas)
    upcomingAppointments,
    // Top staff
    topStaffRaw,
    // Top servicios
    topServicesRaw,
    // Nuevos clientes este mes
    newUsersThisMonth, newUsersLastMonth,
  ] = await Promise.all([
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "pending" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "confirmed" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "cancelled" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "completed" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: today } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { gte: weekStr } } }),
    prisma.siteAppointment.findMany({
      where: { siteId: site.id },
      orderBy: [{ date: "desc" }, { time: "desc" }],
      take: 8,
      select: { id: true, clientName: true, serviceName: true, staffName: true, date: true, time: true, status: true },
    }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { startsWith: thisMonthStr } } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { startsWith: lastMonthStr } } }),
    prisma.siteAppointment.findMany({
      where: {
        siteId: site.id,
        date: { gte: today, lte: tomorrowStr },
        status: { not: "cancelled" },
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      take: 6,
      select: { id: true, clientName: true, serviceName: true, staffName: true, date: true, time: true, status: true },
    }),
    prisma.siteAppointment.groupBy({
      by: ["staffName"],
      where: { siteId: site.id, staffName: { not: null } },
      _count: { staffName: true },
      orderBy: { _count: { staffName: "desc" } },
      take: 3,
    }),
    prisma.siteAppointment.groupBy({
      by: ["serviceName"],
      where: { siteId: site.id, serviceName: { not: null } },
      _count: { serviceName: true },
      orderBy: { _count: { serviceName: "desc" } },
      take: 3,
    }),
    prisma.siteUser.count({ where: { siteId: site.id, createdAt: { gte: thisMonthStart } } }),
    prisma.siteUser.count({ where: { siteId: site.id, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
  ]);

  const totalAppointments = pendingCount + confirmedCount + cancelledCount + completedCount;
  const closedAppointments = completedCount + cancelledCount;
  const completionRate = closedAppointments > 0
    ? Math.round((completedCount / closedAppointments) * 100)
    : null;

  const monthDiff = appointmentsThisMonth - appointmentsLastMonth;

  const quickLinks = [
    ...(mods.appointments !== false ? [{ href: `/site/${slug}/admin/appointments`, icon: "📅", label: "Citas", desc: "Ver y gestionar todas las reservas" }] : []),
    ...(mods.appointments !== false ? [{ href: `/site/${slug}/admin/staff`, icon: "🧑‍💼", label: "Personal", desc: "Equipo del negocio" }] : []),
    ...(mods.content !== false ? [{ href: `/site/${slug}/admin/content`, icon: "📋", label: "Contenido", desc: "Servicios y productos" }] : []),
    ...(mods.customize !== false ? [{ href: `/site/${slug}/admin/customize`, icon: "🎨", label: "Personalizar", desc: "Colores, logo y contacto" }] : []),
    ...(mods.ads !== false ? [{ href: `/site/${slug}/admin/ads`, icon: "📢", label: "Publicidades", desc: "Banners y anuncios" }] : []),
    ...(mods.users !== false ? [{ href: `/site/${slug}/admin/users`, icon: "👥", label: "Usuarios", desc: "Clientes registrados" }] : []),
    ...(mods.ai !== false ? [{ href: `/site/${slug}/admin/ai`, icon: "🤖", label: "IA", desc: "Agentes y asistentes" }] : []),
  ];

  return (
    <div className="p-8 space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.name}</h1>
          <p className="text-gray-500 mt-0.5">{templateLabels[site.template]} · /site/{slug}</p>
        </div>
        <Link href={`/site/${slug}`} target="_blank"
          className="text-sm border border-gray-200 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
          Ver sitio publico ↗
        </Link>
      </div>

      {/* Stats de citas */}
      {mods.appointments !== false && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Citas</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Hoy</p>
              <p className="text-2xl font-bold text-gray-900">{todayCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Esta semana</p>
              <p className="text-2xl font-bold text-blue-600">{weekCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Pendientes</p>
              <p className="text-2xl font-bold text-amber-500">{pendingCount}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-1">Confirmadas</p>
              <p className="text-2xl font-bold text-green-500">{confirmedCount}</p>
            </div>
          </div>

          {/* Metricas del mes + tasa de completitud */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Este mes</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentsThisMonth}</p>
                <p className="text-xs text-gray-400 mt-0.5">{appointmentsLastMonth} el mes anterior</p>
              </div>
              {monthDiff !== 0 && (
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  monthDiff > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                }`}>
                  {monthDiff > 0 ? `+${monthDiff}` : monthDiff}
                </span>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-400 mb-0.5">Tasa de completitud</p>
              {completionRate !== null ? (
                <>
                  <p className={`text-2xl font-bold ${completionRate >= 70 ? "text-green-600" : completionRate >= 50 ? "text-amber-500" : "text-red-500"}`}>
                    {completionRate}%
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{completedCount} completadas · {cancelledCount} canceladas</p>
                </>
              ) : (
                <p className="text-sm text-gray-400 mt-1">Sin datos suficientes</p>
              )}
            </div>
            {mods.users !== false && (
              <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Clientes nuevos (mes)</p>
                  <p className="text-2xl font-bold text-purple-600">{newUsersThisMonth}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{newUsersLastMonth} el mes anterior</p>
                </div>
                {newUsersThisMonth !== newUsersLastMonth && (
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    newUsersThisMonth > newUsersLastMonth ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>
                    {newUsersThisMonth > newUsersLastMonth ? `+${newUsersThisMonth - newUsersLastMonth}` : newUsersThisMonth - newUsersLastMonth}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Barra de estados */}
          {totalAppointments > 0 && (
            <div className="mt-3 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500 font-medium">Estado general de citas ({totalAppointments} total)</p>
                <Link href={`/site/${slug}/admin/appointments`} className="text-xs text-blue-600 hover:underline">Ver todas →</Link>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {pendingCount > 0 && <div className="bg-amber-400 rounded-full" style={{ flex: pendingCount }} />}
                {confirmedCount > 0 && <div className="bg-green-400 rounded-full" style={{ flex: confirmedCount }} />}
                {completedCount > 0 && <div className="bg-blue-400 rounded-full" style={{ flex: completedCount }} />}
                {cancelledCount > 0 && <div className="bg-gray-200 rounded-full" style={{ flex: cancelledCount }} />}
              </div>
              <div className="flex gap-4 mt-2">
                {[
                  { label: "Pendientes", count: pendingCount, color: "bg-amber-400" },
                  { label: "Confirmadas", count: confirmedCount, color: "bg-green-400" },
                  { label: "Completadas", count: completedCount, color: "bg-blue-400" },
                  { label: "Canceladas", count: cancelledCount, color: "bg-gray-300" },
                ].filter(s => s.count > 0).map(s => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${s.color}`} />
                    <span className="text-xs text-gray-500">{s.label}: {s.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Proximas citas + top staff/servicios */}
      {mods.appointments !== false && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Proximas citas hoy y manana */}
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Proximas citas (hoy y mañana)</h2>
              <Link href={`/site/${slug}/admin/appointments`} className="text-xs text-blue-600 hover:underline">Ver todas →</Link>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">Sin citas proximas</p>
            ) : (
              <div className="space-y-2">
                {upcomingAppointments.map(a => {
                  const st = statusLabels[a.status] ?? { label: a.status, color: "bg-gray-100 text-gray-600" };
                  const isToday = a.date === today;
                  return (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${isToday ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                          {isToday ? "Hoy" : "Mañana"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{a.clientName}</p>
                          <p className="text-xs text-gray-400 truncate">
                            {a.serviceName ?? "Sin servicio"}{a.staffName ? ` · ${a.staffName}` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <p className="text-xs text-gray-500">{a.time}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top staff y servicios */}
          <div className="space-y-4">
            {topStaffRaw.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Staff mas solicitado</h2>
                <div className="space-y-2">
                  {topStaffRaw.map((s, i) => (
                    <div key={s.staffName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <span className="text-sm text-gray-700 truncate">{s.staffName}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{s._count.staffName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {topServicesRaw.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h2 className="font-semibold text-gray-900 mb-3">Servicios mas pedidos</h2>
                <div className="space-y-2">
                  {topServicesRaw.map((s, i) => (
                    <div key={s.serviceName} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                        <span className="text-sm text-gray-700 truncate">{s.serviceName}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">{s._count.serviceName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Resumen del negocio */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Resumen del negocio</h2>
          <div className="space-y-3">
            {mods.users !== false && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>👥</span> Usuarios registrados
                </div>
                <span className="font-bold text-gray-900">{site._count.users}</span>
              </div>
            )}
            {mods.appointments !== false && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🧑‍💼</span> Personal activo
                </div>
                <span className="font-bold text-gray-900">{site._count.staff}</span>
              </div>
            )}
            {mods.content !== false && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📋</span> Servicios
                  </div>
                  <span className="font-bold text-gray-900">{site._count.services}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📦</span> Productos
                  </div>
                  <span className="font-bold text-gray-900">{site._count.products}</span>
                </div>
              </>
            )}
            {mods.ads !== false && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📢</span> Publicidades
                </div>
                <span className="font-bold text-gray-900">{site._count.ads}</span>
              </div>
            )}
            {mods.ai !== false && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>🤖</span> Agentes IA
                </div>
                <span className="font-bold text-gray-900">{site._count.aiAgents}</span>
              </div>
            )}
          </div>
        </div>

        {/* Ultimas citas */}
        {mods.appointments !== false && (
          <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Ultimas citas</h2>
              <Link href={`/site/${slug}/admin/appointments`} className="text-xs text-blue-600 hover:underline">Ver todas →</Link>
            </div>
            {recentAppointments.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No hay citas aun</p>
            ) : (
              <div className="space-y-2">
                {recentAppointments.map(a => {
                  const st = statusLabels[a.status] ?? { label: a.status, color: "bg-gray-100 text-gray-600" };
                  return (
                    <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.clientName}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {a.serviceName ?? "Sin servicio"}{a.staffName ? ` · ${a.staffName}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                        <p className="text-xs text-gray-500">{a.date} {a.time}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accesos rapidos */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Accesos rapidos</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all group flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${site.primaryColor}18` }}>
                {link.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
