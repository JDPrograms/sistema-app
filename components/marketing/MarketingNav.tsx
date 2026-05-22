"use client";
import { useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "./LanguageSwitcher";

interface Props { locale: string; t: { features: string; templates: string; pricing: string; login: string; start: string; directory?: string } }

export default function MarketingNav({ locale, t }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="font-bold text-white hidden sm:block">Sistema de Sistemas</span>
        </Link>

        <div className="hidden md:flex items-center gap-7 text-sm text-slate-300">
          <a href="#caracteristicas" className="hover:text-white transition-colors">{t.features}</a>
          <a href="#plantillas" className="hover:text-white transition-colors">{t.templates}</a>
          <a href="#precios" className="hover:text-white transition-colors">{t.pricing}</a>
          {t.directory && (
            <Link href="/directorio" className="hover:text-white transition-colors">{t.directory}</Link>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher currentLocale={locale} />
          <Link href="/login" className="text-slate-300 hover:text-white text-sm px-3 py-2 transition-colors">
            {t.login}
          </Link>
          <Link href="/login"
            className="bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-all hover:scale-105">
            {t.start}
          </Link>
        </div>

        <button onClick={() => setOpen(!open)}
          className="md:hidden text-white w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors">
          {open ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-slate-900 border-t border-white/10 px-4 py-4 space-y-1">
          {[
            [t.features, "#caracteristicas"],
            [t.templates, "#plantillas"],
            [t.pricing, "#precios"],
            ...(t.directory ? [[t.directory, "/directorio"]] : []),
          ].map(([label, href]) => (
            href.startsWith("/") ? (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm transition-colors">
                {label}
              </Link>
            ) : (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="block text-slate-300 hover:text-white hover:bg-white/5 px-3 py-2.5 rounded-lg text-sm transition-colors">
                {label}
              </a>
            )
          ))}
          <div className="pt-3 mt-3 border-t border-white/10 flex flex-col gap-2">
            <div className="flex justify-center"><LanguageSwitcher currentLocale={locale} /></div>
            <Link href="/login" className="block text-center border border-white/20 text-white py-2.5 rounded-xl text-sm hover:bg-white/5 transition-colors">
              {t.login}
            </Link>
            <Link href="/login" className="block text-center bg-blue-500 hover:bg-blue-400 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors">
              {t.start}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
