import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const issueSchema = z.object({
  qty: z.number().positive("Quantity must be positive"),
  projectId: z.string(),
  taskId: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(["ISSUE", "CONSUME"]).optional().default("ISSUE"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id: materialId } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to record material usage.");
  }

  if (!can(user, "issue", "material")) {
    return apiForbidden("Access Denied: Only Site Engineers, Project Managers, and Administrators can record material usage.");
  }

  try {
    const body = await req.json();
    const parsed = issueSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid issue request", parsed.error.format());
    }

    const { qty, projectId, taskId, notes } = parsed.data;

    // Validate that project exists
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return apiNotFound("Referenced project does not exist.");
    }

    // Rule 7: Material usage must not exceed available stock (atomic transaction check)
    const result = await prisma.$transaction(async (tx) => {
      const material = await tx.material.findUnique({
        where: { id: materialId },
      });

      if (!material) {
        throw new Error("MATERIAL_NOT_FOUND");
      }

      if (material.availableQty < qty) {
        throw new Error(
          `INSUFFICIENT_STOCK: Material usage cannot exceed available stock. Requested ${qty} ${material.unit}, but only ${material.availableQty} ${material.unit} available.`
        );
      }

      const balanceAfter = material.availableQty - qty;

      // Decrement stock
      const updatedMaterial = await tx.material.update({
        where: { id: materialId },
        data: { availableQty: balanceAfter },
      });

      // Log transaction record
      const usageType = parsed.data.type || "ISSUE";
      const transaction = await tx.materialTransaction.create({
        data: {
          type: usageType,
          qty,
          balanceAfter,
          materialId,
          projectId,
          taskId: taskId || null,
          userId: user?.id || "unknown",
          notes: notes || `${usageType === "CONSUME" ? "Consumed" : "Dispatched"} ${qty} ${material.unit} to project site`,
        },
      });

      return { material: updatedMaterial, transaction };
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "ISSUE",
        entity: "Material",
        entityId: materialId,
        meta: { qty, projectId, balanceAfter: result.material.availableQty },
      });
    }

    // Check low stock alert after issue
    if (result.material.availableQty <= result.material.reorderLevel) {
      if (user?.id) {
        await createNotification({
          userId: user.id,
          title: `Low Stock Warning: ${result.material.name}`,
          message: `Stock level fell to ${result.material.availableQty} ${result.material.unit} (reorder threshold: ${result.material.reorderLevel}).`,
          type: "LOW_STOCK",
          link: "/materials",
        });
      }
    }

    return apiSuccess({
      message: `Issued ${qty} units successfully`,
      availableQty: result.material.availableQty,
      transaction: result.transaction,
    });
  } catch (err: any) {
    if (err.message?.startsWith("INSUFFICIENT_STOCK")) {
      return apiConflict(err.message);
    }
    if (err.message === "MATERIAL_NOT_FOUND") {
      return apiNotFound("Material");
    }
    return apiError("INTERNAL_ERROR", err.message || "Failed to issue material", null, 500);
  }
}

