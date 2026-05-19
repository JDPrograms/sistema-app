import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import AdminChat from "@/components/ai/AdminChat";
import SiteAdminSidebar from "@/components/admin/SiteAdminSidebar";
import { PushSubscriber } from "@/components/PushSubscriber";

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

  const show = (key: string) => isSuperAdmin || mods[key] === true;

  const navLinks = [
    { href: `/site/${slug}/admin`, label: "Dashboard" },
    ...(show("appointments") ? [{ href: `/site/${slug}/admin/appointments`, label: "Citas" }] : []),
    ...(show("appointments") ? [{ href: `/site/${slug}/admin/staff`, label: "Personal" }] : []),
    ...(show("products")     ? [{ href: `/site/${slug}/admin/products`, label: "Productos 📦" }] : []),
    ...(show("content")      ? [{ href: `/site/${slug}/admin/content`, label: "Contenido" }] : []),
    ...(show("billing")      ? [{ href: `/site/${slug}/admin/billing`, label: "Contabilidad 🧾" }] : []),
    ...(show("customize")    ? [{ href: `/site/${slug}/admin/customize`, label: "Personalizar" }] : []),
    ...(show("customize")    ? [{ href: `/site/${slug}/admin/sections`, label: "Secciones ⟡" }] : []),
    ...(show("customize")    ? [{ href: `/site/${slug}/admin/builder`, label: "Constructor ✦" }] : []),
    ...(show("ads")          ? [{ href: `/site/${slug}/admin/ads`, label: "Publicidades" }] : []),
    ...(show("users")        ? [{ href: `/site/${slug}/admin/users`, label: "Usuarios" }] : []),
    ...(show("ai")           ? [{ href: `/site/${slug}/admin/ai`, label: "IA" }] : []),
    ...(show("support")      ? [{ href: `/site/${slug}/admin/support`, label: "Soporte 💬" }] : []),
    { href: `/site/${slug}/admin/admins`, label: "Administradores" },
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          navLinks={navLinks}
          isSuperAdmin={isSuperAdmin}
          userName={session.user?.name ?? ""}
          signOutSlot={signOutSlot}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top spacer so hamburger button doesn't overlap content */}
          <div className="md:hidden h-14 flex-shrink-0 bg-white border-b border-gray-100 flex items-center justify-center px-14">
            <span className="font-semibold text-sm text-gray-700 truncate">{site.name}</span>
          </div>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>

        {(isSuperAdmin || mods.ai === true) && (
          <AdminChat agentId={site.adminAgentId ?? undefined} siteSlug={slug} siteName={site.name} />
        )}
      </div>
    </div>
  );
}
