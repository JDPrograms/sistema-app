import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import AdminChat from "@/components/ai/AdminChat";
import SiteAdminSidebar, { type NavSection } from "@/components/admin/SiteAdminSidebar";
import SiteAdminPageBanner from "@/components/admin/SiteAdminPageBanner";
import { PushSubscriber } from "@/components/PushSubscriber";
import NotificationBell from "@/components/admin/NotificationBell";
import { parseSitePerms } from "@/lib/permissions";

function getExpiryStatus(site: { planType: string; expiresAt: Date | null; expiryReason: string | null }) {
  if (site.planType !== "timed" || !site.expiresAt) return null;

  const now = new Date();
  const expires = new Date(site.expiresAt);
  const grace = new Date(expires);
  grace.setDate(grace.getDate() + 10);

  const diffMs = expires.getTime() - now.getTime();
  const daysUntil = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const graceMs = grace.getTime() - now.getTime();
  const daysUntilGrace = Math.ceil(graceMs / (1000 * 60 * 60 * 24));

  if (daysUntil > 10) return null;

  const isPayment = site.expiryReason === "payment";

  if (daysUntil > 0) {
    return {
      type: "warning" as const,
      days: daysUntil,
      message: isPayment
        ? `Tu sitio vencera en ${daysUntil} dia${daysUntil === 1 ? "" : "s"}. Realiza el pago para mantenerlo activo.`
        : `Tu sitio vencera en ${daysUntil} dia${daysUntil === 1 ? "" : "s"}.`,
      definitiveDate: grace,
    };
  } else if (daysUntilGrace > 0) {
    return {
      type: "danger" as const,
      days: daysUntilGrace,
      message: isPayment
        ? `Tu sitio esta vencido. Tienes ${daysUntilGrace} dia${daysUntilGrace === 1 ? "" : "s"} de gracia para realizar el pago.`
        : `Tu sitio esta vencido. Fecha definitiva de desactivacion: ${grace.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}.`,
      definitiveDate: grace,
    };
  }

  return { type: "expired" as const, days: 0, message: "Sitio desactivado por vencimiento.", definitiveDate: grace };
}

