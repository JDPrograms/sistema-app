import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chat } from "@/lib/ai";

const METRICS_AI_SYSTEM = `Eres un analista de datos de soporte al cliente experto.
Recibirás métricas de soporte y responderás preguntas sobre ellas en español, con análisis precisos y recomendaciones accionables.

FORMATO DE RESPUESTA:
- Texto claro en español, sin markdown excesivo.
- Usa números concretos de las métricas proporcionadas.
- Sé directo y profesional.

GENERAR REPORTE PDF:
Cuando el usuario pida generar un reporte, informe, documento o PDF, incluye al FINAL de tu respuesta un bloque especial:
@@REPORTE@@
{
  "titulo": "título del reporte",
  "subtitulo": "periodo o descripción",
  "fecha": "fecha de generación",
  "secciones": [
    {
      "titulo": "Nombre de sección",
      "texto": "Párrafo de análisis para esta sección...",
      "tabla": {
        "columnas": ["Col1", "Col2"],
        "filas": [["val1", "val2"]]
      }
    }
  ]
}
@@FINREPORTE@@

REGLAS PARA EL REPORTE:
- Incluye solo las secciones relevantes para lo que el cliente pidió específicamente.
- La tabla es opcional por sección; solo incluye si hay datos tabulares relevantes.
- Los valores de las filas deben ser strings.
- Máximo 6 secciones por reporte.
- Si el cliente pide métricas específicas (solo agentes, solo colas, solo tendencias), limita el reporte a eso.`;

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true, name: true, adminAgentId: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { messages, metrics } = body as {
    messages: { role: "user" | "assistant"; content: string }[];
    metrics: Record<string, unknown>;
  };

  if (!messages?.length) return NextResponse.json({ error: "Faltan mensajes" }, { status: 400 });

  const metricsContext = `
=== MÉTRICAS DE SOPORTE: ${site.name} ===
Período analizado: últimos ${(metrics?.summary as any)?.rangeDays ?? 30} días

RESUMEN GENERAL:
- Total de conversaciones (período): ${(metrics?.summary as any)?.total}
- Hoy: ${(metrics?.summary as any)?.today} | Esta semana: ${(metrics?.summary as any)?.thisWeek} | Este mes: ${(metrics?.summary as any)?.thisMonth}
- Historial total (siempre): ${(metrics?.summary as any)?.allTime}

DISTRIBUCIÓN POR ESTADO:
- Bot (sin escalar): ${(metrics?.summary as any)?.byStatus?.bot}
- Esperando agente: ${(metrics?.summary as any)?.byStatus?.waiting}
- En atención humana: ${(metrics?.summary as any)?.byStatus?.human}
- Resueltos: ${(metrics?.summary as any)?.byStatus?.resolved}

TASAS:
- Tasa de escalación (cliente solicitó humano): ${(metrics?.summary as any)?.escalationRate}%
- Tasa de resolución (de los escalados): ${(metrics?.summary as any)?.resolutionRate}%
- Tasa de autoservicio (bot resolvió sin humano): ${(metrics?.summary as any)?.botResolutionRate}%

TIEMPOS:
- Tiempo promedio de espera (solicitud → agente asignado): ${(metrics?.summary as any)?.avgWaitMinutes != null ? `${(metrics?.summary as any)?.avgWaitMinutes} min` : "Sin datos suficientes"}
- Tiempo promedio de resolución: ${(metrics?.summary as any)?.avgResMinutes != null ? `${(metrics?.summary as any)?.avgResMinutes} min` : "Sin datos suficientes"}

COLAS:
${((metrics?.queues as any[]) ?? []).map((q: any) => `- ${q.name}: ${q.count} conversaciones (${q.waiting} esperando, ${q.resolved} resueltas)`).join("\n") || "Sin colas configuradas"}

AGENTES:
${((metrics?.agents as any[]) ?? []).map((a: any) => `- ${a.name}: ${a.handled} atendidas, ${a.resolved} resueltas, ${a.isAvailable ? "disponible" : "no disponible"}${a.isAlwaysOn ? ", siempre activo" : ""}`).join("\n") || "Sin agentes configurados"}

TENDENCIA (últimos días):
${((metrics?.trend as any[]) ?? []).slice(-7).map((t: any) => `- ${t.date}: ${t.total} chats (${t.escalated} escalados, ${t.resolved} resueltos)`).join("\n")}

HORAS PICO:
${((metrics?.peakHours as any[]) ?? []).filter((h: any) => h.count > 0).sort((a: any, b: any) => b.count - a.count).slice(0, 5).map((h: any) => `- ${h.hour}:00h: ${h.count} conversaciones`).join("\n") || "Sin datos"}
=== FIN DE MÉTRICAS ===`;

  const systemPrompt = METRICS_AI_SYSTEM + "\n\n" + metricsContext;

  try {
    const result = await chat(messages, systemPrompt);
    return NextResponse.json({ text: result.text, provider: result.provider });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Error de IA" }, { status: 500 });
  }
}
