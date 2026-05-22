"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface PlanRequest {
  id: string;
  plan: string;
  status: string;
  message: string | null;
  adminNote: string | null;
  createdAt: string;
  site: { name: string; slug: string; planType: string };
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:  { label: "Pendiente",  color: "bg-amber-100 text-amber-700" },
  approved: { label: "Aprobada",   color: "bg-green-100 text-green-700" },
  rejected: { label: "Rechazada",  color: "bg-red-100 text-red-600" },
};

const PLAN_LABELS: Record<string, string> = { pro: "Pro", enterprise: "Empresa" };

export default function PlanRequestsPage() {
  const [requests, setRequests] = useState<PlanRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    const url = filter === "all" ? "/api/admin/plan-requests" : `/api/admin/plan-requests?status=${filter}`;
    const res = await fetch(url);
    if (res.ok) setRequests(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function respond(id: string, status: "approved" | "rejected") {
    setActing(id);
    const res = await fetch(`/api/admin/plan-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNote: noteInput[id] ?? "" }),
    });
    setActing(null);
    if (res.ok) load();
  }

  const pending = requests.filter((r) => r.status === "pending").length;

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de plan</h1>
        <p className="text-gray-500 mt-1">Gestiona las solicitudes de cambio de plan de los negocios</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {(["pending", "all", "approved", "rejected"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            {f === "all" ? "Todas" : f === "pending" ? `Pendientes${pending > 0 ? ` (${pending})` : ""}` : f === "approved" ? "Aprobadas" : "Rechazadas"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Cargando...</div>
      ) : requests.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
          No hay solicitudes {filter !== "all" ? `en estado "${filter === "pending" ? "pendiente" : filter === "approved" ? "aprobadas" : "rechazadas"}"` : ""}
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => {
            const badge = STATUS_BADGE[r.status] ?? STATUS_BADGE.pending;
            return (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-bold text-gray-900 text-lg">{r.site.name}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.color}`}>{badge.label}</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Plan {PLAN_LABELS[r.plan] ?? r.plan}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                      <span>/{r.site.slug}</span>
                      <span>·</span>
                      <span>Plan actual: {r.site.planType}</span>
                      <span>·</span>
                      <span>{new Date(r.createdAt).toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <Link
                    href={`/site/${r.site.slug}/admin`}
                    target="_blank"
                    className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    Ver panel ↗
                  </Link>
                </div>

                {r.message && (
                  <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-600 italic">
                    "{r.message}"
                  </div>
                )}

                {r.adminNote && r.status !== "pending" && (
                  <div className="bg-blue-50 rounded-xl p-3 mb-4 text-sm text-blue-700">
                    💬 Nota: {r.adminNote}
                  </div>
                )}

                {r.status === "pending" && (
                  <div className="border-t border-gray-100 pt-4">
                    <textarea
                      value={noteInput[r.id] ?? ""}
                      onChange={(e) => setNoteInput((p) => ({ ...p, [r.id]: e.target.value }))}
                      rows={2}
                      placeholder="Nota para el negocio (opcional) — Ej: 'Nos pondremos en contacto esta semana'"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={() => respond(r.id, "approved")}
                        disabled={acting === r.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                      >
                        {acting === r.id ? "Procesando..." : "✓ Aprobar"}
                      </button>
                      <button
                        onClick={() => respond(r.id, "rejected")}
                        disabled={acting === r.id}
                        className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-600 border border-red-200 font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
