import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DashboardShell } from "@/components/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/login");
  }

  const role = (session.user as any).role || "SITE_ENGINEER";
  const name = session.user.name || "Operator";
  const email = session.user.email || "";

  return (
    <DashboardShell userRole={role} userName={name} userEmail={email}>
      {children}
    </DashboardShell>
  );
}

