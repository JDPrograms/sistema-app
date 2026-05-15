import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import AdminChat from "@/components/ai/AdminChat";

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

  if (daysUntil > 10) return null; // Sin advertencia

  const isPayment = site.expiryReason === "payment";

  if (daysUntil > 0) {
    // Advertencia amarilla: faltan X dias
    return {
      type: "warning" as const,
      days: daysUntil,
      message: isPayment
        ? `Tu sitio vencera en ${daysUntil} dia${daysUntil === 1 ? "" : "s"}. Realiza el pago para mantenerlo activo.`
        : `Tu sitio vencera en ${daysUntil} dia${daysUntil === 1 ? "" : "s"}.`,
      definitiveDate: grace,
    };
  } else if (daysUntilGrace > 0) {
    // Periodo de gracia: advertencia roja
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

  // Auto-desactivar si paso el periodo de gracia
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

  const navLinks = [
    { href: `/site/${slug}/admin`, label: "Dashboard" },
    ...(mods.appointments !== false ? [{ href: `/site/${slug}/admin/appointments`, label: "Citas" }] : []),
    ...(mods.appointments !== false ? [{ href: `/site/${slug}/admin/staff`, label: "Personal" }] : []),
    ...(mods.customize !== false ? [{ href: `/site/${slug}/admin/customize`, label: "Personalizar" }] : []),
    ...(mods.customize !== false ? [{ href: `/site/${slug}/admin/builder`, label: "Constructor ✦" }] : []),
    ...(mods.content !== false ? [{ href: `/site/${slug}/admin/content`, label: "Contenido" }] : []),
    ...(mods.ads !== false ? [{ href: `/site/${slug}/admin/ads`, label: "Publicidades" }] : []),
    ...(mods.users !== false ? [{ href: `/site/${slug}/admin/users`, label: "Usuarios" }] : []),
    ...(mods.ai !== false ? [{ href: `/site/${slug}/admin/ai`, label: "IA" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Banner de vencimiento */}
      {expiryStatus && expiryStatus.type !== "expired" && (
        <div className={`w-full px-4 py-2.5 text-sm font-medium text-center flex items-center justify-center gap-2 ${
          expiryStatus.type === "warning"
            ? "bg-amber-400 text-amber-900"
            : "bg-red-500 text-white"
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

      <div className="flex flex-1">
        <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
          {isSuperAdmin && (
            <div className="px-4 py-2 bg-blue-600 text-white text-xs flex items-center gap-2">
              <span className="opacity-80">Super Admin</span>
              <Link href="/admin" className="ml-auto hover:underline font-medium">← Panel</Link>
            </div>
          )}
          <div className="p-5 border-b border-gray-100">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
              style={{ backgroundColor: site.primaryColor }}
            >
              {site.logoUrl
                ? <img src={site.logoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
                : site.name[0]}
            </div>
            <p className="font-bold text-sm text-gray-900 leading-tight">{site.name}</p>
            <p className="text-xs text-gray-400">Panel admin</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100 mt-2">
              <Link href={`/site/${slug}`} target="_blank"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors">
                Ver sitio publico ↗
              </Link>
            </div>
          </nav>

          <div className="p-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 truncate">{session.user?.name}</p>
            {isSuperAdmin ? (
              <Link href="/admin" className="text-xs text-blue-600 hover:text-blue-800 transition-colors">
                Volver al super admin
              </Link>
            ) : (
              <form action={async () => { "use server"; await signOut({ redirectTo: `/site/${slug}/login` }); }}>
                <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
                  Cerrar sesion
                </button>
              </form>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-auto">{children}</main>
        {mods.ai !== false && (
          <AdminChat agentId={site.adminAgentId ?? undefined} siteSlug={slug} siteName={site.name} />
        )}
      </div>
    </div>
  );
}
