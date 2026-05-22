"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface Props { currentLocale: string }

export default function LanguageSwitcher({ currentLocale }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function setLocale(locale: string) {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-1 border border-white/20 rounded-lg overflow-hidden">
      {(["es", "en"] as const).map((loc) => (
        <button
          key={loc}
          onClick={() => setLocale(loc)}
          disabled={pending}
          className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
            currentLocale === loc
              ? "bg-white/20 text-white"
              : "text-slate-400 hover:text-white hover:bg-white/10"
          }`}>
          {loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
