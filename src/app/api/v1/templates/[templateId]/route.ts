import { NextResponse } from "next/server";

import { getApiParentContext } from "@/lib/api-parent-context";
import { deletePrivateImageIfUnreferenced } from "@/lib/media-storage";
import { deleteTaskTemplate } from "@/lib/task-template-service";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { templateId } = await context.params;

  try {
    const deleted = await deleteTaskTemplate({
      householdId: access.household.id,
      actorUserId: access.user.id,
      templateId,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    await deletePrivateImageIfUnreferenced(deleted.previousImageUrl).catch(() => undefined);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "template_not_found_or_protected" }, { status: 409 });
  }
}
