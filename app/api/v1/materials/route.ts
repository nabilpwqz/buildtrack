import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";
import { ensureRealisticMaterialsDemoData } from "@/lib/demo-seed";

export const dynamic = "force-dynamic";

const materialCreateSchema = z.object({
  name: z.string().min(2),
  sku: z.string().min(2),
  unit: z.string().min(1),
  categoryId: z.string(),
  availableQty: z.number().min(0).default(0),
  reorderLevel: z.number().min(0).default(10),
  unitCost: z.number().min(0).default(0),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  // Allow guest/demo visitor read, or verify permission if user is signed in with restricted role
  if (user && !can(user, "read", "material")) {
    return apiForbidden();
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(0, parseInt(searchParams.get("page") || "0"));
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")));
  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || undefined;
  const lowStockOnly = searchParams.get("lowStock") === "true";
  const sort = searchParams.get("sort") || "name";
  const desc = searchParams.get("desc") === "true";

  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { sku: { contains: q, mode: "insensitive" } },
    ];
  }
  if (categoryId && categoryId !== "ALL") where.categoryId = categoryId;

  let [totalCount, rawMaterials, categories, allForMetrics] = await Promise.all([
    prisma.material.count({ where }),
    prisma.material.findMany({
      where,
      skip: page * pageSize,
      take: pageSize,
      orderBy: { [sort]: desc ? "desc" : "asc" },
      include: {
        category: true,
      },
    }),
    prisma.materialCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.material.findMany({
      where,
      select: { availableQty: true, reorderLevel: true, unitCost: true },
    }),
  ]);

  // Auto-seed real PostgreSQL materials if database has 0 SKUs
  if (rawMaterials.length === 0 && !q && !categoryId) {
    await ensureRealisticMaterialsDemoData();
    [totalCount, rawMaterials, categories, allForMetrics] = await Promise.all([
      prisma.material.count({ where }),
      prisma.material.findMany({
        where,
        skip: page * pageSize,
        take: pageSize,
        orderBy: { [sort]: desc ? "desc" : "asc" },
        include: { category: true },
      }),
      prisma.materialCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.material.findMany({
        where,
        select: { availableQty: true, reorderLevel: true, unitCost: true },
      }),
    ]);
  }

  const materials = rawMaterials.map((m) => ({
    ...m,
    isLowStock: m.availableQty <= m.reorderLevel,
  }));

  const filtered = lowStockOnly ? materials.filter((m) => m.isLowStock) : materials;

  const totalInventoryValuation = allForMetrics.reduce(
    (acc, m) => acc + (m.availableQty || 0) * (m.unitCost || 0),
    0
  );
  const criticalDeficitCount = allForMetrics.filter((m) => m.availableQty <= m.reorderLevel).length;

  return apiSuccess({
    materials: filtered,
    categories,
    total: totalCount,
    page,
    pageSize,
    pageCount: Math.ceil(totalCount / pageSize),
    metrics: {
      totalSKUs: totalCount,
      criticalDeficitCount,
      totalInventoryValuation: Math.round(totalInventoryValuation),
      categoryCount: categories.length,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (user && !can(user, "create", "material")) {
    return apiForbidden();
  }

  try {
    const body = await req.json();
    const parsed = materialCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid material data", parsed.error.format());
    }

    const { name, sku, unit, categoryId, availableQty, reorderLevel, unitCost } = parsed.data;

    const existing = await prisma.material.findUnique({ where: { sku } });
    if (existing) {
      return apiConflict(`Material with SKU ${sku} already exists.`);
    }

    const material = await prisma.material.create({
      data: {
        name,
        sku,
        unit,
        categoryId,
        availableQty,
        reorderLevel,
        unitCost,
      },
      include: { category: true },
    });

    if (availableQty > 0) {
      await prisma.materialTransaction.create({
        data: {
          type: "RECEIVE",
          qty: availableQty,
          balanceAfter: availableQty,
          materialId: material.id,
          userId: user?.id || "demo-inventory-officer",
          notes: "Initial inventory intake upon SKU catalog registration",
        },
      });
    }

    await logActivity({
      actorId: user?.id || "demo-inventory-officer",
      actorName: user?.name || "Inventory Controller",
      actorRole: user?.role || "SITE_ENGINEER",
      action: "CREATE",
      entity: "Material",
      entityId: material.id,
      meta: { sku, name, availableQty, unitCost },
    });

    return apiSuccess({ material, message: "Material SKU cataloged successfully" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to catalog material", null, 500);
  }
}
