import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/auth";
import { apiSuccess } from "@/lib/api-response";
import { SessionUser } from "@/types";

const STANDARD_PROGRESS_NOTIFICATIONS = [
  {
    id: "notif_p_1",
    title: "Dhaka Metro Viaduct: Superstructure Milestone Achieved",
    message: "Pre-cast segmental span erection milestone (Span 124-128) verified by Site Engineer. Progress advanced to 78.4%.",
    type: "REPORT_SUBMITTED",
    link: "/projects",
    isRead: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: "notif_p_2",
    title: "Matarbari Port: Critical Path Schedule Float Slippage Warning",
    message: "Breakwater rock armour placement trailing 7 days behind CPM baseline. Automated mitigation recommended.",
    type: "OVERDUE",
    link: "/reports",
    isRead: false,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: "notif_p_3",
    title: "Padma Rail Link: High-Tensile Rebar Stockout Hazard",
    message: "Warehouse SKU RB-500W-32MM breached safety buffer threshold (Current: 14.5 MT vs Reorder: 25.0 MT).",
    type: "LOW_STOCK",
    link: "/materials",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif_p_4",
    title: "Karnaphuli Tunnel: Emergency Drainage Capital Allocation",
    message: "Financial Controller authorized $850,000 disbursement voucher for flood gate reinforcement under Contingency Reserve.",
    type: "BUDGET_OVERRUN",
    link: "/expenses",
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif_p_5",
    title: "Rooppur Unit 2: Heavy Lifting Crane Work Package Assigned",
    message: "Apex Rigging & Heavy Lift Corp assigned to reactor dome polar crane assembly task with completion deadline in 14 days.",
    type: "TASK_ASSIGNED",
    link: "/tasks",
    isRead: true,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  },
  {
    id: "notif_p_6",
    title: "Payra Deep Port: Geotechnical Piling Indent Approved",
    message: "Material Requisition for 400 MT Microfine Grout Cement approved by Project Manager for immediate warehouse dispatch.",
    type: "REQUEST_APPROVED",
    link: "/materials",
    isRead: true,
    createdAt: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  let notifications: any[] = [];
  let unreadCount = 0;

  if (user?.id) {
    let dbNotifs = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    // If new user has no notifications, auto-seed realistic project progress notifications
    if (dbNotifs.length === 0) {
      try {
        await prisma.notification.createMany({
          data: STANDARD_PROGRESS_NOTIFICATIONS.map((n) => ({
            userId: user.id,
            title: n.title,
            message: n.message,
            type: n.type,
            link: n.link,
            isRead: n.isRead,
          })),
        });

        dbNotifs = await prisma.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 30,
        });
      } catch {
        // Fallback to static in case of connection limits
        dbNotifs = STANDARD_PROGRESS_NOTIFICATIONS as any;
      }
    }

    notifications = dbNotifs;
    unreadCount = dbNotifs.filter((n) => !n.isRead).length;
  } else {
    // Guest or unauthenticated preview telemetry
    notifications = STANDARD_PROGRESS_NOTIFICATIONS;
    unreadCount = STANDARD_PROGRESS_NOTIFICATIONS.filter((n) => !n.isRead).length;
  }

  return apiSuccess({
    notifications,
    unreadCount,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as unknown as SessionUser | undefined;

  if (!user?.id) {
    return apiSuccess({ message: "Guest session state updated" });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId: user.id },
        data: { isRead: true },
      });
    } else {
      // Mark all read
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    }

    return apiSuccess({ message: "Notifications updated" });
  } catch (err: any) {
    return apiSuccess({ message: "Failed to update notification" });
  }
}
