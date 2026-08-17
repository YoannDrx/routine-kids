"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { cn } from "@/lib/utils";

const cropSize = 256;

type Point = {
  x: number;
  y: number;
};

type ProfilePhotoCropperModalProps = {
  open: boolean;
  sourceUrl: string | null;
  pending?: boolean;
  onClose: () => void;
  onConfirm: (photoUrl: string) => void | Promise<void>;
};

function clampPosition(
  point: Point,
  imageWidth: number,
  imageHeight: number,
  zoom: number,
) {
  const scaledWidth = imageWidth * zoom;
  const scaledHeight = imageHeight * zoom;
  const maxX = Math.max(0, (scaledWidth - cropSize) / 2);
  const maxY = Math.max(0, (scaledHeight - cropSize) / 2);

  return {
    x: Math.min(maxX, Math.max(-maxX, point.x)),
    y: Math.min(maxY, Math.max(-maxY, point.y)),
  };
}

export async function readImageFileAsDataUrl(file: File) {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("image_read_failed"));
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  });
}

export function ProfilePhotoCropperModal({
  open,
  sourceUrl,
  pending = false,
  onClose,
  onConfirm,
}: ProfilePhotoCropperModalProps) {
  const messages = useAppMessages();
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStartRef = useRef<{
    pointerId: number;
    point: Point;
    origin: Point;
  } | null>(null);
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [naturalSize, setNaturalSize] = useState({ width: cropSize, height: cropSize });

  useEffect(() => {
    if (!sourceUrl) {
      return;
    }

    const image = new Image();
    image.onload = () => {
      const baseScale = Math.max(cropSize / image.width, cropSize / image.height);
      setNaturalSize({
        width: image.width * baseScale,
        height: image.height * baseScale,
      });
    };
    image.src = sourceUrl;
  }, [sourceUrl]);

  const clampedPosition = useMemo(
    () => clampPosition(position, naturalSize.width, naturalSize.height, zoom),
    [naturalSize.height, naturalSize.width, position, zoom],
  );

  if (!open || !sourceUrl) {
    return null;
  }

  const displayedWidth = naturalSize.width * zoom;
  const displayedHeight = naturalSize.height * zoom;

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      panelClassName="w-full max-w-xl rounded-3xl p-6"
    >
      <h3 className="mb-5 text-center text-xl font-bold">{messages.profile.cropTitle}</h3>

      <div className="flex flex-col items-center gap-5">
        <div
          className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#120d2b] shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          style={{ width: cropSize, height: cropSize, touchAction: "none" }}
          onPointerDown={(event) => {
            dragStartRef.current = {
              pointerId: event.pointerId,
              point: { x: event.clientX, y: event.clientY },
              origin: clampedPosition,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!dragStartRef.current || dragStartRef.current.pointerId !== event.pointerId) {
              return;
            }

            const deltaX = event.clientX - dragStartRef.current.point.x;
            const deltaY = event.clientY - dragStartRef.current.point.y;

            setPosition(
              clampPosition(
                {
                  x: dragStartRef.current.origin.x + deltaX,
                  y: dragStartRef.current.origin.y + deltaY,
                },
                naturalSize.width,
                naturalSize.height,
                zoom,
              ),
            );
          }}
          onPointerUp={(event) => {
            if (dragStartRef.current?.pointerId === event.pointerId) {
              dragStartRef.current = null;
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={sourceUrl}
            alt=""
            draggable={false}
            className={cn("absolute left-1/2 top-1/2 max-w-none select-none object-cover")}
            style={{
              width: displayedWidth,
              height: displayedHeight,
              transform: `translate(calc(-50% + ${clampedPosition.x}px), calc(-50% + ${clampedPosition.y}px))`,
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/15 shadow-[inset_0_0_0_999px_rgba(0,0,0,0.28)]" />
        </div>

        <label className="w-full max-w-sm">
          <div className="mb-2 text-sm font-semibold text-white/75">
            {messages.profile.zoom}
          </div>
          <input
            type="range"
            min={1}
            max={2.4}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-full accent-[#ff6fb5]"
          />
        </label>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <button
            type="button"
            disabled={pending}
            onClick={onClose}
            className="rounded-2xl bg-white/10 px-4 py-3 font-semibold text-white/80 transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.profile.cancelCrop}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              const canvas = document.createElement("canvas");
              canvas.width = cropSize;
              canvas.height = cropSize;

              const context = canvas.getContext("2d");

              if (!context || !imageRef.current) {
                return;
              }

              context.drawImage(
                imageRef.current,
                cropSize / 2 - displayedWidth / 2 + clampedPosition.x,
                cropSize / 2 - displayedHeight / 2 + clampedPosition.y,
                displayedWidth,
                displayedHeight,
              );

              await onConfirm(canvas.toDataURL("image/jpeg", 0.85));
            }}
            className="rounded-2xl bg-[linear-gradient(90deg,#ff6fb5,#ff9c4a)] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.profile.confirmCrop}
          </button>
        </div>
      </div>
    </OverlayModalShell>
  );
}
