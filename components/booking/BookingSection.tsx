import BookingForm from "./BookingForm";

interface Service { id: string; name: string; price?: number | null; duration?: number | null }

interface Props {
  slug: string;
  siteName: string;
  primaryColor: string;
  secondaryColor: string;
  services: Service[];
}

export default function BookingSection({ slug, siteName, primaryColor, secondaryColor, services }: Props) {
  return (
    <section id="citas" className="py-16">
      <div className="max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <span className="inline-block px-4 py-1 rounded-full text-sm font-semibold mb-3"
            style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}>
            Reservas en linea
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">Agenda tu cita</h2>
          <p className="text-gray-500 mt-2">Completa el formulario y te confirmaremos a la brevedad</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <BookingForm
            slug={slug}
            siteName={siteName}
            primaryColor={primaryColor}
            services={services}
          />
        </div>
      </div>
    </section>
  );
}
