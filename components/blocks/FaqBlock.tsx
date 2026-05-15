"use client";
import { useState } from "react";

interface FaqItem { q: string; a: string; }
interface FaqConfig { title?: string; items: FaqItem[]; }

export default function FaqBlock({ config, primaryColor }: { config: FaqConfig; primaryColor: string }) {
  const [open, setOpen] = useState<number | null>(null);
  if (!config.items?.length) return null;
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        {config.title && (
          <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">{config.title}</h2>
        )}
        <div className="space-y-3">
          {config.items.map((item, i) => (
            <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
              <button className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="font-semibold text-gray-900 text-sm pr-4">{item.q}</span>
                <span className="text-xl flex-shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? "rotate(45deg)" : "none", color: primaryColor }}>+</span>
              </button>
              {open === i && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
