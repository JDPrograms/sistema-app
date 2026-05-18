interface DaySchedule { day: string; open: string; close: string; closed?: boolean; }
interface ScheduleConfig { title?: string; items: DaySchedule[]; note?: string; }

export default function ScheduleBlock({ config, primaryColor }: { config: ScheduleConfig; primaryColor: string }) {
  if (!config.items?.length) return null;
  return (
    <section className="py-16" style={{ backgroundColor: `${primaryColor}06` }}>
      <div className="max-w-lg mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-8 text-gray-900">{config.title}</h2>}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {config.items.map((item, i) => (
            <div key={i} className={`flex items-center justify-between px-6 py-3.5 ${i < config.items.length - 1 ? "border-b border-gray-50" : ""}`}>
              <span className="font-medium text-gray-700 w-28">{item.day}</span>
              {item.closed ? (
                <span className="text-sm text-gray-400 italic">Cerrado</span>
              ) : (
                <span className="text-sm font-semibold" style={{ color: primaryColor }}>
                  {item.open} – {item.close}
                </span>
              )}
            </div>
          ))}
        </div>
        {config.note && (
          <p className="text-center text-sm text-gray-500 mt-4">{config.note}</p>
        )}
      </div>
    </section>
  );
}
