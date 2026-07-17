const privateMediaPrefix = "rk-media:";
const pathnamePrefix = "households/";

export function createPrivateMediaReference(pathname: string) {
  if (!pathname.startsWith(pathnamePrefix) || pathname.includes("..")) {
    throw new Error("invalid_private_media_path");
  }

  return `${privateMediaPrefix}${pathname}`;
}

export function getPrivateMediaPathname(reference: string | null | undefined) {
  if (!reference?.startsWith(privateMediaPrefix)) return null;

  const pathname = reference.slice(privateMediaPrefix.length);
  if (!pathname.startsWith(pathnamePrefix) || pathname.includes("..")) return null;

  return pathname;
}

export function resolveMediaUrl(reference: string | null | undefined) {
  const pathname = getPrivateMediaPathname(reference);
  if (!pathname) return reference ?? null;

  return `/api/media/${pathname
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

export function isPrivateMediaOwnedByHousehold(
  reference: string,
  householdId: string,
) {
  return getPrivateMediaPathname(reference)?.startsWith(
    `households/${householdId}/`,
  ) ?? false;
}
