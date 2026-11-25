import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict, apiNotFound } from "@/lib/api-response";
import { logActivity, createNotification } from "@/lib/audit";
import { SessionUser } from "@/types";

const approvalSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "FULFILLED"]),
  reason: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "approve", "material_request")) {
    return apiForbidden("Only Project Managers and Finance Managers can approve material requests.");
  }

  const matRequest = await prisma.materialRequest.findUnique({
    where: { id },
    include: {
      material: true,
      project: { select: { id: true, name: true } },
    },
  });

  if (!matRequest) return apiNotFound("Material Request");

  try {
    const body = await req.json();
    const parsed = approvalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid approval action", parsed.error.format());
    }

    const { status: targetStatus, reason } = parsed.data;

    // If FULFILLED, check available stock and decrement in a transaction
    if (targetStatus === "FULFILLED") {
      const result = await prisma.$transaction(async (tx) => {
        const mat = await tx.material.findUnique({
          where: { id: matRequest.materialId },
        });

        if (!mat || mat.availableQty < matRequest.qty) {
          throw new Error(
            `INSUFFICIENT_STOCK: Only ${mat?.availableQty || 0} ${mat?.unit || "units"} available in warehouse.`
          );
        }

        const balanceAfter = mat.availableQty - matRequest.qty;

        await tx.material.update({
          where: { id: mat.id },
          data: { availableQty: balanceAfter },
        });

        await tx.materialTransaction.create({
          data: {
            type: "ISSUE",
            qty: matRequest.qty,
            balanceAfter,
            materialId: mat.id,
            projectId: matRequest.projectId,
            userId: user?.id || "unknown",
            notes: `Auto-dispatched upon request fulfillment #${matRequest.id}`,
          },
        });

        const updatedReq = await tx.materialRequest.update({
          where: { id },
          data: {
            status: "FULFILLED",
            approvedBy: user?.id,
          },
        });

        return updatedReq;
      });

      if (user) {
        await logActivity({
          actorId: user.id,
          actorName: user.name,
          actorRole: user.role,
          action: "ISSUE",
          entity: "MaterialRequest",
          entityId: id,
          meta: { status: "FULFILLED", qty: matRequest.qty },
        });

        await createNotification({
          userId: matRequest.requesterId,
          title: "Material Request Fulfilled",
          message: `Your request for ${matRequest.qty} ${matRequest.material.unit} of ${matRequest.material.name} has been dispatched to site.`,
          type: "REQUEST_APPROVED",
          link: "/materials",
        });
      }

      return apiSuccess({ request: result, message: "Request fulfilled and stock issued." });
    }

    // Otherwise, mark APPROVED or REJECTED
    const updated = await prisma.materialRequest.update({
      where: { id },
      data: {
        status: targetStatus,
        approvedBy: user?.id,
      },
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: targetStatus === "APPROVED" ? "APPROVE" : "REJECT",
        entity: "MaterialRequest",
        entityId: id,
        meta: { status: targetStatus, reason },
      });

      await createNotification({
        userId: matRequest.requesterId,
        title: `Material Request ${targetStatus}`,
        message: `Your request for ${matRequest.qty} ${matRequest.material.unit} was ${targetStatus.toLowerCase()}${reason ? `: ${reason}` : "."}`,
        type: "REQUEST_APPROVED",
        link: "/materials",
      });
    }

    return apiSuccess({ request: updated, message: `Request ${targetStatus.toLowerCase()} successfully.` });
  } catch (err: any) {
    if (err.message?.startsWith("INSUFFICIENT_STOCK")) {
      return apiConflict(err.message);
    }
    return apiError("INTERNAL_ERROR", err.message || "Approval process failed", null, 500);
  }
}

