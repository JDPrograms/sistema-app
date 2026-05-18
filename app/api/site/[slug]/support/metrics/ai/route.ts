import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

const METRICS_AI_SYSTEM = `Eres un analista de datos de soporte al cliente.
Recibirás métricas de soporte y responderás preguntas sobre ellas en español.
Respuestas cortas y directas usando los números concretos de las métricas.
Sin markdown, sin listas innecesarias. Máximo 4 oraciones salvo que el usuario pida más detalle.`;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { messages, metrics } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    metrics: Record<string, unknown>;
  };
  if (!messages?.length) return NextResponse.json({ error: "Faltan mensajes" }, { status: 400 });

  const s = (metrics?.summary as any) ?? {};
  const metricsContext = `
=== MÉTRICAS DE SOPORTE: ${site.name} (últimos ${s.rangeDays ?? 30} días) ===
Conversaciones período: ${s.total} | Hoy: ${s.today} | Semana: ${s.thisWeek} | Mes: ${s.thisMonth} | Histórico total: ${s.allTime}
Por estado — Bot: ${s.byStatus?.bot} | Esperando: ${s.byStatus?.waiting} | En vivo: ${s.byStatus?.human} | Resueltos: ${s.byStatus?.resolved}
Tasa escalación: ${s.escalationRate}% | Tasa resolución: ${s.resolutionRate}% | Autoservicio bot: ${s.botResolutionRate}%
Espera promedio: ${s.avgWaitMinutes != null ? s.avgWaitMinutes + " min" : "sin datos"} | Resolución promedio: ${s.avgResMinutes != null ? s.avgResMinutes + " min" : "sin datos"}
Colas: ${((metrics?.queues as any[]) ?? []).map((q: any) => `${q.name}(${q.count} chats, ${q.resolved} resueltos)`).join(", ") || "ninguna"}
Agentes: ${((metrics?.agents as any[]) ?? []).map((a: any) => `${a.name}(${a.handled} atendidas, ${a.resolved} resueltas)`).join(", ") || "ninguno"}
Tendencia reciente: ${((metrics?.trend as any[]) ?? []).slice(-7).map((t: any) => `${t.date.slice(5)}:${t.total}`).join(", ")}
Horas pico: ${((metrics?.peakHours as any[]) ?? []).filter((h: any) => h.count > 0).sort((a: any, b: any) => b.count - a.count).slice(0, 3).map((h: any) => `${h.hour}h(${h.count})`).join(", ") || "sin datos"}
=== FIN ===`;

  try {
    const result = await chat(messages, METRICS_AI_SYSTEM + "\n\n" + metricsContext);
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error de IA" }, { status: 500 });
  }
}
