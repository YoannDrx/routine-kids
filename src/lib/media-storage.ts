import "server-only";

import { del, put } from "@vercel/blob";

import { decodeImageDataUrl } from "@/lib/image-data-url";
import {
  createPrivateMediaReference,
  getPrivateMediaPathname,
  isPrivateMediaOwnedByHousehold,
} from "@/lib/private-media";
import { prisma } from "@/lib/prisma";

export async function persistPrivateImage(input: {
  dataUrl: string;
  householdId: string;
  category: "profiles" | "tasks";
}) {
  const image = decodeImageDataUrl(input.dataUrl);
  const pathname = `households/${input.householdId}/${input.category}/${crypto.randomUUID()}.${image.extension}`;
  const blob = await put(pathname, image.body, {
    access: "private",
    addRandomSuffix: false,
    contentType: image.contentType,
    cacheControlMaxAge: 3600,
  });

  return createPrivateMediaReference(blob.pathname);
}

export async function deletePrivateImage(reference: string | null | undefined) {
  const pathname = getPrivateMediaPathname(reference);
  if (!pathname) return;

  await del(pathname);
}

export async function deletePrivateImages(
  references: Array<string | null | undefined>,
) {
  const pathnames = [...new Set(
    references
      .map((reference) => getPrivateMediaPathname(reference))
      .filter((pathname): pathname is string => Boolean(pathname)),
  )];

  if (pathnames.length === 0) return;

  await del(pathnames);
}

export async function deletePrivateImageIfUnreferenced(
  reference: string | null | undefined,
) {
  const pathname = getPrivateMediaPathname(reference);
  if (!pathname || !reference) return;

  const [profileReferences, templateReferences, routineReferences] =
    await Promise.all([
      prisma.childProfile.count({ where: { photoUrl: reference } }),
      prisma.taskTemplate.count({ where: { imageUrl: reference } }),
      prisma.routineTask.count({ where: { imageUrl: reference } }),
    ]);

  if (profileReferences + templateReferences + routineReferences === 0) {
    await del(pathname);
  }
}

export function normalizeExistingMediaReference(
  reference: string | null,
  householdId: string,
) {
  if (!reference) return null;
  if (reference.startsWith("data:image/")) return reference;
  if (isPrivateMediaOwnedByHousehold(reference, householdId)) return reference;

  throw new Error("media_reference_not_owned");
}
