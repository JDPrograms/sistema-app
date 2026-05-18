import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

const templateLabels: Record<string, string> = {
  barbershop:   "Peluquería / Barbería",
  salon:        "Salón de Belleza / Spa",
  restaurant:   "Restaurante",
  cafeteria:    "Cafetería / Comida Rápida",
  gym:          "Gimnasio / Fitness",
  clinic:       "Clínica / Consultorio",
  school:       "Academia / Escuela",
  veterinary:   "Veterinaria",
  lawyer:       "Estudio Jurídico",
  realestate:   "Inmobiliaria",
  hotel:        "Hotel / Hospedaje",
  hardware:     "Ferretería / Tienda",
  photographer: "Fotógrafo / Portafolio",
  tutor:        "Tutor / Consultor",
  pharmacy:     "Farmacia / Salud",
  store:        "Tienda / Supermercado",
  generic:      "Genérico",
};

const STATUS_APPT: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: "Pendiente",  color: "bg-amber-100 text-amber-700",  dot: "bg-amber-400" },
  confirmed: { label: "Confirmada", color: "bg-green-100 text-green-700",  dot: "bg-green-400" },
  cancelled: { label: "Cancelada",  color: "bg-red-100 text-red-600",      dot: "bg-red-400" },
  completed: { label: "Completada", color: "bg-blue-100 text-blue-700",    dot: "bg-blue-400" },
};

