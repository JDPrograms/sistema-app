import { prisma } from "@/lib/prisma";
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

function getSiteAlert(site: { planType: string; expiresAt: Date | null }) {
  if (site.planType !== "timed" || !site.expiresAt) return null;
  const daysUntil = Math.ceil((new Date(site.expiresAt).getTime() - Date.now()) / 86400000);
  const daysGrace = Math.ceil((new Date(site.expiresAt).getTime() + 864000000 - Date.now()) / 86400000);
  if (daysUntil > 10) return null;
  if (daysUntil > 0) return { type: "warning" as const, label: `Vence en ${daysUntil}d` };
  if (daysGrace > 0) return { type: "danger" as const, label: `Gracia: ${daysGrace}d` };
  return null;
}

function growthBadge(current: number, previous: number) {
  if (previous === 0) return current > 0 ? { label: `+${current} nuevo${current !== 1 ? "s" : ""}`, up: true } : null;
  const diff = current - previous;
  if (diff === 0) return null;
  return { label: diff > 0 ? `+${diff} vs mes ant.` : `${diff} vs mes ant.`, up: diff > 0 };
}

export default async function AdminDashboard() {
  const today = new Date().toISOString().split("T")[0];

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thirtyDaysAgoStr = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const [
    totalSites, activeSites, inactiveSites,
    totalUsers, totalAdmins, totalAppointments,
    todayAppointments, pendingAppointments, cancelledAppointments,
    aiProviders, aiAgents,
    recentSites,
    allSitesForAlert,
    // Crecimiento
    sitesThisMonth, sitesLastMonth,
    usersThisMonth, usersLastMonth,
    // Top sitios activos este mes
    topSitesRaw,
    // Sitios sin actividad 30 dias
    inactiveSiteIds,
  ] = await Promise.all([
    prisma.site.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.site.count({ where: { isActive: false } }),
    prisma.siteUser.count(),
    prisma.siteAdmin.count(),
    prisma.siteAppointment.count(),
    prisma.siteAppointment.count({ where: { date: today } }),
    prisma.siteAppointment.count({ where: { status: "pending" } }),
    prisma.siteAppointment.count({ where: { status: "cancelled" } }),
    prisma.aiProvider.findMany({ orderBy: { priority: "asc" } }),
    prisma.aiAgent.count(),
    prisma.site.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, appointments: true } } },
    }),
    prisma.site.findMany({
      where: { planType: "timed" },
      select: { id: true, name: true, slug: true, planType: true, expiresAt: true },
    }),
    prisma.site.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.site.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.siteUser.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.siteUser.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    prisma.siteAppointment.groupBy({
      by: ["siteId"],
      where: { date: { gte: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01` } },
      _count: { siteId: true },
      orderBy: { _count: { siteId: "desc" } },
      take: 3,
    }),
    prisma.site.findMany({
      where: {
        isActive: true,
        appointments: { none: { date: { gte: thirtyDaysAgoStr } } },
      },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  // Enriquecer top sitios con nombres
  const topSiteIds = topSitesRaw.map(r => r.siteId);
  const topSiteNames = topSiteIds.length > 0
    ? await prisma.site.findMany({ where: { id: { in: topSiteIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const topSites = topSitesRaw.map(r => ({
    ...r,
    name: topSiteNames.find(s => s.id === r.siteId)?.name ?? r.siteId,
    slug: topSiteNames.find(s => s.id === r.siteId)?.slug ?? "",
  }));

  const alertSites = allSitesForAlert
    .map(s => ({ ...s, alert: getSiteAlert(s) }))
    .filter(s => s.alert !== null);

  const byTemplate = await prisma.site.groupBy({ by: ["template"], _count: true });

  const cancellationRate = totalAppointments > 0
    ? Math.round((cancelledAppointments / totalAppointments) * 100)
    : 0;

  const siteGrowth = growthBadge(sitesThisMonth, sitesLastMonth);
  const userGrowth = growthBadge(usersThisMonth, usersLastMonth);

  return (
    <div className="p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Vision general de la plataforma</p>
      </div>

      {/* Alertas de vencimiento */}
      {alertSites.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">Sitios que requieren atencion</p>
          <div className="space-y-1">
            {alertSites.map(s => (
              <div key={s.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span>{s.alert!.type === "warning" ? "⚠️" : "🚨"}</span>
                  <span className="font-medium text-gray-900">{s.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.alert!.type === "warning" ? "bg-amber-200 text-amber-800" : "bg-red-200 text-red-800"}`}>
                    {s.alert!.label}
                  </span>
                </div>
                <Link href={`/admin/sites/${s.id}`} className="text-xs text-blue-600 hover:underline">Gestionar →</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Sitios totales"
          value={totalSites}
          sub={`${activeSites} activos · ${inactiveSites} inactivos`}
          color="text-gray-900"
          badge={siteGrowth ? { label: siteGrowth.label, up: siteGrowth.up } : undefined}
        />
        <StatCard
          label="Usuarios registrados"
          value={totalUsers}
          sub={`${totalAdmins} administradores`}
          color="text-blue-600"
          badge={userGrowth ? { label: userGrowth.label, up: userGrowth.up } : undefined}
        />
        <StatCard
          label="Citas totales"
          value={totalAppointments}
          sub={`${todayAppointments} hoy · ${pendingAppointments} pendientes`}
          color="text-amber-600"
        />
        <StatCard
          label="Agentes IA"
          value={aiAgents}
          sub={`${aiProviders.filter(p => p.isActive).length}/${aiProviders.length} proveedores activos`}
          color="text-purple-600"
        />
      </div>

      {/* Metricas de salud de la plataforma */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Salud de la plataforma</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-1">Sitios nuevos este mes</p>
            <p className="text-3xl font-bold text-green-600">{sitesThisMonth}</p>
            <p className="text-xs text-gray-400 mt-1">{sitesLastMonth} el mes anterior</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-1">Usuarios nuevos este mes</p>
            <p className="text-3xl font-bold text-blue-600">{usersThisMonth}</p>
            <p className="text-xs text-gray-400 mt-1">{usersLastMonth} el mes anterior</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-1">Tasa de cancelacion</p>
            <p className={`text-3xl font-bold ${cancellationRate > 30 ? "text-red-500" : cancellationRate > 15 ? "text-amber-500" : "text-green-600"}`}>
              {cancellationRate}%
            </p>
            <p className="text-xs text-gray-400 mt-1">{cancelledAppointments} de {totalAppointments} citas</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-xs text-gray-400 mb-1">Sin actividad (30 dias)</p>
            <p className={`text-3xl font-bold ${inactiveSiteIds.length > 0 ? "text-red-500" : "text-green-600"}`}>
              {inactiveSiteIds.length}
            </p>
            <p className="text-xs text-gray-400 mt-1">sitios activos sin citas recientes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Proveedores IA */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Proveedores IA</h2>
            <Link href="/admin/ai" className="text-xs text-blue-600 hover:underline">Configurar</Link>
          </div>
          <div className="space-y-2">
            {aiProviders.length === 0 && <p className="text-sm text-gray-400">Sin proveedores</p>}
            {aiProviders.map(p => (
              <div key={p.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${p.isActive && p.apiKey ? "bg-green-400" : "bg-gray-300"}`} />
                  <span className="text-sm text-gray-700">{p.label}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.isActive && p.apiKey ? "bg-green-100 text-green-700" :
                  p.apiKey ? "bg-gray-100 text-gray-500" : "bg-red-50 text-red-500"
                }`}>
                  {p.isActive && p.apiKey ? "Activo" : p.apiKey ? "Inactivo" : "Sin key"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Planes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Planes de sitios</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">♾️ Ilimitados</span>
              <span className="font-bold text-gray-900">{totalSites - allSitesForAlert.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">⏱️ Con tiempo</span>
              <span className="font-bold text-gray-900">{allSitesForAlert.length}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-sm text-amber-600">⚠️ Por vencer</span>
              <span className="font-bold text-amber-600">{alertSites.filter(s => s.alert!.type === "warning").length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-600">🚨 En gracia</span>
              <span className="font-bold text-red-600">{alertSites.filter(s => s.alert!.type === "danger").length}</span>
            </div>
          </div>
        </div>

        {/* Distribucion por plantilla */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Por tipo de negocio</h2>
          <div className="space-y-2">
            {byTemplate.map(t => (
              <div key={t.template} className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-600">{templateLabels[t.template] ?? t.template}</span>
                <span className="font-bold text-gray-900">{t._count}</span>
              </div>
            ))}
            {byTemplate.length === 0 && <p className="text-sm text-gray-400">Sin sitios</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top sitios del mes */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Top sitios este mes</h2>
          {topSites.length === 0 ? (
            <p className="text-sm text-gray-400">Sin citas registradas este mes</p>
          ) : (
            <div className="space-y-3">
              {topSites.map((s, i) => (
                <div key={s.siteId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? "bg-amber-100 text-amber-700" :
                      i === 1 ? "bg-gray-100 text-gray-600" :
                      "bg-orange-50 text-orange-600"
                    }`}>{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-400">/site/{s.slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{s._count.siteId}</p>
                    <p className="text-xs text-gray-400">citas</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sitios sin actividad */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Sin actividad (30 dias)</h2>
            <span className="text-xs text-gray-400">sitios activos</span>
          </div>
          {inactiveSiteIds.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm text-green-600 font-medium">Todos los sitios tienen actividad reciente</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inactiveSiteIds.slice(0, 5).map(s => (
                <div key={s.id} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-gray-700">{s.name}</span>
                  <Link href={`/admin/sites/${s.id}`} className="text-xs text-blue-600 hover:underline">Ver →</Link>
                </div>
              ))}
              {inactiveSiteIds.length > 5 && (
                <p className="text-xs text-gray-400 pt-1">+{inactiveSiteIds.length - 5} mas</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sitios recientes */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sitios recientes</h2>
          <Link href="/admin/sites" className="text-sm text-blue-600 hover:underline">Ver todos →</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentSites.length === 0 && (
            <div className="p-8 text-center text-gray-400">
              No hay sitios aun. <Link href="/admin/sites/new" className="text-blue-600 hover:underline">Crear primero</Link>
            </div>
          )}
          {recentSites.map(site => {
            const alert = getSiteAlert(site as any);
            return (
              <div key={site.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: site.primaryColor }}>
                    {site.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-gray-900">{site.name}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${site.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {site.isActive ? "Activo" : "Inactivo"}
                      </span>
                      {alert && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${alert.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                          {alert.label}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400">{templateLabels[site.template]} · {site._count.users} usuarios · {site._count.appointments} citas</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/sites/${site.id}`} className="text-xs text-blue-600 hover:underline">Gestionar</Link>
                  <Link href={`/site/${site.slug}`} target="_blank" className="text-xs text-gray-400 hover:underline">Ver ↗</Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label, value, sub, color, badge,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
  badge?: { label: string; up: boolean };
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
      {badge && (
        <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-semibold ${
          badge.up ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
        }`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}
