import { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiSuccess, apiError, apiForbidden, apiConflict } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const userCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"]),
  contractorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!can(user, "read", "user")) {
    return apiForbidden("Only administrators and project managers can view users.");
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      contractorId: true,
      contractor: { select: { id: true, name: true, company: true } },
      createdAt: true,
      _count: { select: { assignedTasks: true, managedProjects: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return apiSuccess({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!can(user, "manage", "user")) {
    return apiForbidden("Only administrators can manage users.");
  }

  try {
    const body = await req.json();
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid user payload", parsed.error.format());
    }

    const { name, email, password, role, contractorId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiConflict("User with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.findFirst();

    const created = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        contractorId: contractorId || null,
        companyId: company?.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "CREATE",
        entity: "User",
        entityId: created.id,
        meta: { email: created.email, role: created.role },
      });
    }

    return apiSuccess({ user: created, message: "User account created" }, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create user", null, 500);
  }
}

const userUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2).optional(),
  role: z.enum(["ADMIN", "PROJECT_MANAGER", "SITE_ENGINEER", "FINANCE_MANAGER", "CONTRACTOR"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional(),
  password: z.string().min(6).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!can(user, "manage", "user")) {
    return apiForbidden("Only administrators can modify user accounts.");
  }

  try {
    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid update payload", parsed.error.format());
    }

    const { id, name, role, status, password } = parsed.data;

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
      return apiError("NOT_FOUND", "User not found", null, 404);
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "UPDATE",
        entity: "User",
        entityId: updated.id,
        meta: { changes: Object.keys(updateData) },
      });
    }

    return apiSuccess({ user: updated, message: "User updated successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update user", null, 500);
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!can(user, "manage", "user")) {
    return apiForbidden("Only administrators can deactivate or remove users.");
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return apiError("BAD_REQUEST", "Missing user id parameter", null, 400);
    }

    if (user?.id === id) {
      return apiError("BAD_REQUEST", "Cannot delete your own active administrator account", null, 400);
    }

    // Soft-deactivate by default for compliance and audit trail integrity
    const deactivated = await prisma.user.update({
      where: { id },
      data: { status: "SUSPENDED" },
      select: { id: true, email: true, status: true },
    });

    if (user) {
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "DELETE",
        entity: "User",
        entityId: id,
        meta: { action: "SUSPENDED", email: deactivated.email },
      });
    }

    return apiSuccess({ message: "User account suspended successfully", user: deactivated });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to suspend user", null, 500);
  }
}

