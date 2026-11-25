import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiForbidden } from "@/lib/api-response";
import { SessionUser } from "@/types";

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!can(user, "read", "activity_log")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25")));
  const entity = searchParams.get("entity") || undefined;
  const action = searchParams.get("action") || undefined;
  const actorId = searchParams.get("actorId") || undefined;
  const q = searchParams.get("q") || undefined;

  const where: any = {};
  if (entity && entity !== "ALL") where.entity = entity;
  if (action && action !== "ALL") where.action = action;
  if (actorId) where.actorId = actorId;
  if (q && q.trim()) {
    const term = q.trim();
    where.OR = [
      { actorName: { contains: term, mode: "insensitive" } },
      { actorRole: { contains: term, mode: "insensitive" } },
      { entity: { contains: term, mode: "insensitive" } },
      { entityId: { contains: term, mode: "insensitive" } },
      { action: { contains: term, mode: "insensitive" } },
      { meta: { contains: term, mode: "insensitive" } },
    ];
  }

  const [total, logs, actionStats, totalAll] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.activityLog.groupBy({
      by: ["action"],
      _count: true,
    }),
    prisma.activityLog.count(),
  ]);

  const stats = actionStats.reduce((acc, curr) => {
    acc[curr.action] = curr._count;
    return acc;
  }, {} as Record<string, number>);

  return apiSuccess({
    logs,
    total,
    totalAll,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    stats,
  });
}
