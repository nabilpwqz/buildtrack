import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { can } from "@/lib/rbac";
import { apiForbidden, apiNotFound } from "@/lib/api-response";
import { SessionUser } from "@/types";
import { computeBudgetSummary } from "@/lib/business-rules";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { FinancialReportPdf } from "@/components/pdf/financial-report-pdf";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;
  const { projectId } = await params;

  if (user && !can(user, "read", "budget")) {
    return apiForbidden();
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      budgets: { include: { category: true } },
      expenses: { select: { categoryId: true, amount: true } },
    },
  });

  if (!project) return apiNotFound("Project");

  const summary = computeBudgetSummary(project, project.budgets, project.expenses);

  const stream = await renderToStream(
    React.createElement(FinancialReportPdf, { summary, project }) as any
  );

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="financial_report_${project.id.substring(0, 8)}.pdf"`,
    },
  });
}
