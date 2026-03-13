import Image from "next/image";

import { cn } from "@/lib/utils";

type ProfileAvatarProps = {
  avatar: string;
  photoUrl?: string | null;
  alt: string;
  className?: string;
  imageClassName?: string;
  emojiClassName?: string;
};

export function ProfileAvatar({
  avatar,
  photoUrl,
  alt,
  className,
  imageClassName,
  emojiClassName,
}: ProfileAvatarProps) {
  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={alt}
        width={160}
        height={160}
        unoptimized
        className={cn("h-full w-full object-cover", className, imageClassName)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex h-full w-full items-center justify-center", className, emojiClassName)}
    >
      {avatar}
    </span>
  );
}
