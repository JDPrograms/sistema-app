"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface ReportData {
  summary: {
    totalSites: number; activeSites: number; inactiveSites: number;
    totalUsers: number; totalAdmins: number;
    totalPaidInvoices: number; totalRevenue: number;
  };
  recentSites: Array<{ id: string; name: string; slug: string; isActive: boolean; planType: string; createdAt: string; _count: { users: number; appointments: number; invoices: number } }>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color || "text-gray-900"}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/reports")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-gray-400">Cargando...</div>;
  if (!data) return <div className="p-8 text-red-500">Error al cargar reportes</div>;

  const { summary, recentSites } = data;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes globales</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Sitios totales" value={summary.totalSites} sub={`${summary.activeSites} activos`} />
        <StatCard label="Usuarios totales" value={summary.totalUsers} />
        <StatCard label="Admins de sitio" value={summary.totalAdmins} />
        <StatCard label="Ingresos (facturas pagadas)" value={`$${summary.totalRevenue.toLocaleString("es")}`} sub={`${summary.totalPaidInvoices} facturas`} color="text-green-600" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Sitios recientes</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Sitio</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Estado</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Usuarios</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Citas</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Facturas</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Creado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recentSites.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3">
                  <Link href={`/admin/sites/${s.id}`} className="font-medium text-blue-600 hover:underline">{s.name}</Link>
                  <p className="text-xs text-gray-400">/{s.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {s.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{s._count.users}</td>
                <td className="px-4 py-3 text-gray-700">{s._count.appointments}</td>
                <td className="px-4 py-3 text-gray-700">{s._count.invoices}</td>
                <td className="px-4 py-3 text-gray-400">{new Date(s.createdAt).toLocaleDateString("es")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
