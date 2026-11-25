import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const contractorCreateSchema = z.object({
  name: z.string().min(2),
  company: z.string().min(2),
  contact: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  specialty: z.string().min(2),
  status: z.enum(["ACTIVE", "SUSPENDED", "INACTIVE"]).optional().default("ACTIVE"),
  rating: z.number().min(1).max(5).default(5.0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "read", "contractor")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const specialty = searchParams.get("specialty") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "rating";
  const desc = searchParams.get("desc") !== "false";

  const where: any = {};
  if (q.trim()) {
    const term = q.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { company: { contains: term, mode: "insensitive" } },
      { specialty: { contains: term, mode: "insensitive" } },
      { contact: { contains: term, mode: "insensitive" } },
    ];
  }

  if (specialty && specialty !== "ALL") {
    where.specialty = { contains: specialty, mode: "insensitive" };
  }

  if (status && status !== "ALL") {
    where.status = status;
  }

  const contractors = await prisma.contractor.findMany({
    where,
    include: {
      projectAssignments: {
        include: {
          project: { select: { id: true, name: true, status: true } },
        },
      },
      performances: {
        orderBy: { evaluatedAt: "desc" },
        take: 5,
      },
      _count: { select: { projectAssignments: true } },
    },
    orderBy: { [sort]: desc ? "desc" : "asc" },
  });

  // Contractor Ranking Calculation:
  // Score = (rating / 5) * 40 + (avg onTimeRate * 0.4) + max(0, 20 - totalDelays * 5)
  const ranked = contractors.map((c) => {
    let avgOnTime = 95;
    let totalDelays = 0;
    if (c.performances.length > 0) {
      avgOnTime =
        c.performances.reduce((acc, p) => acc + p.onTimeRate, 0) /
        c.performances.length;
      totalDelays = c.performances.reduce((acc, p) => acc + p.delayIncidents, 0);
    }

    const reliabilityScore = Math.min(
      100,
      Math.max(
        0,
        Math.round(
          (c.rating / 5) * 40 +
            (avgOnTime * 0.4) +
            Math.max(0, 20 - totalDelays * 5)
        )
      )
    );

    return {
      ...c,
      avgOnTime: Math.round(avgOnTime),
      totalDelays,
      reliabilityScore,
    };
  });

  ranked.sort((a, b) => b.reliabilityScore - a.reliabilityScore);

  // Network Summary Metrics
  const avgNetworkReliability =
    ranked.length > 0
      ? Math.round(
          ranked.reduce((acc, curr) => acc + curr.reliabilityScore, 0) /
            ranked.length
        )
      : 96;

  const totalAssignedProjects = ranked.reduce(
    (acc, curr) => acc + (curr._count?.projectAssignments || 0),
    0
  );

  return apiSuccess({
    contractors: ranked,
    total: ranked.length,
    metrics: {
      totalFirms: ranked.length,
      avgReliability: avgNetworkReliability,
      totalAssignedProjects,
      zeroDelayFirms: ranked.filter((c) => c.totalDelays === 0).length,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to register contractors.");
  }

  if (!can(user, "manage", "contractor")) {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can manage contractors.");
  }

  try {
    const body = await req.json();
    const parsed = contractorCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid contractor profile", parsed.error.format());
    }

    const existing = await prisma.contractor.findUnique({
      where: { email: parsed.data.email },
    });
    if (existing) {
      return apiConflict("Contractor with this email already exists.");
    }

    const contractor = await prisma.contractor.create({
      data: parsed.data,
    });

    await logActivity({
      actorId: user?.id || "system",
      actorName: user?.name || "Operator",
      actorRole: user?.role || "PROJECT_MANAGER",
      action: "CREATE",
      entity: "Contractor",
      entityId: contractor.id,
      meta: { company: contractor.company, specialty: contractor.specialty },
    });

    return apiSuccess({ contractor, message: "Contractor registered successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to register contractor", null, 500);
  }
}
