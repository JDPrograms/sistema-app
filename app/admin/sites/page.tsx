import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CopySiteUrlBtn from "@/components/CopySiteUrlBtn";

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

function getSiteAlert(site: { planType: string; expiresAt: Date | null; expiryReason: string | null }) {
  if (site.planType !== "timed" || !site.expiresAt) return null;

  const now = new Date();
  const expires = new Date(site.expiresAt);
  const grace = new Date(expires);
  grace.setDate(grace.getDate() + 10);

  const daysUntil = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const daysUntilGrace = Math.ceil((grace.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const isPayment = site.expiryReason === "payment";

  if (daysUntil > 10) return null;

  if (daysUntil > 0) {
    return {
      type: "warning" as const,
      label: `Vence en ${daysUntil}d`,
      detail: isPayment ? "Pendiente de pago" : "Proximo a vencer",
    };
  }
  if (daysUntilGrace > 0) {
    return {
      type: "danger" as const,
      label: `Gracia: ${daysUntilGrace}d`,
      detail: isPayment ? "Pago vencido" : `Definitivo: ${grace.toLocaleDateString("es", { day: "numeric", month: "short" })}`,
    };
  }
  return null;
}

export default async function SitesPage() {
  const sites = await prisma.site.findMany({
    include: { _count: { select: { users: true, admins: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sitios web</h1>
          <p className="text-gray-500 mt-1">Administra todos los sitios creados</p>
        </div>
        <Link href="/admin/sites/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium text-sm transition-colors">
          + Nuevo sitio
        </Link>
      </div>


{sites.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <p className="text-gray-400 mb-4">No hay sitios creados aun</p>
          <Link href="/admin/sites/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm">
            Crear primer sitio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sites.map((site) => {
            const alert = getSiteAlert(site as any);
            return (
              <div key={site.id}
                className={`bg-white rounded-xl border p-6 flex items-center justify-between ${
                  alert?.type === "danger" ? "border-red-200" :
                  alert?.type === "warning" ? "border-amber-200" :
                  "border-gray-200"
                }`}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: site.primaryColor }}>
                    {site.name[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{site.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${site.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {site.isActive ? "Activo" : "Inactivo"}
                      </span>
                      {alert && (
                        <>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            alert.type === "warning" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }`}>
                            {alert.label}
                          </span>
                          <span className="text-xs text-gray-400">{alert.detail}</span>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">/site/{site.slug} · {templateLabels[site.template]}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {site._count.admins} admin(s) · {site._count.users} usuario(s)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap justify-end">
                  <CopySiteUrlBtn slug={site.slug} variant="login" label="URL Login admin" />
                  <CopySiteUrlBtn slug={site.slug} variant="public" label="URL Sitio" />
                  <Link href={`/site/${site.slug}`} target="_blank"
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Ver sitio
                  </Link>
                  <Link href={`/admin/sites/${site.id}`}
                    className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-sm hover:bg-blue-100 transition-colors">
                    Gestionar
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
