interface TeamMember { name: string; role: string; bio?: string; photo?: string; }
interface TeamConfig { title?: string; members: TeamMember[]; }

export default function TeamBlock({ config, primaryColor }: { config: TeamConfig; primaryColor: string }) {
  if (!config.members?.length) return null;
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-6">
        {config.title && <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">{config.title}</h2>}
        <div className={`grid gap-6 ${config.members.length <= 2 ? "grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
          {config.members.map((m, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 text-center">
              {m.photo ? (
                <img src={m.photo} alt={m.name} className="w-full h-48 object-cover" />
              ) : (
                <div className="w-full h-48 flex items-center justify-center text-5xl font-bold text-white"
                  style={{ backgroundColor: primaryColor }}>
                  {m.name[0]?.toUpperCase()}
                </div>
              )}
              <div className="p-5">
                <p className="font-bold text-gray-900 text-lg">{m.name}</p>
                <p className="text-sm font-medium mt-0.5" style={{ color: primaryColor }}>{m.role}</p>
                {m.bio && <p className="text-sm text-gray-500 mt-2">{m.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
