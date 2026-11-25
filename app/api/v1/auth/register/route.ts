import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import prisma from "@/lib/db";
import { apiSuccess, apiError, apiConflict } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "SITE_ENGINEER", "PROJECT_MANAGER", "FINANCE_MANAGER", "CONTRACTOR"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid input parameters", parsed.error.format());
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return apiConflict("User with this email already exists.");
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const company = await prisma.company.findFirst();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
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

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "CREATE",
      entity: "User",
      entityId: user.id,
      meta: { email: user.email, role: user.role },
    });

    return apiSuccess({ user, message: "User registered successfully" }, 201);
  } catch (error: any) {
    return apiError("INTERNAL_SERVER_ERROR", error.message || "Failed to register user", null, 500);
  }
}

