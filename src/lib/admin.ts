import { getServerSession } from "next-auth";
import { db } from "@/lib/db";

export type UserRole = "user" | "moderator" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  role: UserRole;
}

export async function getCurrentUser(): Promise<AdminUser | null> {
  const session = await getServerSession();
  if (!session?.user) return null;

  const user = await db.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    select: {
      id: true,
      email: true,
      username: true,
      displayName: true,
      avatar: true,
      role: true,
    },
  });

  return user;
}

export async function checkAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "admin";
}

export async function checkModerator(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "moderator" || user?.role === "admin";
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    throw new Error("Admin access required");
  }
  return user;
}

export async function requireModerator(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user || (user.role !== "moderator" && user.role !== "admin")) {
    throw new Error("Moderator access required");
  }
  return user;
}

export async function logAudit(params: {
  action: string;
  targetType: string;
  targetId: string;
  actorId: string;
  details?: Record<string, unknown>;
}) {
  await db.auditLog.create({
    data: {
      action: params.action,
      targetType: params.targetType,
      targetId: params.targetId,
      actorId: params.actorId,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}

// Alias used by admin route handlers
export const createAuditLog = logAudit;

export async function isUserSuspended(userId: string): Promise<boolean> {
  const suspension = await db.userSuspension.findFirst({
    where: {
      userId,
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
  return suspension !== null;
}
