"use client";

import { useState } from "react";
import Link from "next/link";

interface Props {
  userName: string;
  signOutSlot: React.ReactNode;
}

export default function SuperAdminSidebar({ userName, signOutSlot }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-white hover:bg-slate-800"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect y="2" width="18" height="2" rx="1" />
          <rect y="8" width="18" height="2" rx="1" />
          <rect y="14" width="18" height="2" rx="1" />
        </svg>
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:relative inset-y-0 left-0 z-50",
          "w-64 flex-shrink-0 bg-slate-900 text-white flex flex-col",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg border border-slate-600 text-slate-400 hover:bg-slate-800 z-10 text-xl leading-none"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        <div className="p-6 border-b border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center font-bold text-lg flex-shrink-0">
              S
            </div>
            <div>
              <p className="font-bold text-sm">Sistema de Sistemas</p>
              <p className="text-xs text-slate-400">Super Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <Link href="/admin" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            Dashboard
          </Link>
          <Link href="/admin/sites" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            Sitios web
          </Link>
          <Link href="/admin/sites/new" onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
            + Crear sitio
          </Link>
          <div className="pt-2 border-t border-slate-700 mt-2">
            <Link href="/admin/ai" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium text-purple-300">
              Inteligencia Artificial
            </Link>
            <Link href="/admin/admins" onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium text-amber-300">
              Superadministradores
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-400 mb-3">{userName}</p>
          {signOutSlot}
        </div>
      </aside>
    </>
  );
}
