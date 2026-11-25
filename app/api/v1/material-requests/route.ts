import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const requestCreateSchema = z.object({
  materialId: z.string(),
  projectId: z.string(),
  qty: z.number().positive("Quantity must be greater than zero"),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo visitor read, or verify permission if user is signed in with restricted role
  if (user && !can(user, "read", "material_request")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || undefined;
  const projectId = searchParams.get("projectId") || undefined;
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  if (projectId && projectId !== "ALL") where.projectId = projectId;

  // Contractor sees only their own requests if authenticated
  if (user?.role === "CONTRACTOR") {
    where.requesterId = user.id;
  }

  let requests = await prisma.materialRequest.findMany({
    where: {
      ...where,
      ...(q
        ? {
            OR: [
              { reason: { contains: q, mode: "insensitive" } },
              { material: { name: { contains: q, mode: "insensitive" } } },
              { project: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    include: {
      material: { select: { id: true, name: true, sku: true, unit: true, availableQty: true, unitCost: true } },
      project: { select: { id: true, name: true } },
      requester: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Curated fallbacks if database has 0
  if (requests.length === 0 && !status && !projectId && !q) {
    requests = [
      {
        id: "req-fallback-1",
        materialId: "mat-1",
        projectId: "fallback-p1",
        qty: 90,
        status: "PENDING",
        reason: "Required for Pier 114 to 118 box girder reinforcement cage tying.",
        createdAt: new Date(),
        updatedAt: new Date(),
        material: {
          id: "mat-1",
          name: "High-Tensile Deformed Rebar 500W (25mm)",
          sku: "REB-500W-25",
          unit: "MT",
          availableQty: 185,
          unitCost: 920,
        },
        project: { id: "fallback-p1", name: "Dhaka Metro Elevated Viaduct Phase 3" },
        requester: { id: "u-1", name: "Engr. Farhana Ahmed, PE", role: "SITE_ENGINEER" },
      } as any,
      {
        id: "req-fallback-2",
        materialId: "mat-2",
        projectId: "fallback-p2",
        qty: 350,
        status: "APPROVED",
        reason: "Scheduled monolithic concrete pour for deep marine wharf quay wall Berth 3.",
        createdAt: new Date(Date.now() - 86400000),
        updatedAt: new Date(Date.now() - 86400000),
        material: {
          id: "mat-2",
          name: "Ordinary Portland Cement (CEM-I 52.5N)",
          sku: "CEM-I-525N",
          unit: "Bags",
          availableQty: 240,
          unitCost: 8.5,
        },
        project: { id: "fallback-p2", name: "Karnaphuli River Deep-Water Terminal" },
        requester: { id: "u-2", name: "Tanvir Rahman, Site Lead", role: "SITE_ENGINEER" },
      } as any,
    ];
  }

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const fulfilledCount = requests.filter((r) => r.status === "FULFILLED").length;
  const totalIndentValue = requests.reduce(
    (acc, r) => acc + (r.qty || 0) * (r.material?.unitCost || 0),
    0
  );

  return apiSuccess({
    requests,
    metrics: {
      totalRequests: requests.length,
      pendingCount,
      approvedCount,
      fulfilledCount,
      totalIndentValue: Math.round(totalIndentValue),
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "material_request")) {
    return apiForbidden();
  }

  try {
    const body = await req.json();
    const parsed = requestCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid material request", parsed.error.format());
    }

    const { materialId, projectId, qty, reason } = parsed.data;

    let requesterId = user?.id;
    if (!requesterId) {
      const defaultUser = await prisma.user.findFirst({
        where: { role: { in: ["SITE_ENGINEER", "CONTRACTOR", "PROJECT_MANAGER"] } },
      });
      requesterId = defaultUser?.id || "demo-requester";
    }

    const request = await prisma.materialRequest.create({
      data: {
        materialId,
        projectId,
        requesterId,
        qty,
        reason,
        status: "PENDING",
      },
      include: {
        material: true,
        project: { select: { id: true, name: true, managerId: true } },
      },
    });

    await logActivity({
      actorId: user?.id || requesterId,
      actorName: user?.name || "Engr. Farhana Ahmed, PE",
      actorRole: user?.role || "SITE_ENGINEER",
      action: "CREATE",
      entity: "MaterialRequest",
      entityId: request.id,
      meta: { materialId, projectId, qty },
    });

    // Notify project manager
    if (request.project.managerId) {
      await createNotification({
        userId: request.project.managerId,
        title: "New Material Indent Request",
        message: `${user?.name || "Field Team"} requested ${qty} ${request.material.unit} of '${request.material.name}' for '${request.project.name}'.`,
        type: "REQUEST_APPROVED",
        link: "/materials",
      });
    }

    return apiSuccess({ request, message: "Material indent submitted for approval" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to submit indent", null, 500);
  }
}
