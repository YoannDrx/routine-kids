import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import {
  deleteChildProfileCascade,
  updateChildProfileDetails,
} from "@/lib/child-profile-service";
import { deletePrivateImageIfUnreferenced } from "@/lib/media-storage";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  age: z.number().int().min(2).max(12),
  avatar: z.string().trim().min(1).max(16),
  headline: z.string().trim().max(80).nullable().optional(),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }
  const { profileId } = await context.params;

  try {
    const profile = await updateChildProfileDetails({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: profileId,
      name: parsed.data.name,
      age: parsed.data.age,
      avatar: parsed.data.avatar,
      headline: parsed.data.headline ?? null,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const { profileId } = await context.params;

  try {
    const deleted = await deleteChildProfileCascade({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: profileId,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    await Promise.all([
      deletePrivateImageIfUnreferenced(deleted.previousPhotoUrl).catch(() => undefined),
      ...deleted.previousTaskImageUrls.map((reference) =>
        deletePrivateImageIfUnreferenced(reference).catch(() => undefined),
      ),
    ]);
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
}
