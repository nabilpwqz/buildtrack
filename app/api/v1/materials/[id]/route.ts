import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const materialUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  unit: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  reorderLevel: z.number().min(0).optional(),
  unitCost: z.number().min(0).optional(),
  availableQty: z.number().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "read", "material")) {
    return apiForbidden();
  }

  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      category: true,
      transactions: {
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          task: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, role: true } },
        },
      },
      requests: {
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          project: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!material) return apiNotFound("Material");

  const isLowStock = material.availableQty <= material.reorderLevel;

  return apiSuccess({
    material: {
      ...material,
      isLowStock,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && !can(user, "update", "material")) {
    return apiForbidden("Access Denied: Only Project Managers and Administrators can update material SKU details.");
  }

  const existing = await prisma.material.findUnique({ where: { id } });
  if (!existing) return apiNotFound("Material");

  try {
    const body = await req.json();
    const parsed = materialUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    const updated = await prisma.material.update({
      where: { id },
      data: parsed.data,
      include: { category: true },
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "UPDATE",
        entity: "Material",
        entityId: id,
        meta: parsed.data,
      });
    }

    return apiSuccess({ material: updated, message: "Material parameters updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update material", null, 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (user && user.role !== "ADMIN") {
    return apiForbidden("Access Denied: Only Administrators can decommission material SKUs.");
  }

  const existing = await prisma.material.findUnique({
    where: { id },
    include: {
      _count: {
        select: { transactions: true, requests: true },
      },
    },
  });

  if (!existing) return apiNotFound("Material");

  try {
    await prisma.material.delete({ where: { id } });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "DELETE",
        entity: "Material",
        entityId: id,
        meta: { sku: existing.sku, name: existing.name },
      });
    }

    return apiSuccess({ message: "Material SKU decommissioned successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to decommission material", null, 500);
  }
}

