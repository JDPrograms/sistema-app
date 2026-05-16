"use client";

import { useState } from "react";
import Link from "next/link";

interface NavLink { href: string; label: string; }

interface Props {
  slug: string;
  siteName: string;
  siteLogoUrl?: string | null;
  sitePrimaryColor: string;
  navLinks: NavLink[];
  isSuperAdmin: boolean;
  userName: string;
  signOutSlot: React.ReactNode;
}

export default function SiteAdminSidebar({
  slug, siteName, siteLogoUrl, sitePrimaryColor, navLinks, isSuperAdmin, userName, signOutSlot,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white border border-gray-200 rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50"
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
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:relative inset-y-0 left-0 z-50",
          "w-60 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Mobile close button */}
        <button
          className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 z-10 text-xl leading-none"
          onClick={() => setOpen(false)}
        >
          ×
        </button>

        {isSuperAdmin && (
          <div className="px-4 py-2 bg-blue-600 text-white text-xs flex items-center gap-2 flex-shrink-0">
            <span className="opacity-80">Super Admin</span>
            <Link href="/admin" className="ml-auto hover:underline font-medium" onClick={() => setOpen(false)}>
              ← Panel
            </Link>
          </div>
        )}

        <div className="p-5 border-b border-gray-100 flex-shrink-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3"
            style={{ backgroundColor: sitePrimaryColor }}
          >
            {siteLogoUrl
              ? <img src={siteLogoUrl} alt="logo" className="w-10 h-10 rounded-xl object-cover" />
              : siteName[0]}
          </div>
          <p className="font-bold text-sm text-gray-900 leading-tight">{siteName}</p>
          <p className="text-xs text-gray-400">Panel admin</p>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50 font-medium transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2">
            <Link
              href={`/site/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-50 transition-colors"
            >
              Ver sitio publico ↗
            </Link>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-400 mb-2 truncate">{userName}</p>
          {signOutSlot}
        </div>
      </aside>
    </>
  );
}
