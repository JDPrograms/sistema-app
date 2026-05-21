import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if ((session?.user as any)?.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [totalSites, activeSites, totalUsers, totalAdmins, totalInvoices, revenue, recentSites] = await prisma.$transaction([
    prisma.site.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.siteUser.count(),
    prisma.siteAdmin.count(),
    prisma.siteInvoice.count({ where: { status: "paid" } }),
    prisma.siteInvoice.aggregate({ where: { status: "paid" }, _sum: { total: true } }),
    prisma.site.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, name: true, slug: true, isActive: true, planType: true, createdAt: true,
        _count: { select: { users: true, appointments: true, invoices: true } },
      },
    }),
  ]);

  // Sites per month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sitesGrowth = await prisma.site.groupBy({
    by: ["createdAt"],
    where: { createdAt: { gte: sixMonthsAgo } },
    _count: { id: true },
  });

  return NextResponse.json({
    summary: {
      totalSites,
      activeSites,
      inactiveSites: totalSites - activeSites,
      totalUsers,
      totalAdmins,
      totalPaidInvoices: totalInvoices,
      totalRevenue: revenue._sum.total ?? 0,
    },
    recentSites,
    sitesGrowth,
  });
}