function Trend({ cur, prev, invert = false }: { cur: number; prev: number; invert?: boolean }) {
  if (prev === 0 && cur === 0) return null;
  if (prev === 0) return <span className="text-xs font-bold text-green-600">Nuevo</span>;
  const pct = Math.round(((cur - prev) / prev) * 100);
  if (pct === 0) return <span className="text-xs text-gray-400">= sin cambio</span>;
  const up = pct > 0;
  const good = invert ? !up : up;
  return (
    <span className={`text-xs font-bold ${good ? "text-green-600" : "text-red-500"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%
    </span>
  );
}

function StatCard({ label, value, sub, trend, icon, accent }: {
  label: string; value: string | number; sub?: string;
  trend?: React.ReactNode; icon: string; accent?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-5 -translate-y-6 translate-x-6"
        style={{ backgroundColor: accent || "#3b82f6" }} />
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        {trend}
      </div>
      <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
      <p className="text-xs font-semibold text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

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
  const billingCfg = (() => { try { return JSON.parse((site as any).billingConfig || "{}"); } catch { return {}; } })();
  const cur = billingCfg.currency || "$";
  // products module: fall back to content for backwards compat with old sites
  const hasProducts = mods.products === true || (mods.products === undefined && mods.content === true);
  const hasBilling = mods.billing === true;

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekStr = weekStart.toISOString().split("T")[0];
  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  // ── Appointments ──────────────────────────────────────────
  const [
    pendingCount, confirmedCount, cancelledCount, completedCount,
    todayCount, weekCount,
    apptThisMonth, apptLastMonth,
    upcomingAppts, recentAppts,
    topStaffRaw, topServicesRaw,
    newUsersThisMonth, newUsersLastMonth,
  ] = await Promise.all([
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "pending" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "confirmed" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "cancelled" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, status: "completed" } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: today } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { gte: weekStr } } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { startsWith: thisMonthStr } } }),
    prisma.siteAppointment.count({ where: { siteId: site.id, date: { startsWith: lastMonthStr } } }),
    prisma.siteAppointment.findMany({
      where: { siteId: site.id, date: { gte: today, lte: tomorrowStr }, status: { not: "cancelled" } },
      orderBy: [{ date: "asc" }, { time: "asc" }], take: 5,
      select: { id: true, clientName: true, serviceName: true, staffName: true, date: true, time: true, status: true },
    }),
    prisma.siteAppointment.findMany({
      where: { siteId: site.id }, orderBy: [{ date: "desc" }, { time: "desc" }], take: 6,
      select: { id: true, clientName: true, serviceName: true, date: true, time: true, status: true },
    }),
    prisma.siteAppointment.groupBy({ by: ["staffName"], where: { siteId: site.id, staffName: { not: null } },
      _count: { staffName: true }, orderBy: { _count: { staffName: "desc" } }, take: 4 }),
    prisma.siteAppointment.groupBy({ by: ["serviceName"], where: { siteId: site.id, serviceName: { not: null } },
      _count: { serviceName: true }, orderBy: { _count: { serviceName: "desc" } }, take: 4 }),
    prisma.siteUser.count({ where: { siteId: site.id, createdAt: { gte: thisMonthStart } } }),
    prisma.siteUser.count({ where: { siteId: site.id, createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
  ]);

  // ── Billing ───────────────────────────────────────────────
  const [
    incomeThisMonthRaw, incomeLastMonthRaw,
    expenseThisMonthRaw, expenseLastMonthRaw,
    pendingInvoicesRaw, overdueInvoices,
    recentInvoices, totalInvoiceCount,
  ] = await Promise.all([
    prisma.siteInvoice.aggregate({ where: { siteId: site.id, type: "invoice", status: "paid", paidAt: { gte: thisMonthStart } }, _sum: { total: true } }),
    prisma.siteInvoice.aggregate({ where: { siteId: site.id, type: "invoice", status: "paid", paidAt: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { total: true } }),
    prisma.siteExpense.aggregate({ where: { siteId: site.id, date: { gte: thisMonthStart } }, _sum: { amount: true } }),
    prisma.siteExpense.aggregate({ where: { siteId: site.id, date: { gte: lastMonthStart, lt: thisMonthStart } }, _sum: { amount: true } }),
    prisma.siteInvoice.aggregate({ where: { siteId: site.id, type: "invoice", status: { in: ["draft", "sent"] } }, _sum: { total: true }, _count: true }),
    prisma.siteInvoice.findMany({
      where: { siteId: site.id, type: "invoice", status: { in: ["draft", "sent"] }, dueDate: { lt: now } },
      orderBy: { dueDate: "asc" }, take: 5,
      select: { id: true, number: true, clientName: true, total: true, dueDate: true },
    }),
    prisma.siteInvoice.findMany({
      where: { siteId: site.id }, orderBy: { createdAt: "desc" }, take: 5,
      select: { id: true, number: true, type: true, clientName: true, total: true, status: true, createdAt: true },
    }),
    prisma.siteInvoice.count({ where: { siteId: site.id } }),
  ]);

  // ── Products ─────────────────────────────────────────────
  const [outOfStockProducts, lowStockProducts, activeProductCount] = await Promise.all([
    prisma.siteProduct.findMany({
      where: { siteId: site.id, isActive: true, stock: 0 },
      take: 6, select: { id: true, name: true, category: true },
    }),
    prisma.$queryRaw<{ id: string; name: string; stock: number; "lowStockAlert": number }[]>`
      SELECT id, name, stock, "lowStockAlert" FROM "SiteProduct"
      WHERE "siteId" = ${site.id} AND "isActive" = true
      AND stock > 0 AND "lowStockAlert" IS NOT NULL AND stock <= "lowStockAlert"
      LIMIT 6
    `,
    prisma.siteProduct.count({ where: { siteId: site.id, isActive: true } }),
  ]);

  // ── Computed ─────────────────────────────────────────────
  const totalAppts = pendingCount + confirmedCount + cancelledCount + completedCount;
  const closedAppts = completedCount + cancelledCount;
  const completionRate = closedAppts > 0 ? Math.round((completedCount / closedAppts) * 100) : null;
  const incomeThisMonth = incomeThisMonthRaw._sum.total ?? 0;
  const incomeLastMonth = incomeLastMonthRaw._sum.total ?? 0;
  const expenseThisMonth = expenseThisMonthRaw._sum.amount ?? 0;
  const expenseLastMonth = expenseLastMonthRaw._sum.amount ?? 0;
  const profitThisMonth = incomeThisMonth - expenseThisMonth;
  const profitLastMonth = incomeLastMonth - expenseLastMonth;
  const pendingInvoiceAmt = pendingInvoicesRaw._sum.total ?? 0;
  const pendingInvoiceCount = pendingInvoicesRaw._count;
  const hasBillingData = hasBilling && (totalInvoiceCount > 0 || expenseThisMonth > 0);
  const alertCount = outOfStockProducts.length + overdueInvoices.length + (pendingCount > 5 ? 1 : 0);

  const quickLinks = [
    ...(mods.appointments === true ? [{ href: `/site/${slug}/admin/appointments`, icon: "📅", label: "Citas", desc: `${pendingCount} pendientes` }] : []),
    ...(mods.appointments === true ? [{ href: `/site/${slug}/admin/staff`, icon: "🧑‍💼", label: "Personal", desc: `${site._count.staff} miembros` }] : []),
    ...(hasProducts ? [{ href: `/site/${slug}/admin/products`, icon: "📦", label: "Productos", desc: `${activeProductCount} activos` }] : []),
    ...(mods.content === true ? [{ href: `/site/${slug}/admin/content`, icon: "📋", label: "Contenido", desc: "Servicios y páginas" }] : []),
    ...(mods.customize === true ? [{ href: `/site/${slug}/admin/customize`, icon: "🎨", label: "Personalizar", desc: "Colores y logo" }] : []),
    ...(mods.ads === true ? [{ href: `/site/${slug}/admin/ads`, icon: "📢", label: "Publicidades", desc: `${site._count.ads} activas` }] : []),
    ...(mods.users === true ? [{ href: `/site/${slug}/admin/users`, icon: "👥", label: "Usuarios", desc: `${site._count.users} registrados` }] : []),
    ...(hasBilling ? [{ href: `/site/${slug}/admin/billing`, icon: "🧾", label: "Contabilidad", desc: hasBillingData ? `${cur}${incomeThisMonth.toFixed(0)} este mes` : "Sin datos aún" }] : []),
    ...(mods.ai === true ? [{ href: `/site/${slug}/admin/ai`, icon: "🤖", label: "IA", desc: `${site._count.aiAgents} agentes` }] : []),
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl">

      {/* ── HEADER ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-black text-gray-900">{site.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${site.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
              {site.isActive ? "● Activo" : "● Inactivo"}
            </span>
          </div>
          <p className="text-sm text-gray-500">{templateLabels[site.template] ?? site.template} · /site/{slug}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {hasBilling && (
            <Link href={`/site/${slug}/admin/billing`}
              className="hidden sm:flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              🧾 Contabilidad
            </Link>
          )}
          <Link href={`/site/${slug}`} target="_blank"
            className="flex items-center gap-1.5 text-sm border border-gray-200 px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Ver sitio ↗
          </Link>
        </div>
      </div>

      {/* ── KPI HERO CARDS ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {hasBillingData && (
          <StatCard icon="💰" label="Ingresos (mes)" value={`${cur}${incomeThisMonth.toFixed(0)}`}
            sub={`${cur}${incomeLastMonth.toFixed(0)} mes anterior`} accent="#22c55e"
            trend={<Trend cur={incomeThisMonth} prev={incomeLastMonth} />} />
        )}
        {hasBillingData && (
          <StatCard icon="📤" label="Gastos (mes)" value={`${cur}${expenseThisMonth.toFixed(0)}`}
            sub={`${cur}${expenseLastMonth.toFixed(0)} mes anterior`} accent="#ef4444"
            trend={<Trend cur={expenseThisMonth} prev={expenseLastMonth} invert />} />
        )}
        {mods.appointments === true && (
          <StatCard icon="📅" label="Citas este mes" value={apptThisMonth}
            sub={`${apptLastMonth} mes anterior`} accent="#3b82f6"
            trend={<Trend cur={apptThisMonth} prev={apptLastMonth} />} />
        )}
        {mods.users === true && (
          <StatCard icon="👥" label="Clientes nuevos" value={newUsersThisMonth}
            sub={`${newUsersLastMonth} mes anterior`} accent="#8b5cf6"
            trend={<Trend cur={newUsersThisMonth} prev={newUsersLastMonth} />} />
        )}
        {hasProducts && activeProductCount > 0 && (
          <StatCard icon="📦" label="Productos activos" value={activeProductCount}
            sub={outOfStockProducts.length > 0 ? `${outOfStockProducts.length} sin stock` : "Stock OK"}
            accent={outOfStockProducts.length > 0 ? "#f59e0b" : "#10b981"} />
        )}
        {!hasBillingData && mods.appointments === true && (
          <StatCard icon="✅" label="Tasa completitud" accent="#10b981"
            value={completionRate !== null ? `${completionRate}%` : "—"}
            sub={`${completedCount} completadas`} />
        )}
      </div>

      {/* ── ALERTAS ── */}
      {alertCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-800 mb-3">⚠️ Alertas que requieren atención</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {outOfStockProducts.length > 0 && (
              <Link href={`/site/${slug}/admin/products`}
                className="bg-white border border-red-200 rounded-xl p-3 hover:border-red-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs font-bold text-red-700">{outOfStockProducts.length} producto{outOfStockProducts.length > 1 ? "s" : ""} sin stock</p>
                </div>
                <div className="space-y-1">
                  {outOfStockProducts.slice(0, 3).map(p => (
                    <p key={p.id} className="text-xs text-gray-600 truncate">• {p.name}</p>
                  ))}
                  {outOfStockProducts.length > 3 && <p className="text-xs text-gray-400">+{outOfStockProducts.length - 3} más</p>}
                </div>
              </Link>
            )}
            {lowStockProducts.length > 0 && (
              <Link href={`/site/${slug}/admin/products`}
                className="bg-white border border-yellow-200 rounded-xl p-3 hover:border-yellow-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  <p className="text-xs font-bold text-yellow-700">{lowStockProducts.length} con stock bajo</p>
                </div>
                <div className="space-y-1">
                  {lowStockProducts.slice(0, 3).map(p => (
                    <p key={p.id} className="text-xs text-gray-600 truncate">• {p.name} — {p.stock} unidades</p>
                  ))}
                  {lowStockProducts.length > 3 && <p className="text-xs text-gray-400">+{lowStockProducts.length - 3} más</p>}
                </div>
              </Link>
            )}
            {overdueInvoices.length > 0 && (
              <Link href={`/site/${slug}/admin/billing`}
                className="bg-white border border-red-200 rounded-xl p-3 hover:border-red-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  <p className="text-xs font-bold text-red-700">{overdueInvoices.length} factura{overdueInvoices.length > 1 ? "s" : ""} vencida{overdueInvoices.length > 1 ? "s" : ""}</p>
                </div>
                <div className="space-y-1">
                  {overdueInvoices.slice(0, 3).map(inv => (
                    <p key={inv.id} className="text-xs text-gray-600 truncate">• {inv.number} — {inv.clientName}</p>
                  ))}
                </div>
              </Link>
            )}
            {pendingCount > 5 && (
              <Link href={`/site/${slug}/admin/appointments`}
                className="bg-white border border-orange-200 rounded-xl p-3 hover:border-orange-300 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  <p className="text-xs font-bold text-orange-700">{pendingCount} citas sin confirmar</p>
                </div>
                <p className="text-xs text-gray-500">Revisa y confirma las citas pendientes</p>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN GRID: BILLING + APPOINTMENTS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contabilidad */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">🧾 Contabilidad</h2>
            <Link href={`/site/${slug}/admin/billing`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver todo →</Link>
          </div>
          <div className="p-5">
            {hasBillingData ? (
              <>
                {/* Income / Expense / Profit bars */}
                <div className="space-y-3 mb-5">
                  {[
                    { label: "Ingresos", value: incomeThisMonth, color: "bg-green-400", textColor: "text-green-700" },
                    { label: "Gastos",   value: expenseThisMonth, color: "bg-red-400",   textColor: "text-red-600" },
                    { label: "Ganancia", value: Math.max(0, profitThisMonth), color: profitThisMonth >= 0 ? "bg-emerald-500" : "bg-gray-300", textColor: profitThisMonth >= 0 ? "text-emerald-700" : "text-gray-500" },
                  ].map(({ label, value, color, textColor }) => {
                    const max = Math.max(incomeThisMonth, expenseThisMonth, 1);
                    return (
                      <div key={label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500 font-medium">{label}</span>
                          <span className={`font-bold ${textColor}`}>{cur}{value.toFixed(2)}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${Math.min(100, (value / max) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pending invoices CTA */}
                {pendingInvoiceCount > 0 && (
                  <div className="mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-blue-700">{pendingInvoiceCount} factura{pendingInvoiceCount > 1 ? "s" : ""} por cobrar</p>
                      <p className="text-xs text-blue-600">{cur}{pendingInvoiceAmt.toFixed(2)} pendiente</p>
                    </div>
                    <Link href={`/site/${slug}/admin/billing`} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors">Gestionar</Link>
                  </div>
                )}

                {/* Recent invoices */}
                <div className="space-y-2">
                  {recentInvoices.map(inv => {
                    const statusCls: Record<string, string> = { draft: "text-gray-400", sent: "text-blue-600", paid: "text-green-600", cancelled: "text-red-400", accepted: "text-emerald-600", rejected: "text-red-400" };
                    const statusLabel: Record<string, string> = { draft: "Borrador", sent: "Enviado", paid: "Pagado", cancelled: "Cancelado", accepted: "Aceptado", rejected: "Rechazado" };
                    return (
                      <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-400">{inv.number}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded font-semibold" style={{ fontSize: "10px" }}>
                              {inv.type === "quote" ? "COT" : "FAC"}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{inv.clientName}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-bold text-gray-900">{cur}{inv.total.toFixed(2)}</p>
                          <p className={`text-xs font-semibold ${statusCls[inv.status] || "text-gray-400"}`}>{statusLabel[inv.status] || inv.status}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-3xl mb-3">🧾</p>
                <p className="text-sm font-semibold text-gray-600 mb-1">Contabilidad sin datos</p>
                <p className="text-xs text-gray-400 mb-4">Crea tu primera factura o registra un gasto</p>
                <Link href={`/site/${slug}/admin/billing`}
                  className="inline-block px-4 py-2 rounded-xl text-white text-xs font-bold bg-blue-600 hover:bg-blue-700 transition-colors">
                  Ir a Contabilidad →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Citas */}
        {mods.appointments === true ? (
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-gray-900">📅 Citas</h2>
              <Link href={`/site/${slug}/admin/appointments`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver todas →</Link>
            </div>
            <div className="p-5">
              {/* Status row */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: "Hoy",        value: todayCount,     color: "text-gray-900",   bg: "bg-gray-50"    },
                  { label: "Pendientes", value: pendingCount,   color: "text-amber-600",  bg: "bg-amber-50"   },
                  { label: "Confirmadas",value: confirmedCount, color: "text-green-700",  bg: "bg-green-50"   },
                  { label: "Esta semana",value: weekCount,      color: "text-blue-700",   bg: "bg-blue-50"    },
                ].map(s => (
                  <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                    <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {totalAppts > 0 && (
                <div className="mb-4">
                  <div className="flex h-2.5 rounded-full overflow-hidden gap-px bg-gray-100">
                    {pendingCount > 0   && <div className="bg-amber-400 rounded-full transition-all" style={{ flex: pendingCount }} />}
                    {confirmedCount > 0 && <div className="bg-green-400 rounded-full transition-all" style={{ flex: confirmedCount }} />}
                    {completedCount > 0 && <div className="bg-blue-400 rounded-full transition-all" style={{ flex: completedCount }} />}
                    {cancelledCount > 0 && <div className="bg-gray-300 rounded-full transition-all" style={{ flex: cancelledCount }} />}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                    {[
                      { label: "Pendientes", count: pendingCount, dot: "bg-amber-400" },
                      { label: "Confirmadas", count: confirmedCount, dot: "bg-green-400" },
                      { label: "Completadas", count: completedCount, dot: "bg-blue-400" },
                      { label: "Canceladas", count: cancelledCount, dot: "bg-gray-300" },
                    ].filter(s => s.count > 0).map(s => (
                      <div key={s.label} className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        <span className="text-xs text-gray-500">{s.label}: {s.count}</span>
                      </div>
                    ))}
                    {completionRate !== null && (
                      <span className="text-xs text-gray-400 ml-auto">{completionRate}% completitud</span>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Próximas (hoy y mañana)</p>
              {upcomingAppts.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin citas próximas</p>
              ) : (
                <div className="space-y-1.5">
                  {upcomingAppts.map(a => {
                    const st = STATUS_APPT[a.status] ?? STATUS_APPT.pending;
                    const isToday = a.date === today;
                    return (
                      <div key={a.id} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-xl">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isToday ? "bg-blue-100 text-blue-700" : "bg-gray-200 text-gray-500"}`}>
                          {isToday ? "Hoy" : "Mañana"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{a.clientName}</p>
                          <p className="text-xs text-gray-400 truncate">{a.serviceName ?? "—"}{a.staffName ? ` · ${a.staffName}` : ""}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs font-bold text-gray-700">{a.time}</p>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* No appointments module – show business overview */
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h2 className="font-bold text-gray-900 mb-4">📊 Resumen del negocio</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "👥", label: "Usuarios", value: site._count.users, enabled: mods.users === true },
                { icon: "📋", label: "Servicios", value: site._count.services, enabled: mods.content === true },
                { icon: "📦", label: "Productos", value: site._count.products, enabled: hasProducts },
                { icon: "📢", label: "Publicidades", value: site._count.ads, enabled: mods.ads === true },
                { icon: "🤖", label: "Agentes IA", value: site._count.aiAgents, enabled: mods.ai === true },
              ].filter(i => i.enabled).map(item => (
                <div key={item.label} className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-xl font-black text-gray-900">{item.value}</p>
                    <p className="text-xs text-gray-500">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── SECONDARY GRID: TOP RANKINGS + PRODUCTOS + RESUMEN ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* Top staff + servicios */}
        {mods.appointments === true && (
          <div className="space-y-4">
            {topStaffRaw.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">🏆 Staff más solicitado</h3>
                <div className="space-y-2.5">
                  {topStaffRaw.map((s, i) => {
                    const max = topStaffRaw[0]._count.staffName;
                    return (
                      <div key={s.staffName}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                            <span className="text-gray-700 font-medium truncate">{s.staffName}</span>
                          </div>
                          <span className="font-bold text-gray-900 flex-shrink-0 ml-2">{s._count.staffName}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 rounded-full" style={{ width: `${(s._count.staffName / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {topServicesRaw.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">⭐ Servicios más pedidos</h3>
                <div className="space-y-2.5">
                  {topServicesRaw.map((s, i) => {
                    const max = topServicesRaw[0]._count.serviceName;
                    return (
                      <div key={s.serviceName}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs flex-shrink-0">{i + 1}</span>
                            <span className="text-gray-700 font-medium truncate">{s.serviceName}</span>
                          </div>
                          <span className="font-bold text-gray-900 flex-shrink-0 ml-2">{s._count.serviceName}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 rounded-full" style={{ width: `${(s._count.serviceName / max) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inventario de productos */}
        {hasProducts && site._count.products > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-sm">📦 Estado del Inventario</h3>
              <Link href={`/site/${slug}/admin/products`} className="text-xs text-blue-600 hover:text-blue-800">Ver →</Link>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: "Activos", value: activeProductCount, color: "text-green-700", bg: "bg-green-50" },
                { label: "Sin stock", value: outOfStockProducts.length, color: "text-red-700", bg: "bg-red-50" },
                { label: "Stock bajo", value: lowStockProducts.length, color: "text-yellow-700", bg: "bg-yellow-50" },
              ].map(s => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
                  <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            {outOfStockProducts.length + lowStockProducts.length > 0 ? (
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Requieren atención</p>
                {outOfStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-red-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-gray-800 truncate flex-1">{p.name}</p>
                    <span className="text-xs text-red-600 font-bold flex-shrink-0">Agotado</span>
                  </div>
                ))}
                {lowStockProducts.slice(0, 3).map(p => (
                  <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 bg-yellow-50 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-gray-800 truncate flex-1">{p.name}</p>
                    <span className="text-xs text-yellow-700 font-bold flex-shrink-0">{p.stock} ud.</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-2xl mb-1">✅</p>
                <p className="text-xs text-gray-500 font-medium">Todo el inventario en orden</p>
              </div>
            )}
          </div>
        )}

        {/* Resumen del negocio + ultimas citas */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 text-sm mb-4">🏪 Resumen del negocio</h3>
            <div className="space-y-2.5">
              {[
                { icon: "👥", label: "Usuarios registrados", value: site._count.users, enabled: mods.users === true, href: `/site/${slug}/admin/users` },
                { icon: "🧑‍💼", label: "Personal activo", value: site._count.staff, enabled: mods.appointments === true, href: `/site/${slug}/admin/staff` },
                { icon: "📋", label: "Servicios", value: site._count.services, enabled: mods.content === true, href: `/site/${slug}/admin/content` },
                { icon: "📦", label: "Productos", value: site._count.products, enabled: hasProducts, href: `/site/${slug}/admin/products` },
                { icon: "📢", label: "Publicidades activas", value: site._count.ads, enabled: mods.ads === true, href: `/site/${slug}/admin/ads` },
                { icon: "🤖", label: "Agentes IA", value: site._count.aiAgents, enabled: mods.ai === true, href: `/site/${slug}/admin/ai` },
              ].filter(i => i.enabled).map(item => (
                <Link key={item.label} href={item.href}
                  className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{item.icon}</span>
                    <span className="group-hover:text-gray-900 transition-colors">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900">{item.value}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Mes anterior comparacion */}
          {mods.appointments === true && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 text-sm mb-3">📊 Este mes vs anterior</h3>
              <div className="space-y-3">
                {[
                  { label: "Citas", cur: apptThisMonth, prev: apptLastMonth },
                  ...(mods.users === true ? [{ label: "Clientes nuevos", cur: newUsersThisMonth, prev: newUsersLastMonth }] : []),
                  ...(hasBillingData ? [{ label: "Ingresos", cur: Math.round(incomeThisMonth), prev: Math.round(incomeLastMonth), prefix: cur }] : []),
                ].map(item => {
                  const pct = item.prev > 0 ? Math.round(((item.cur - item.prev) / item.prev) * 100) : null;
                  const up = (item.cur - item.prev) > 0;
                  return (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{item.prefix ?? ""}{item.prev}</span>
                        <span className="text-gray-300">→</span>
                        <span className="text-sm font-bold text-gray-900">{item.prefix ?? ""}{item.cur}</span>
                        {pct !== null && pct !== 0 && (
                          <span className={`text-xs font-bold ${up ? "text-green-600" : "text-red-500"}`}>
                            {up ? "▲" : "▼"}{Math.abs(pct)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── ÚLTIMAS CITAS ── */}
      {mods.appointments === true && recentAppts.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">📋 Últimas citas</h2>
            <Link href={`/site/${slug}/admin/appointments`} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Ver todas →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentAppts.map(a => {
              const st = STATUS_APPT[a.status] ?? STATUS_APPT.pending;
              return (
                <div key={a.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{a.clientName}</p>
                      <p className="text-xs text-gray-400 truncate">{a.serviceName ?? "Sin servicio"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                    <p className="text-xs text-gray-400 hidden sm:block">{a.date} · {a.time}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ACCESOS RÁPIDOS ── */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Accesos rápidos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickLinks.map(link => (
            <Link key={link.href} href={link.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-blue-300 hover:shadow-md transition-all group flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                style={{ backgroundColor: `${site.primaryColor}18` }}>
                {link.icon}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">{link.label}</p>
                <p className="text-xs text-gray-400 truncate">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
