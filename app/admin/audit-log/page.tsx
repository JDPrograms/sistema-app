"use client";
import { useState, useEffect } from "react";

interface AuditLog { id: string; action: string; actorName?: string; actorEmail?: string; entityType?: string; entityId?: string; details?: string; ip?: string; createdAt: string }

export default function SuperAuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  async function load(p: number) {
    setLoading(true);
    const res = await fetch(`/api/admin/audit-log?page=${p}&limit=${limit}`);
    if (res.ok) { const d = await res.json(); setLogs(d.logs); setTotal(d.total); }
    setLoading(false);
  }

  useEffect(() => { load(page); }, [page]);

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Registro de actividad global</h1>

      {loading ? <p className="text-sm text-gray-400">Cargando...</p> : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Acción</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Entidad</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {logs.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay registros</td></tr>}
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-3">
                      <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">{log.action}</code>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-900">{log.actorName || "—"}</p>
                      {log.actorEmail && <p className="text-xs text-gray-400">{log.actorEmail}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {log.entityType && <span>{log.entityType}</span>}
                      {log.entityId && <span className="text-gray-400 ml-1">#{log.entityId.slice(-6)}</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(log.createdAt).toLocaleString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-50">← Anterior</button>
            <span className="text-gray-500">Pág. {page} · {total} registros</span>
            <button disabled={page * limit >= total} onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40 hover:bg-gray-50">Siguiente →</button>
          </div>
        </>
      )}
    </div>
  );
}
