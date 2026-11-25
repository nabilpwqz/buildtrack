import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const projectCreateSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  location: z.string().min(2),
  startDate: z.string(),
  expectedEndDate: z.string(),
  totalBudget: z.number().min(0),
  managerId: z.string().optional(),
  status: z.enum(["PLANNING", "IN_PROGRESS", "DELAYED", "ON_HOLD", "COMPLETED"]).optional(),
  contractorIds: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Unauthenticated preview read is allowed; authenticated users check RBAC
  if (user && !can(user, "read", "project")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "10")));
  const q = searchParams.get("q") || "";
  const status = searchParams.get("status") || undefined;
  const sort = searchParams.get("sort") || "createdAt";
  const desc = searchParams.get("desc") === "true";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { location: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }
  if (status) {
    where.status = status;
  }

  // Role filtering: Contractor only sees their assigned projects
  if (user?.role === "CONTRACTOR") {
    const contractorId =
      user.contractorId ||
      (
        await prisma.user.findUnique({
          where: { id: user.id },
          select: { contractorId: true },
        })
      )?.contractorId;

    where.contractors = {
      some: { contractorId: contractorId || "none" },
    };
  }

  const [total, projects, allProjectsForMetrics] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sort]: desc ? "desc" : "asc" },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        contractors: {
          include: {
            contractor: {
              select: { id: true, name: true, company: true, specialty: true, rating: true },
            },
          },
        },
        _count: { select: { tasks: true, members: true, contractors: true } },
      },
    }),
    prisma.project.findMany({
      select: {
        id: true,
        status: true,
        totalBudget: true,
        progress: true,
      },
    }),
  ]);

  // Aggregate metrics
  let activeProjects = 0;
  let delayedProjects = 0;
  let planningProjects = 0;
  let completedProjects = 0;
  let onHoldProjects = 0;
  let totalBudget = 0;
  let totalProgress = 0;

  for (const p of allProjectsForMetrics) {
    if (p.status === "IN_PROGRESS") activeProjects++;
    else if (p.status === "DELAYED") delayedProjects++;
    else if (p.status === "PLANNING") planningProjects++;
    else if (p.status === "COMPLETED") completedProjects++;
    else if (p.status === "ON_HOLD") onHoldProjects++;

    totalBudget += p.totalBudget || 0;
    totalProgress += p.progress || 0;
  }

  const avgProgress =
    allProjectsForMetrics.length > 0
      ? Math.round((totalProgress / allProjectsForMetrics.length) * 10) / 10
      : 0;

  return apiSuccess({
    projects,
    total,
    page,
    pageSize,
    pageCount: Math.ceil(total / pageSize),
    metrics: {
      totalProjects: allProjectsForMetrics.length,
      activeProjects,
      delayedProjects,
      planningProjects,
      completedProjects,
      onHoldProjects,
      totalBudget,
      avgProgress,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "project")) {
    return apiForbidden("Only Admins and Project Managers can create projects.");
  }

  try {
    const body = await req.json();
    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid project data", parsed.error.format());
    }

    const {
      name,
      description,
      location,
      startDate,
      expectedEndDate,
      totalBudget,
      managerId,
      status,
      contractorIds,
    } = parsed.data;

    const company = await prisma.company.findFirst();

    // Actor fallback for demo preview
    const actor =
      user ||
      (await prisma.user.findFirst({
        select: { id: true, name: true, role: true },
      }));

    const project = await prisma.project.create({
      data: {
        name,
        description,
        location,
        startDate: new Date(startDate),
        expectedEndDate: new Date(expectedEndDate),
        totalBudget,
        managerId: managerId || actor?.id,
        companyId: company?.id,
        status: status || "PLANNING",
        progress: 0,
        contractors:
          contractorIds && contractorIds.length > 0
            ? {
                create: contractorIds.map((cId) => ({
                  contractorId: cId,
                  role: "Contractor Partner",
                })),
              }
            : undefined,
      },
      include: {
        manager: { select: { id: true, name: true, email: true } },
        contractors: { include: { contractor: true } },
      },
    });

    if (actor) {
      await logActivity({
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: "CREATE",
        entity: "Project",
        entityId: project.id,
        meta: { name: project.name, budget: project.totalBudget },
      });
    }

    return apiSuccess({ project, message: "Project created successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create project", null, 500);
  }
}
