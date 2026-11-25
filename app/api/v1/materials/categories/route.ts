import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo visitor read, or verify permission if user is signed in
  if (user && !can(user, "read", "material")) {
    return apiForbidden();
  }

  try {
    const categories = await prisma.materialCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        materials: {
          select: {
            id: true,
            availableQty: true,
            unitCost: true,
            reorderLevel: true,
          },
        },
        _count: {
          select: { materials: true },
        },
      },
    });

    const enriched = categories.map((cat) => {
      const totalUnits = cat.materials.reduce((sum, m) => sum + (m.availableQty || 0), 0);
      const totalValuation = cat.materials.reduce(
        (sum, m) => sum + (m.availableQty || 0) * (m.unitCost || 0),
        0
      );
      const lowStockCount = cat.materials.filter((m) => m.availableQty <= m.reorderLevel).length;

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        materialCount: cat._count.materials,
        totalUnits: Math.round(totalUnits * 100) / 100,
        totalValuation: Math.round(totalValuation),
        lowStockCount,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    return apiSuccess({ categories: enriched });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to load material categories", null, 500);
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "material")) {
    return apiForbidden("Access Denied: You do not have permission to create material categories.");
  }

  try {
    const body = await req.json();
    const parsed = categorySchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid category data", parsed.error.format());
    }

    const { name, description } = parsed.data;

    const existing = await prisma.materialCategory.findFirst({
      where: { name: { equals: name, mode: "insensitive" } },
    });

    if (existing) {
      return apiConflict(`Material category '${name}' already exists.`);
    }

    const category = await prisma.materialCategory.create({
      data: { name, description },
    });

    await logActivity({
      actorId: user?.id || "demo-inventory",
      actorName: user?.name || "Inventory Controller",
      actorRole: user?.role || "SITE_ENGINEER",
      action: "CREATE",
      entity: "MaterialCategory",
      entityId: category.id,
      meta: { name, description },
    });

    return apiSuccess({ category, message: "Material category created successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create category", null, 500);
  }
}

