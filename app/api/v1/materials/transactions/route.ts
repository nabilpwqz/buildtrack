import { NextRequest } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const transactionCreateSchema = z.object({
  materialId: z.string(),
  type: z.enum(["RECEIVE", "CONSUME", "ADJUST"]),
  qty: z.number().positive("Quantity must be greater than zero"),
  projectId: z.string().optional(),
  taskId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo visitor read, or verify permission if user is signed in
  if (user && !can(user, "read", "material")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "25")));
  const materialId = searchParams.get("materialId") || undefined;
  const projectId = searchParams.get("projectId") || undefined;
  const taskId = searchParams.get("taskId") || undefined;
  const type = searchParams.get("type") || undefined;
  const q = searchParams.get("q") || "";

  const where: any = {};
  if (materialId && materialId !== "ALL") where.materialId = materialId;
  if (projectId && projectId !== "ALL") where.projectId = projectId;
  if (taskId && taskId !== "ALL") where.taskId = taskId;
  if (type && type !== "ALL") where.type = type;

  if (q) {
    where.OR = [
      { notes: { contains: q, mode: "insensitive" } },
      { material: { name: { contains: q, mode: "insensitive" } } },
      { material: { sku: { contains: q, mode: "insensitive" } } },
      { project: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  try {
    const [total, transactions, typeCounts] = await Promise.all([
      prisma.materialTransaction.count({ where }),
      prisma.materialTransaction.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          material: { select: { id: true, name: true, sku: true, unit: true, availableQty: true } },
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true, status: true } },
          user: { select: { id: true, name: true, role: true, email: true } },
        },
      }),
      prisma.materialTransaction.groupBy({
        by: ["type"],
        _count: true,
        _sum: { qty: true },
      }),
    ]);

    const metrics = {
      totalRecords: total,
      dispatchedCount: typeCounts.find((t) => t.type === "ISSUE")?._count || 0,
      dispatchedQty: Math.round(typeCounts.find((t) => t.type === "ISSUE")?._sum.qty || 0),
      receivedCount: typeCounts.find((t) => t.type === "RECEIVE")?._count || 0,
      receivedQty: Math.round(typeCounts.find((t) => t.type === "RECEIVE")?._sum.qty || 0),
      consumedCount: typeCounts.find((t) => t.type === "CONSUME")?._count || 0,
      consumedQty: Math.round(typeCounts.find((t) => t.type === "CONSUME")?._sum.qty || 0),
    };

    return apiSuccess({
      transactions,
      total,
      page,
      pageSize,
      pageCount: Math.ceil(total / pageSize),
      metrics,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to load stock history", null, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to record material inventory transactions.");
  }

  // Only SITE_ENGINEER, PROJECT_MANAGER, and ADMIN can update inventory
  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER" && user.role !== "SITE_ENGINEER") {
    return apiForbidden("Access Denied: Only Site Engineers, Project Managers, and Admins can record inventory transactions.");
  }

  try {
    const body = await req.json();
    const parsed = transactionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid transaction payload", parsed.error.format());
    }

    const { materialId, type, qty, projectId, taskId, notes } = parsed.data;

    // Validate project existence if provided
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project) return apiNotFound("Referenced project does not exist.");
    }

    // Atomic stock update & transaction ledger logging
    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({ where: { id: materialId } });
      if (!material) throw new Error("MATERIAL_NOT_FOUND");

      let balanceAfter = material.availableQty;

      if (type === "RECEIVE") {
        balanceAfter = material.availableQty + qty;
      } else if (type === "CONSUME") {
        if (material.availableQty < qty) {
          throw new Error(
            `INSUFFICIENT_STOCK: Cannot consume ${qty} ${material.unit}. Only ${material.availableQty} available.`
          );
        }
        balanceAfter = material.availableQty - qty;
      } else if (type === "ADJUST") {
        // Direct inventory reconciliation
        balanceAfter = qty;
      }

      const updatedMaterial = await tx.material.update({
        where: { id: materialId },
        data: { availableQty: balanceAfter },
      });

      const transaction = await tx.materialTransaction.create({
        data: {
          type,
          qty,
          balanceAfter,
          materialId,
          projectId: projectId || null,
          taskId: taskId || null,
          userId: user.id,
          notes: notes || `${type} of ${qty} ${material.unit} logged by ${user.name}`,
        },
        include: {
          material: true,
          project: true,
          task: true,
          user: { select: { id: true, name: true, role: true } },
        },
      });

      return { material: updatedMaterial, transaction };
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: type,
      entity: "MaterialTransaction",
      entityId: result.transaction.id,
      meta: { materialId, type, qty, balanceAfter: result.material.availableQty },
    });

    // Check low stock trigger
    if (result.material.availableQty <= result.material.reorderLevel) {
      await createNotification({
        userId: user.id,
        title: `Low Stock Alert: ${result.material.name}`,
        message: `Inventory balance decreased to ${result.material.availableQty} ${result.material.unit} (reorder threshold: ${result.material.reorderLevel}).`,
        type: "LOW_STOCK",
        link: "/materials",
      });
    }

    return apiSuccess({
      transaction: result.transaction,
      availableQty: result.material.availableQty,
      message: `Stock ${type.toLowerCase()} logged successfully. New balance: ${result.material.availableQty}`,
    }, 201);
  } catch (err: any) {
    if (err.message?.startsWith("INSUFFICIENT_STOCK")) {
      return apiConflict(err.message);
    }
    if (err.message === "MATERIAL_NOT_FOUND") {
      return apiNotFound("Material");
    }
    return apiError("INTERNAL_ERROR", err.message || "Failed to log transaction", null, 500);
  }
}

