import { NextResponse } from "next/server";
import { z } from "zod";

import { getApiParentContext } from "@/lib/api-parent-context";
import { createChildProfileWithDefaults } from "@/lib/child-profile-service";
import { deletePrivateImage, persistPrivateImage } from "@/lib/media-storage";
import { canCreateChildProfile } from "@/lib/product-entitlements";

const profileSchema = z.object({
  name: z.string().trim().min(1).max(40),
  age: z.number().int().min(2).max(12),
  avatar: z.string().trim().min(1).max(16).default("🧑‍🚀"),
  headline: z.string().trim().max(80).nullable().optional(),
  photoDataUrl: z
    .string()
    .trim()
    .min(1)
    .max(1_500_000)
    .refine((value) => value.startsWith("data:image/"))
    .optional(),
});

export async function POST(request: Request) {
  const context = await getApiParentContext(request);
  if ("error" in context) {
    return NextResponse.json(
      { error: context.error },
      { status: context.status },
    );
  }

  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_profile" }, { status: 400 });
  }

  const allowed = await canCreateChildProfile({
    userId: context.user.id,
    householdId: context.household.id,
  });
  if (!allowed) {
    return NextResponse.json({ error: "profile_limit_reached" }, { status: 409 });
  }

  let photoUrl: string | null = null;
  try {
    if (parsed.data.photoDataUrl) {
      photoUrl = await persistPrivateImage({
        dataUrl: parsed.data.photoDataUrl,
        householdId: context.household.id,
        category: "profiles",
      });
    }
    const profile = await createChildProfileWithDefaults({
      householdId: context.household.id,
      actorUserId: context.user.id,
      name: parsed.data.name,
      age: parsed.data.age,
      avatar: parsed.data.avatar,
      headline: parsed.data.headline ?? null,
      photoUrl,
      locale: context.household.locale === "en" ? "en" : "fr",
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch {
    await deletePrivateImage(photoUrl).catch(() => undefined);
    return NextResponse.json({ error: "profile_creation_failed" }, { status: 400 });
  }
}
