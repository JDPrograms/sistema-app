import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";
import { runPlatformMonitor } from "@/lib/monitor";
import { sendEmail } from "@/lib/email";
import type { Message } from "@/lib/ai";

const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL || "jedimanbl@gmail.com";

async function buildPlatformContext(): Promise<string> {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const thirtyDaysAgoStr = new Date(now.getTime() - 30 * 86400000).toISOString().split("T")[0];
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalSites, activeSites,
    totalUsers, totalAdmins,
    totalAppts, todayAppts, pendingAppts,
    apptThisMonth, cancelledThisMonth,
    newSites7d, newUsers7d,
    recentSites,
    aiProviders,
    byTemplate,
  ] = await Promise.all([
    prisma.site.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.siteUser.count(),
    prisma.siteAdmin.count(),
    prisma.siteAppointment.count(),
    prisma.siteAppointment.count({ where: { date: today } }),
    prisma.siteAppointment.count({ where: { status: "pending" } }),
    prisma.siteAppointment.count({ where: { date: { gte: today.slice(0, 7) + "-01" } } }),
    prisma.siteAppointment.count({ where: { status: "cancelled", date: { gte: thirtyDaysAgoStr } } }),
    prisma.site.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.siteUser.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.site.findMany({
      orderBy: { createdAt: "desc" }, take: 5,
      select: { name: true, slug: true, template: true, isActive: true, planType: true, expiresAt: true, createdAt: true },
    }),
    prisma.aiProvider.findMany({ where: { isActive: true }, select: { label: true, name: true } }),
    prisma.site.groupBy({ by: ["template"], _count: true }),
  ]);

  // Sites about to expire
  const timedSites = await prisma.site.findMany({
    where: { planType: "timed", isActive: true, expiresAt: { not: null } },
    select: { name: true, slug: true, expiresAt: true },
    orderBy: { expiresAt: "asc" }, take: 10,
  });

  const expiryWarnings = timedSites.filter(s => {
    if (!s.expiresAt) return false;
    const days = Math.ceil((s.expiresAt.getTime() - now.getTime()) / 86400000);
    return days <= 10;
  }).map(s => {
    const days = Math.ceil((s.expiresAt!.getTime() - now.getTime()) / 86400000);
    return `  - ${s.name} (/${s.slug}): ${days <= 0 ? "VENCIDO" : `vence en ${days}d`}`;
  });

  const templateMap: Record<string, string> = {
    barbershop: "Peluquería", salon: "Salón", restaurant: "Restaurante", gym: "Gimnasio",
    clinic: "Clínica", school: "Academia", veterinary: "Veterinaria", lawyer: "Estudio Jurídico",
    realestate: "Inmobiliaria", hotel: "Hotel", hardware: "Ferretería", generic: "Genérico",
    photographer: "Fotógrafo", tutor: "Tutor", pharmacy: "Farmacia", store: "Tienda",
  };

  return `
ESTADO DE LA PLATAFORMA — ${now.toLocaleString("es", { timeZone: "America/Santo_Domingo" })}

MÉTRICAS GENERALES:
- Sitios totales: ${totalSites} (${activeSites} activos, ${totalSites - activeSites} inactivos)
- Usuarios registrados: ${totalUsers} (${totalAdmins} administradores de sitio)
- Citas totales: ${totalAppts} | Hoy: ${todayAppts} | Pendientes: ${pendingAppts} | Este mes: ${apptThisMonth}
- Cancelaciones (30d): ${cancelledThisMonth}
- Nuevos esta semana: ${newSites7d} sitios, ${newUsers7d} usuarios
- Proveedores IA activos: ${aiProviders.map(p => p.label).join(", ") || "Ninguno"}

DISTRIBUCIÓN POR TIPO:
${byTemplate.map(t => `  - ${templateMap[t.template] ?? t.template}: ${t._count}`).join("\n")}

SITIOS RECIENTES:
${recentSites.map(s => `  - ${s.name} (/${s.slug}) | ${templateMap[s.template] ?? s.template} | ${s.isActive ? "Activo" : "Inactivo"} | Plan: ${s.planType}`).join("\n")}

${expiryWarnings.length > 0 ? `SITIOS POR VENCER O VENCIDOS:\n${expiryWarnings.join("\n")}` : "VENCIMIENTOS: Ningún sitio crítico"}
`.trim();
}

export async function POST(req: Request) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (role !== "superadmin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { messages, action } = await req.json() as { messages: Message[]; action?: string };

  // Special actions
  if (action === "monitor") {
    const report = await runPlatformMonitor();
    return NextResponse.json({ report });
  }

  if (action === "send_report") {
    const report = await runPlatformMonitor();
    const { buildMonitorEmailHtml } = await import("@/lib/monitor");
    try {
      await sendEmail({
        to: DIRECTOR_EMAIL,
        subject: `📊 [Sistema de Sistemas] Reporte bajo demanda — ${report.alerts.length} alerta${report.alerts.length !== 1 ? "s" : ""}`,
        html: buildMonitorEmailHtml(report),
      });
      return NextResponse.json({ ok: true, alertCount: report.alerts.length });
    } catch (e) {
      return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
    }
  }

  // Build real-time platform context
  const platformContext = await buildPlatformContext();

  const systemPrompt = `Eres el Director de Operaciones de "Sistema de Sistemas", una plataforma SaaS multi-tenant para negocios PYME en LATAM.

Tu rol: eres un agente autónomo inteligente con acceso completo al estado de la plataforma. Responde en español de forma clara y directa. Puedes dar recomendaciones, analizar datos, detectar problemas, sugerir acciones y responder preguntas sobre cualquier aspecto del sistema.

Capacidades que tienes:
- Analizar métricas y tendencias de la plataforma
- Identificar sitios con problemas (vencimientos, inactividad, etc.)
- Dar recomendaciones de negocio y operativas
- Redactar emails o mensajes para clientes
- Sugerir qué acciones tomar ante cada situación
- Responder sobre cualquier dato del sistema

Formato: responde en texto plano natural. Puedes usar listas cuando ayude. Sé conciso pero completo. Si detectas algo urgente, dilo claramente.

ESTADO ACTUAL DE LA PLATAFORMA:
${platformContext}`;

  try {
    const result = await chat(messages, systemPrompt, null, "superadmin");
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Error de IA" }, { status: 500 });
  }
}
