"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CancelAppointmentButton({
  appointmentId,
  slug,
}: {
  appointmentId: string;
  slug: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function handleCancel() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setLoading(true);
    await fetch(`/api/site/${slug}/appointments/${appointmentId}/cancel`, { method: "POST" });
    setLoading(false);
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-gray-500">¿Confirmar?</span>
        <button onClick={handleCancel} disabled={loading}
          className="text-xs text-red-600 font-medium hover:underline disabled:opacity-50">
          {loading ? "..." : "Sí"}
        </button>
        <button onClick={() => setConfirmed(false)} className="text-xs text-gray-400 hover:underline">
          No
        </button>
      </div>
    );
  }

  return (
    <button onClick={handleCancel}
      className="text-xs text-red-500 hover:text-red-700 hover:underline transition-colors">
      Cancelar
    </button>
  );
}
