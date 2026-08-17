import "server-only";

import { getApiUser } from "@/lib/api-session";
import { getParentStepUpStatus } from "@/lib/parent-security";
import { prisma } from "@/lib/prisma";

export async function getApiParentContext(request: Request) {
  const user = await getApiUser(request);
  if (!user) {
    return { error: "unauthorized" as const, status: 401 as const };
  }

  const membership = await prisma.householdMember.findFirst({
    where: {
      userId: user.id,
      role: { in: ["OWNER", "PARENT"] },
    },
    select: {
      role: true,
      household: {
        select: { id: true, locale: true },
      },
    },
  });

  if (!membership) {
    return { error: "forbidden" as const, status: 403 as const };
  }

  const stepUp = await getParentStepUpStatus(user.id);
  if (!stepUp.ok) {
    return {
      error: stepUp.code,
      status: stepUp.code === "parent_pin_not_configured" ? 428 as const : 403 as const,
    };
  }

  return {
    user,
    household: membership.household,
    role: membership.role,
  };
}
