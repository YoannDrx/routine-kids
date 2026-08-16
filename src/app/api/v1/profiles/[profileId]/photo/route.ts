import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import {
  removeChildProfilePhoto,
  updateChildProfilePhoto,
} from "@/lib/child-profile-service";
import {
  deletePrivateImage,
  deletePrivateImageIfUnreferenced,
  persistPrivateImage,
} from "@/lib/media-storage";

const photoSchema = z.object({
  dataUrl: z
    .string()
    .trim()
    .min(1)
    .max(1_500_000)
    .refine((value) => value.startsWith("data:image/")),
});

export async function PUT(
  request: Request,
  context: { params: Promise<{ profileId: string }> },
) {
  const access = await getApiParentContext(request);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }
  const parsed = photoSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
  }
  const { profileId } = await context.params;

  let photoUrl: string | null = null;
  try {
    photoUrl = await persistPrivateImage({
      dataUrl: parsed.data.dataUrl,
      householdId: access.household.id,
      category: "profiles",
    });
    const profile = await updateChildProfilePhoto({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: profileId,
      photoUrl,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    await deletePrivateImageIfUnreferenced(profile.previousPhotoUrl).catch(
      () => undefined,
    );
    return NextResponse.json({ photoUrl: profile.photoUrl });
  } catch {
    await deletePrivateImage(photoUrl).catch(() => undefined);
    return NextResponse.json({ error: "profile_photo_update_failed" }, { status: 400 });
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
    const profile = await removeChildProfilePhoto({
      householdId: access.household.id,
      actorUserId: access.user.id,
      childProfileId: profileId,
      locale: access.household.locale === "en" ? "en" : "fr",
    });
    await deletePrivateImageIfUnreferenced(profile.previousPhotoUrl).catch(
      () => undefined,
    );
    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json({ error: "profile_not_found" }, { status: 404 });
  }
}
