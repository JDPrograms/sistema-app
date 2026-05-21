"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

export default function ReportsPage() {
  const { slug } = useParams() as { slug: string };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/site/${slug}/reports`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const exports = [
    { type: "users", label: "Usuarios", icon: "👥" },
    { type: "appointments", label: "Citas", icon: "📅" },
    { type: "invoices", label: "Facturas", icon: "🧾" },
    { type: "newsletter", label: "Newsletter", icon: "📧" },
    { type: "reviews", label: "Reseñas", icon: "⭐" },
  ];

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes y exportación</h1>

      {/* Export cards */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Exportar datos (CSV)</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {exports.map((e) => (
            <a key={e.type} href={`/api/site/${slug}/export?type=${e.type}`}
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-200 hover:bg-blue-50 transition-colors">
              <span className="text-2xl">{e.icon}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{e.label}</p>
                <p className="text-xs text-gray-400">Descargar CSV</p>
              </div>
            </a>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Cargando estadísticas...</p>}
    </div>
  );
}
