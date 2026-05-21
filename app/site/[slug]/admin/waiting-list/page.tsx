"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface WaitingItem { id: string; clientName: string; clientEmail: string; clientPhone?: string; serviceName?: string; staffName?: string; preferredDate?: string; preferredTime?: string; notes?: string; status: string; createdAt: string }

const statusLabel: Record<string, string> = { waiting: "En espera", notified: "Notificado", booked: "Con cita", cancelled: "Cancelado" };
const statusColor: Record<string, string> = { waiting: "bg-amber-100 text-amber-700", notified: "bg-blue-100 text-blue-700", booked: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-600" };

export default function WaitingListPage() {
  const { slug } = useParams() as { slug: string };
  const [items, setItems] = useState<WaitingItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/site/${slug}/waiting-list`);
    if (res.ok) { const d = await res.json(); setItems(d.items); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [slug]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/site/${slug}/waiting-list`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar de la lista?")) return;
    await fetch(`/api/site/${slug}/waiting-list`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    load();
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lista de espera</h1>
          <p className="text-sm text-gray-400 mt-0.5">{items.filter((i) => i.status === "waiting").length} en espera</p>
        </div>
      </div>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <div className="space-y-3">
          {items.length === 0 && <p className="text-sm text-gray-400">La lista de espera está vacía.</p>}
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[item.status]}`}>{statusLabel[item.status]}</span>
                  {item.serviceName && <span className="text-xs text-gray-500">{item.serviceName}</span>}
                  {item.staffName && <span className="text-xs text-gray-400">· {item.staffName}</span>}
                </div>
                <p className="font-medium text-gray-900">{item.clientName}</p>
                <p className="text-xs text-gray-500">{item.clientEmail}{item.clientPhone ? ` · ${item.clientPhone}` : ""}</p>
                {(item.preferredDate || item.preferredTime) && (
                  <p className="text-xs text-gray-400 mt-0.5">Preferencia: {item.preferredDate || ""} {item.preferredTime || ""}</p>
                )}
                {item.notes && <p className="text-xs text-gray-500 mt-1 italic">{item.notes}</p>}
                <p className="text-xs text-gray-400 mt-1">{new Date(item.createdAt).toLocaleDateString("es")}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0 flex-col items-end">
                {item.status === "waiting" && (
                  <>
                    <button onClick={() => updateStatus(item.id, "notified")} className="text-xs px-3 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 whitespace-nowrap">Notificar</button>
                    <button onClick={() => updateStatus(item.id, "booked")} className="text-xs px-3 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 whitespace-nowrap">Con cita</button>
                  </>
                )}
                <button onClick={() => handleDelete(item.id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
