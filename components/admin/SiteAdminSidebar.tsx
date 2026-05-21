"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DarkModeToggle } from "@/components/ui/DarkModeToggle";

export interface NavLink  { href: string; label: string; exact?: boolean; }
export interface NavSection { label: string; links: NavLink[]; }

interface Props {
  slug: string;
  siteName: string;
  siteLogoUrl?: string | null;
  sitePrimaryColor: string;
  navSections: NavSection[];
  isSuperAdmin: boolean;
  userName: string;
  signOutSlot: React.ReactNode;
}

export default function SiteAdminSidebar({
  slug, siteName, siteLogoUrl, sitePrimaryColor, navSections, isSuperAdmin, userName, signOutSlot,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    if (href === `/site/${slug}/admin`) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm flex items-center justify-center text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
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
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed md:relative inset-y-0 left-0 z-50",
          "w-60 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-700 flex flex-col",
          "transition-transform duration-200 ease-in-out",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        {/* Mobile close */}
        <button
          className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 z-10 text-xl leading-none"
          onClick={() => setOpen(false)}
        >×</button>

        {isSuperAdmin && (
          <div className="px-4 py-2 bg-blue-600 text-white text-xs flex items-center gap-2 flex-shrink-0">
            <span className="opacity-80">Super Admin</span>
            <Link href="/admin" className="ml-auto hover:underline font-medium">← Panel</Link>
          </div>
        )}

        {/* Site header */}
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 overflow-hidden"
            style={{ backgroundColor: sitePrimaryColor }}
          >
            {siteLogoUrl
              ? <img src={siteLogoUrl} alt="logo" className="w-9 h-9 object-cover" />
              : siteName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-slate-100 leading-tight truncate">{siteName}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Panel admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
          {navSections.map((section, si) => (
            <div key={si}>
              {section.label && (
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-500 px-2 mb-1">
                  {section.label}
                </p>
              )}
              <div className="space-y-0.5">
                {section.links.map((link) => {
                  const active = isActive(link.href, link.exact);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={[
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-slate-200",
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

          <div className="border-t border-gray-100 dark:border-slate-700 pt-3">
            <Link
              href={`/site/${slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              Ver sitio público ↗
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
          <p className="text-xs text-gray-400 dark:text-slate-500 mb-2 truncate">{userName}</p>
          <div className="flex items-center justify-between">
            {signOutSlot}
            <DarkModeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