export default async function SiteAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role;

  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    redirect(`/site/${slug}/login`);
  }
  if (role === "siteadmin" && (session.user as any).siteSlug !== slug) {
    redirect(`/site/${slug}/login`);
  }

  const site = await prisma.site.findUnique({ where: { slug } });
  if (!site) redirect("/");

  if (!site.hasAdminPanel && role === "siteadmin") {
    redirect(`/site/${slug}/login`);
  }

  // Redirect new sites to onboarding wizard (outside this layout)
  if (!(site as any).onboardingCompleted) {
    redirect(`/site/${slug}/setup`);
  }

  if (site.planType === "timed" && site.expiresAt && site.isActive) {
    const grace = new Date(site.expiresAt);
    grace.setDate(grace.getDate() + 10);
    if (new Date() > grace) {
      await prisma.site.update({ where: { id: site.id }, data: { isActive: false } });
      if (role === "siteadmin") redirect(`/site/${slug}/login`);
    }
  }

  const isSuperAdmin = role === "superadmin";
  const mods = (() => { try { return JSON.parse(site.modules || "{}"); } catch { return {}; } })();
  const expiryStatus = getExpiryStatus(site as any);

  // Load fresh permissions from DB so changes apply without re-login
  let perms: Record<string, boolean> = {};
  if (!isSuperAdmin) {
    const adminRecord = await prisma.siteAdmin.findUnique({
      where: { id: (session.user as any).id },
      select: { permissions: true, isOwner: true },
    });
    perms = parseSitePerms(adminRecord?.permissions, adminRecord?.isOwner ?? false);
  }

  // Module must be enabled AND admin must have the corresponding permission
  const show = (moduleKey: string, permKey?: string) => {
    if (isSuperAdmin) return true;
    if (mods[moduleKey] !== true) return false;
    if (permKey) return perms[permKey] === true;
    return true;
  };

  const s = (key: string) => `/site/${slug}/admin/${key}`;

  const agenda = [
    ...(show("appointments", "canManageAppointments") ? [{ href: s("appointments"), label: "📅 Citas" }] : []),
    ...(show("calendar",     "canManageAppointments") ? [{ href: s("calendar"),     label: "🗓️ Calendario" }] : []),
    ...(show("appointments", "canManageStaff")        ? [{ href: s("staff"),        label: "👤 Personal" }] : []),
    ...(show("appointments", "canManageAppointments") ? [{ href: s("waiting-list"), label: "⏳ Lista de espera" }] : []),
  ];
  const ventas = [
    ...(show("products", "canManageProducts") ? [{ href: s("products"), label: "📦 Productos" }] : []),
    ...(show("billing",  "canManageBilling")  ? [{ href: s("billing"),  label: "🧾 Contabilidad" }] : []),
    ...(show("coupons",  "canManageCoupons")  ? [{ href: s("coupons"),  label: "🎟️ Cupones" }] : []),
    ...(show("loyalty",  "canManageLoyalty")  ? [{ href: s("loyalty"),  label: "⭐ Lealtad" }] : []),
  ];
  const clientes = [
    ...(show("users",      "canManageUsers")      ? [{ href: s("users"),      label: "👥 Usuarios" }] : []),
    ...(show("crm",        "canManageCRM")        ? [{ href: s("crm"),        label: "🗂️ CRM" }] : []),
    ...(show("reviews",    "canManageReviews")    ? [{ href: s("reviews"),    label: "⭐ Reseñas" }] : []),
    ...(show("newsletter", "canManageNewsletter") ? [{ href: s("newsletter"), label: "📧 Newsletter" }] : []),
  ];
  const contenido = [
    ...(show("content", "canManageContent") ? [{ href: s("content"), label: "📋 Contenido" }] : []),
    ...(show("gallery", "canManageGallery") ? [{ href: s("gallery"), label: "🖼️ Galería" }] : []),
    ...(show("blog",    "canManageBlog")    ? [{ href: s("blog"),    label: "✍️ Blog" }] : []),
    ...(show("faq",     "canManageFAQ")     ? [{ href: s("faq"),     label: "❓ FAQ" }] : []),
  ];
  const apariencia = [
    ...(show("customize", "canCustomize") ? [{ href: s("customize"), label: "🎨 Personalizar" }] : []),
    ...(show("customize", "canCustomize") ? [{ href: s("sections"),  label: "⟡ Secciones" }] : []),
    ...(show("customize", "canCustomize") ? [{ href: s("builder"),   label: "✦ Constructor" }] : []),
  ];
  const marketing = [
    ...(show("ads", "canManageAds") ? [{ href: s("ads"), label: "📢 Publicidades" }] : []),
    ...(show("ai",  "canManageAI")  ? [{ href: s("ai"),  label: "🤖 IA" }] : []),
  ];
  const operaciones = [
    ...(show("support", "canManageSupport") ? [{ href: s("support"), label: "💬 Soporte" }] : []),
    ...(show("support", "canManageSupport") ? [{ href: s("chat"),    label: "🗨️ Chat en vivo" }] : []),
    ...(show("tasks",   "canManageTasks")   ? [{ href: s("tasks"),   label: "✅ Tareas" }] : []),
    ...(show("pwa")                         ? [{ href: s("app"),     label: "📲 App Android" }] : []),
  ];

  const navSections: NavSection[] = [
    { label: "",          links: [{ href: `/site/${slug}/admin`, label: "📊 Dashboard", exact: true }] },
    ...(agenda.length      ? [{ label: "Agenda",      links: agenda }]      : []),
    ...(ventas.length      ? [{ label: "Ventas",       links: ventas }]      : []),
    ...(clientes.length    ? [{ label: "Clientes",     links: clientes }]    : []),
    ...(contenido.length   ? [{ label: "Contenido",    links: contenido }]   : []),
    ...(apariencia.length  ? [{ label: "Apariencia",   links: apariencia }]  : []),
    ...(marketing.length   ? [{ label: "Marketing",    links: marketing }]   : []),
    ...(operaciones.length ? [{ label: "Operaciones",  links: operaciones }] : []),
    {
      label: "Panel",
      links: [
        ...(isSuperAdmin || perms["canViewReports"]   ? [{ href: s("reports"),      label: "📊 Reportes" }]      : []),
        { href: s("audit-log"),    label: "📋 Actividad" },
        ...(isSuperAdmin || perms["canManageAdmins"]  ? [{ href: s("admins"),       label: "👑 Administradores" }] : []),
        { href: s("security"),     label: "🔐 Seguridad" },
        { href: s("qr"),           label: "📱 Código QR" },
        { href: s("subscription"), label: "💳 Planes" },
        { href: s("help"),         label: "📖 Guía de módulos" },
      ],
    },
  ];

  const signOutSlot = isSuperAdmin ? (
    <Link href="/admin" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
      Volver al super admin
    </Link>
  ) : (
    <form action={async () => { "use server"; await signOut({ redirectTo: `/site/${slug}/login` }); }}>
      <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
        Cerrar sesion
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col transition-colors duration-200">
      <PushSubscriber />
      {/* Expiry banner */}
      {expiryStatus && expiryStatus.type !== "expired" && (
        <div className={`w-full px-4 py-2.5 text-sm font-medium text-center flex items-center justify-center gap-2 ${
          expiryStatus.type === "warning" ? "bg-amber-400 text-amber-900" : "bg-red-500 text-white"
        }`}>
          <span>{expiryStatus.type === "warning" ? "⚠️" : "🚨"}</span>
          <span>{expiryStatus.message}</span>
          {expiryStatus.type === "danger" && (
            <span className="ml-2 font-bold">
              Fecha definitiva: {expiryStatus.definitiveDate.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <SiteAdminSidebar
          slug={slug}
          siteName={site.name}
          siteLogoUrl={site.logoUrl}
          sitePrimaryColor={site.primaryColor}
          navSections={navSections}
          isSuperAdmin={isSuperAdmin}
          userName={session.user?.name ?? ""}
          signOutSlot={signOutSlot}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="md:hidden h-14 flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between px-14 pr-4 transition-colors duration-200">
            <span className="font-semibold text-sm text-gray-700 dark:text-slate-200 truncate">{site.name}</span>
            <NotificationBell slug={slug} />
          </div>
          <main className="flex-1 overflow-auto">
            <SiteAdminPageBanner slug={slug} />
            {children}
          </main>
        </div>

        {(isSuperAdmin || mods.ai === true) && (
          <AdminChat agentId={site.adminAgentId ?? undefined} siteSlug={slug} siteName={site.name} />
        )}
      </div>
    </div>
  );
}
