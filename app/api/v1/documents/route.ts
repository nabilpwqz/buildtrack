import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { apiSuccess, apiError, apiForbidden } from "@/lib/api-response";
import { logActivity } from "@/lib/audit";
import { uploadToStorage, getStorageSignedUrl, isStorageConfigured, DEFAULT_BUCKET } from "@/lib/storage";
import { SessionUser } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as unknown as SessionUser | undefined;

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId") || undefined;
    const q = searchParams.get("q") || "";

    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (q) {
      where.OR = [
        { title: { contains: q } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Generate fresh presigned download URLs for stored objects
    const docsWithUrls = await Promise.all(
      documents.map(async (doc) => {
        let signedUrl = doc.fileUrl;
        if (isStorageConfigured() && doc.fileUrl.startsWith("storage://")) {
          const key = doc.fileUrl.replace("storage://", "");
          try {
            signedUrl = await getStorageSignedUrl({ key });
          } catch {
            // Keep original if signing fails
          }
        }
        return {
          ...doc,
          downloadUrl: signedUrl,
        };
      })
    );

    return apiSuccess({ documents: docsWithUrls, total: docsWithUrls.length });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to fetch documents", null, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as unknown as SessionUser | undefined;

    if (!user) {
      return apiForbidden("Authentication required to upload documents.");
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || file?.name || "Untitled Specification";
    const projectId = (formData.get("projectId") as string) || undefined;

    if (!file) {
      return apiError("BAD_REQUEST", "No file uploaded", null, 400);
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = file.name.split(".").pop() || "bin";
    const storageKey = `uploads/documents/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    let fileUrl = "";
    if (isStorageConfigured()) {
      await uploadToStorage({
        key: storageKey,
        body: buffer,
        contentType: file.type || "application/octet-stream",
        bucket: DEFAULT_BUCKET,
      });
      fileUrl = `storage://${storageKey}`;
    } else {
      fileUrl = `/uploads/${storageKey}`;
    }

    const doc = await prisma.document.create({
      data: {
        title,
        fileUrl,
        fileType: file.type || "application/octet-stream",
        fileSize: buffer.byteLength,
        projectId: projectId || null,
        uploadedById: user.id,
      },
      include: {
        project: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "CREATE",
      entity: "Document",
      entityId: doc.id,
      meta: { title: doc.title, fileSize: doc.fileSize, key: storageKey, projectId: doc.projectId },
    });

    let downloadUrl = doc.fileUrl;
    if (isStorageConfigured()) {
      try {
        downloadUrl = await getStorageSignedUrl({ key: storageKey });
      } catch {
        // fallback
      }
    }

    return apiSuccess({ document: { ...doc, downloadUrl } }, 201);
  } catch (error: any) {
    return apiError("UPLOAD_FAILED", error.message || "Failed to upload document", null, 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = session?.user as unknown as SessionUser | undefined;

    if (!user) {
      return apiForbidden("Authentication required to delete documents.");
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return apiError("BAD_REQUEST", "Missing document id parameter", null, 400);
    }

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) {
      return apiError("NOT_FOUND", "Document not found", null, 404);
    }

    await prisma.document.delete({ where: { id } });

    await logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      action: "DELETE",
      entity: "Document",
      entityId: id,
      meta: { title: doc.title, key: doc.fileUrl },
    });

    return apiSuccess({ message: "Document removed from vault successfully" });
  } catch (error: any) {
    return apiError("INTERNAL_ERROR", error.message || "Failed to delete document", null, 500);
  }
}

