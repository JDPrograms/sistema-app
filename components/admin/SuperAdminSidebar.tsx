"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  userName: string;
  signOutSlot: React.ReactNode;
}

const NAV_SECTIONS = [
  {
    label: "Principal",
    links: [
      { href: "/admin", label: "📊 Dashboard", exact: true },
      { href: "/admin/sites", label: "🌐 Sitios web" },
      { href: "/admin/sites/new", label: "+ Crear sitio", color: "text-green-400" },
    ],
  },
  {
    label: "Gestión",
    links: [
      { href: "/admin/reports", label: "📈 Reportes", color: "text-cyan-300" },
      { href: "/admin/announcements", label: "📢 Anuncios", color: "text-blue-300" },
      { href: "/admin/audit-log", label: "📋 Actividad", color: "text-slate-300" },
    ],
  },
  {
    label: "Sistema",
    links: [
      { href: "/admin/ai", label: "🤖 IA global", color: "text-purple-300" },
      { href: "/admin/system-config", label: "⚙️ Configuración", color: "text-amber-300" },
      { href: "/admin/admins", label: "👑 Superadmins", color: "text-amber-300" },
      { href: "/admin/security", label: "🔐 Seguridad", color: "text-slate-300" },
    ],
  },
];

export default function SuperAdminSidebar({ userName, signOutSlot }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href) && href !== "/admin";

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-slate-900 border border-slate-700 rounded-lg shadow-sm flex items-center justify-center text-white hover:bg-slate-800 transition-colors"
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

        <nav className="flex-1 p-4 overflow-y-auto space-y-4">
          {NAV_SECTIONS.map((section, si) => (
            <div key={section.label}>
              <p className={`text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2 px-1 ${si > 0 ? "border-t border-slate-700 pt-3" : ""}`}>
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const active = isActive(link.href, link.exact);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={[
                        "flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium",
                        active
                          ? "bg-slate-700 text-white"
                          : `hover:bg-slate-800 ${link.color ?? "text-slate-200"}`,
                      ].join(" ")}
                      aria-current={active ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-400 mb-3 truncate">{userName}</p>
          {signOutSlot}
        </div>
      </aside>
    </>
  );
}
