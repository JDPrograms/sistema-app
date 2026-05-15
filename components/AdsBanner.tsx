"use client";
import { useState, useEffect } from "react";

interface Ad {
  id: string; title: string; description?: string;
  imageUrl?: string; linkUrl?: string; buttonText?: string;
}

export default function AdsBanner({ ads, primaryColor }: { ads: Ad[]; primaryColor: string }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (ads.length <= 1) return;
    const t = setInterval(() => setCurrent((c) => (c + 1) % ads.length), 5000);
    return () => clearInterval(t);
  }, [ads.length]);

  if (!ads.length) return null;
  const ad = ads[current];

  return (
    <div className="w-full relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-6">
        {ad.imageUrl && (
          <img src={ad.imageUrl} alt={ad.title}
            className="h-16 w-16 rounded-xl object-cover flex-shrink-0 border-2 border-white/30"
            onError={(e) => (e.currentTarget.style.display = "none")} />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-lg leading-tight truncate">{ad.title}</p>
          {ad.description && (
            <p className="text-white/80 text-sm mt-0.5 line-clamp-1">{ad.description}</p>
          )}
        </div>
        {ad.linkUrl && (
          <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white font-semibold px-5 py-2 rounded-full text-sm transition-colors backdrop-blur-sm whitespace-nowrap">
            {ad.buttonText || "Ver mas"}
          </a>
        )}
        {!ad.linkUrl && ad.buttonText && (
          <span className="flex-shrink-0 bg-white/20 text-white font-semibold px-5 py-2 rounded-full text-sm whitespace-nowrap">
            {ad.buttonText}
          </span>
        )}
        {ads.length > 1 && (
          <div className="flex gap-1.5 flex-shrink-0">
            {ads.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-white scale-125" : "bg-white/40 hover:bg-white/60"}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
