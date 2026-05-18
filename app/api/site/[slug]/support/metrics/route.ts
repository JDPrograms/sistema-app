import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function startOf(unit: "day" | "week" | "month"): Date {
  const d = new Date();
  if (unit === "day") { d.setHours(0, 0, 0, 0); return d; }
  if (unit === "week") { const day = d.getDay(); d.setDate(d.getDate() - day); d.setHours(0, 0, 0, 0); return d; }
  d.setDate(1); d.setHours(0, 0, 0, 0); return d;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const role = (session?.user as any)?.role;
  const { slug } = await params;
  if (!session || (role !== "superadmin" && role !== "siteadmin")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const site = await prisma.site.findUnique({ where: { slug }, select: { id: true } });
  if (!site) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const siteId = site.id;

  const url = new URL(req.url);
  const rangeDays = parseInt(url.searchParams.get("days") || "30");
  const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);

  // ── Parallel queries ────────────────────────────────────────────
  const [allSessions, rangedSessions, agents, queues, recentMessages] = await Promise.all([
    prisma.siteChatSession.count({ where: { siteId } }),
    prisma.siteChatSession.findMany({
      where: { siteId, createdAt: { gte: since } },
      select: {
        id: true, status: true, queueId: true, queueName: true,
        assignedAdminId: true, assignedAdminName: true,
        createdAt: true, updatedAt: true,
      },
    }),
    prisma.siteChatAgent.findMany({
      where: { siteId },
      select: { adminId: true, adminName: true, adminEmail: true, isAvailable: true, isAlwaysOn: true },
    }),
    prisma.supportQueue.findMany({
      where: { siteId },
      select: { id: true, name: true },
    }),
    // System messages to compute wait times
    prisma.siteChatMessage.findMany({
      where: {
        session: { siteId },
        role: "system",
        createdAt: { gte: since },
        OR: [
          { content: { contains: "Solicitud" } },
          { content: { contains: "se unio" } },
          { content: { contains: "finalizada" } },
        ],
      },
      select: { sessionId: true, content: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // ── By status ────────────────────────────────────────────────────
  const byStatus = { bot: 0, waiting: 0, human: 0, resolved: 0 };
  let escalated = 0;
  rangedSessions.forEach((s) => {
    byStatus[s.status as keyof typeof byStatus] = (byStatus[s.status as keyof typeof byStatus] || 0) + 1;
    if (s.status === "human" || s.status === "resolved") escalated++;
  });
  const total = rangedSessions.length;
  const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;
  const resolutionRate = escalated > 0 ? Math.round((byStatus.resolved / escalated) * 100) : 0;
  const botResolutionRate = total > 0 ? Math.round(((total - escalated) / total) * 100) : 0;

  // ── Period counts ───────────────────────────────────────────────
  const todayStart = startOf("day");
  const weekStart = startOf("week");
  const monthStart = startOf("month");
  const todayCount = rangedSessions.filter((s) => s.createdAt >= todayStart).length;
  const weekCount = rangedSessions.filter((s) => s.createdAt >= weekStart).length;
  const monthCount = rangedSessions.filter((s) => s.createdAt >= monthStart).length;

  // ── Wait time (Solicitud → se unio) ─────────────────────────────
  const waitMap: Record<string, Date> = {};
  const waitTimes: number[] = [];
  recentMessages.forEach((m) => {
    if (m.content.includes("Solicitud")) {
      waitMap[m.sessionId] = m.createdAt;
    } else if (m.content.includes("se unio") && waitMap[m.sessionId]) {
      const diff = (m.createdAt.getTime() - waitMap[m.sessionId].getTime()) / 60000;
      if (diff >= 0 && diff < 600) waitTimes.push(diff);
      delete waitMap[m.sessionId];
    }
  });
  const avgWaitMinutes = waitTimes.length > 0
    ? Math.round((waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) * 10) / 10
    : null;

  // ── Resolution time ─────────────────────────────────────────────
  const resolvedSessions = rangedSessions.filter((s) => s.status === "resolved");
  const resTimes = resolvedSessions.map((s) => (s.updatedAt.getTime() - s.createdAt.getTime()) / 60000);
  const avgResMinutes = resTimes.length > 0
    ? Math.round((resTimes.reduce((a, b) => a + b, 0) / resTimes.length))
    : null;

  // ── Per-agent stats ─────────────────────────────────────────────
  const agentStats: Record<string, { name: string; email: string; handled: number; resolved: number; isAvailable: boolean; isAlwaysOn: boolean }> = {};
  agents.forEach((a) => {
    agentStats[a.adminId] = { name: a.adminName, email: a.adminEmail, handled: 0, resolved: 0, isAvailable: a.isAvailable, isAlwaysOn: a.isAlwaysOn };
  });
  rangedSessions.forEach((s) => {
    if (s.assignedAdminId && agentStats[s.assignedAdminId]) {
      agentStats[s.assignedAdminId].handled++;
      if (s.status === "resolved") agentStats[s.assignedAdminId].resolved++;
    }
  });

  // ── Per-queue stats ─────────────────────────────────────────────
  const queueStats: Record<string, { name: string; count: number; waiting: number; resolved: number }> = {};
  queues.forEach((q) => { queueStats[q.id] = { name: q.name, count: 0, waiting: 0, resolved: 0 }; });
  queueStats["__none"] = { name: "Sin cola", count: 0, waiting: 0, resolved: 0 };
  rangedSessions.forEach((s) => {
    const key = s.queueId || "__none";
    if (!queueStats[key]) queueStats[key] = { name: s.queueName || "Sin cola", count: 0, waiting: 0, resolved: 0 };
    queueStats[key].count++;
    if (s.status === "waiting") queueStats[key].waiting++;
    if (s.status === "resolved") queueStats[key].resolved++;
  });

  // ── Daily trend (last rangeDays) ───────────────────────────────
  const trendMap: Record<string, { total: number; escalated: number; resolved: number }> = {};
  for (let i = Math.min(rangeDays, 30) - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().split("T")[0];
    trendMap[key] = { total: 0, escalated: 0, resolved: 0 };
  }
  rangedSessions.forEach((s) => {
    const key = s.createdAt.toISOString().split("T")[0];
    if (trendMap[key]) {
      trendMap[key].total++;
      if (s.status === "human" || s.status === "resolved") trendMap[key].escalated++;
      if (s.status === "resolved") trendMap[key].resolved++;
    }
  });
  const trend = Object.entries(trendMap).map(([date, v]) => ({ date, ...v }));

  // ── Peak hours ─────────────────────────────────────────────────
  const hourMap: Record<number, number> = {};
  for (let h = 0; h < 24; h++) hourMap[h] = 0;
  rangedSessions.forEach((s) => { hourMap[s.createdAt.getHours()]++; });
  const peakHours = Object.entries(hourMap).map(([hour, count]) => ({ hour: Number(hour), count }));

  return NextResponse.json({
    summary: {
      allTime: allSessions,
      total,
      today: todayCount,
      thisWeek: weekCount,
      thisMonth: monthCount,
      byStatus,
      escalationRate,
      resolutionRate,
      botResolutionRate,
      avgWaitMinutes,
      avgResMinutes,
      rangeDays,
    },
    agents: Object.values(agentStats),
    queues: Object.values(queueStats).filter((q) => q.count > 0 || q.name !== "Sin cola"),
    trend,
    peakHours,
  });
}
