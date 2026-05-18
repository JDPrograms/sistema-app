import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function PortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const role = (session?.user as any)?.role;
  const siteSlug = (session?.user as any)?.siteSlug;

  if (!session || role !== "siteuser" || siteSlug !== slug) {
    redirect(`/site/${slug}/login`);
  }

  const userId = (session.user as any).id as string;
  const userEmail = session.user?.email ?? "";
  const siteId = (session.user as any).siteId as string;

  const [user, site, appointments, invoices] = await Promise.all([
    prisma.siteUser.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.site.findUnique({
      where: { id: siteId },
      select: { name: true, primaryColor: true, modules: true },
    }),
    prisma.siteAppointment.findMany({
      where: { siteId, clientEmail: userEmail },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.siteInvoice.findMany({
      where: { siteId, clientEmail: userEmail },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user || !site) redirect(`/site/${slug}/login`);

  const mods = JSON.parse(site.modules || "{}");
  const showAppointments = mods.appointments === true && appointments.length > 0;
  const showBilling = mods.billing === true && invoices.length > 0;
  const primaryColor = site.primaryColor ?? "#3b82f6";

  const statusLabel: Record<string, string> = {
    pending: "Pendiente", confirmed: "Confirmada", cancelled: "Cancelada", completed: "Completada",
  };
  const invoiceStatusLabel: Record<string, string> = {
    draft: "Borrador", sent: "Enviada", paid: "Pagada", cancelled: "Cancelada",
    accepted: "Aceptada", rejected: "Rechazada",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{site.name}</p>
            </div>
          </div>
          <form action={async () => { "use server"; await signOut({ redirectTo: `/site/${slug}/login` }); }}>
            <button type="submit" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Mi perfil</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Nombre</p>
              <p className="font-medium text-gray-900">{user.name}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Email</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Teléfono</p>
              <p className="font-medium text-gray-900">{user.phone || "—"}</p>
            </div>
          </div>
        </section>

        {/* Appointments */}
        {showAppointments && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis citas</h2>
            <div className="space-y-3">
              {appointments.map((a) => (
                <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{a.serviceName || "Cita"}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{a.date} {a.time}{a.staffName ? ` · ${a.staffName}` : ""}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    a.status === "confirmed" ? "bg-green-100 text-green-700" :
                    a.status === "cancelled" ? "bg-red-100 text-red-600" :
                    a.status === "completed" ? "bg-blue-100 text-blue-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {statusLabel[a.status] ?? a.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Invoices */}
        {showBilling && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Mis facturas</h2>
            <div className="space-y-3">
              {invoices.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{inv.type === "quote" ? "Cotización" : "Factura"} #{inv.number}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{new Date(inv.createdAt).toLocaleDateString("es")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${inv.total.toLocaleString("es")}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inv.status === "paid" ? "bg-green-100 text-green-700" :
                      inv.status === "cancelled" ? "bg-red-100 text-red-600" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {invoiceStatusLabel[inv.status] ?? inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!showAppointments && !showBilling && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-lg font-medium text-gray-600">Bienvenido a tu portal</p>
            <p className="text-sm mt-1">Aquí aparecerá tu historial de citas y pedidos.</p>
          </div>
        )}

        <div className="text-center">
          <Link href={`/site/${slug}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Volver al sitio
          </Link>
        </div>
      </main>
    </div>
  );
}
