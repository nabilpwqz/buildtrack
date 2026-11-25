import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { apiSuccess, apiError, apiForbidden, apiNotFound } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { SessionUser } from "@/types";

const assignSchema = z.object({
  projectId: z.string(),
  role: z.string().optional().default("Contractor Partner"),
  action: z.enum(["ASSIGN", "UNASSIGN"]).optional().default("ASSIGN"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { id } = await params;

  if (!user) {
    return apiForbidden("Unauthorized: Authentication required to assign contractors.");
  }

  if (user.role !== "ADMIN" && user.role !== "PROJECT_MANAGER") {
    return apiForbidden("Access Denied: Only Administrators and Project Managers can assign contractors to projects.");
  }

  const contractor = await prisma.contractor.findUnique({ where: { id } });
  if (!contractor) return apiNotFound("Contractor");

  try {
    const body = await req.json();
    const parsed = assignSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("VALIDATION_ERROR", "Invalid assignment payload", parsed.error.format());
    }

    const { projectId, role, action } = parsed.data;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return apiNotFound("Project");

    if (action === "UNASSIGN") {
      await prisma.projectContractor.deleteMany({
        where: { projectId, contractorId: id },
      });
      await logActivity({
        actorId: user.id,
        actorName: user.name,
        actorRole: user.role,
        action: "UPDATE",
        entity: "ProjectContractor",
        entityId: `${projectId}_${id}`,
        meta: { action: "UNASSIGN", contractorId: id, projectId },
      });
      return apiSuccess({ message: "Contractor unassigned from project" });
    }

    const assignment = await prisma.projectContractor.upsert({
      where: {
        projectId_contractorId: { projectId, contractorId: id },
      },
      update: { role },
      create: {
        projectId,
        contractorId: id,
        role,
      },
      include: { project: true },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "UPDATE",
      entity: "ProjectContractor",
      entityId: assignment.id,
      meta: { action: "ASSIGN", contractorId: id, projectId, role },
    });

    return apiSuccess({ assignment, message: "Contractor assigned to project successfully" });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update project assignment", null, 500);
  }
}

