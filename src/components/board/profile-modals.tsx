"use client";

import { Image as ImageIcon, Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { useAppMessages } from "@/components/i18n/app-i18n-provider";
import { ProfilePhotoCropperModal, readImageFileAsDataUrl } from "@/components/board/profile-photo-cropper-modal";
import { OverlayModalShell } from "@/components/settings/overlay-modal-shell";
import { ProfileAvatar } from "@/components/shared/profile-avatar";
import type { BoardProfile } from "@/lib/data/prototype-seed";
import { boardAvatarChoices } from "@/lib/data/board-library";
import { cn } from "@/lib/utils";

const maxProfilePhotoBytes = 25 * 1024 * 1024;

export type EditableProfileInput = {
  id?: string;
  name: string;
  age: number;
  avatar: string;
  photoUrl?: string | null;
  headline: string;
};

type ProfileManagerModalProps = {
  open: boolean;
  profiles: BoardProfile[];
  isPending?: boolean;
  onClose: () => void;
  onCreateProfile: () => void;
  onEditProfile: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
};

type QuickEditAvatarModalProps = {
  open: boolean;
  profile: BoardProfile | null;
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (input: {
    avatar: string;
    photoUrl: string | null;
  }) => void | Promise<void>;
};

type ProfileEditorModalProps = {
  open: boolean;
  profile: BoardProfile | null;
  mode: "create" | "edit";
  isPending?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSave: (input: EditableProfileInput) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

function validatePhotoFile(file: File, invalidMessage: string, tooLargeMessage: string) {
  if (!file.type.startsWith("image/")) {
    throw new Error(invalidMessage);
  }

  if (file.size > maxProfilePhotoBytes) {
    throw new Error(tooLargeMessage);
  }
}

export function ProfileManagerModal({
  open,
  profiles,
  isPending = false,
  onClose,
  onCreateProfile,
  onEditProfile,
  onDeleteProfile,
}: ProfileManagerModalProps) {
  const messages = useAppMessages();

  return (
    <OverlayModalShell
      open={open}
      onClose={onClose}
      overlayClassName="z-[200]"
      panelClassName="relative flex h-[70vh] w-full max-w-md flex-col rounded-3xl p-6"
    >
      <h3 className="mb-4 text-xl font-bold">{messages.profile.crewTitle}</h3>
      <div className="flex-1 space-y-2 overflow-y-auto pr-2">
        {profiles.length === 0 ? (
          <div className="p-4 text-center italic text-white/50">
            {messages.workspace.noProfiles}
          </div>
        ) : (
          profiles.map((profile) => (
            <div
              key={profile.id}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#1e163d] text-xl">
                  <ProfileAvatar
                    avatar={profile.avatar}
                    photoUrl={profile.photoUrl}
                    alt={profile.name}
                    emojiClassName="text-xl"
                  />
                </div>
                <div>
                  <div className="text-sm font-bold">{profile.name}</div>
                  <div className="text-xs text-white/45">{messages.workspace.ageYears(profile.age)}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onEditProfile(profile.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/70 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`${messages.common.edit} ${profile.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => onDeleteProfile(profile.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-red-400 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`${messages.common.delete} ${profile.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="mt-2 border-t border-white/10 pt-4">
        <button
          type="button"
          disabled={isPending}
          onClick={onCreateProfile}
          className="w-full rounded-xl border border-white/20 py-3 font-bold transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {messages.profile.addMember}
        </button>
      </div>
    </OverlayModalShell>
  );
}

export function QuickEditAvatarModal({
  open,
  profile,
  isPending = false,
  errorMessage,
  onClose,
  onSave,
}: QuickEditAvatarModalProps) {
  const messages = useAppMessages();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar ?? boardAvatarChoices[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile?.photoUrl ?? null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <>
      {cropSource === null ? (
        <OverlayModalShell
          open={open}
          onClose={onClose}
          overlayClassName="z-[60]"
          panelClassName="w-full max-w-md rounded-[32px] border border-white/10 p-7 text-center"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.currentTarget.value = "";

              if (!file) {
                return;
              }

              try {
                validatePhotoFile(
                  file,
                  messages.profile.imageInvalid,
                  messages.profile.imageTooLarge,
                );
                setCropSource(await readImageFileAsDataUrl(file));
                setLocalError(null);
              } catch (error) {
                setLocalError(
                  error instanceof Error ? error.message : messages.profile.imageInvalid,
                );
              }
            }}
          />

          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-5">
              <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-[5px] border-white/10 bg-[#1a1438] text-4xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
                <div className="pointer-events-none absolute inset-1 rounded-full border border-white/10" />
                <ProfileAvatar
                  avatar={selectedAvatar}
                  photoUrl={photoUrl}
                  alt={profile?.name ?? messages.profile.defaultName}
                  emojiClassName="text-4xl"
                />
              </div>
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-[#120d2b] bg-[linear-gradient(135deg,#ff6fb5,#ff9c4a)] text-slate-950 shadow-lg transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={photoUrl ? messages.profile.replacePhoto : messages.profile.uploadPhoto}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/40">
              {messages.profile.profileTitle}
            </p>
            <h3 className="mt-3 text-2xl font-bold">
              {profile?.name ?? messages.profile.defaultName}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-white/60">
              {photoUrl ? messages.profile.replacePhoto : messages.profile.uploadPhoto}
            </p>
          </div>

          {errorMessage || localError ? (
            <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {errorMessage ?? localError}
            </p>
          ) : null}

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="mb-4 text-center text-xs font-bold uppercase tracking-[0.22em] text-white/45">
              {messages.profile.chooseAvatarLabel}
            </p>
            <div className="grid max-h-60 grid-cols-4 gap-3 overflow-y-auto justify-items-center">
              {boardAvatarChoices.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    setPhotoUrl(null);
                    setLocalError(null);
                  }}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40",
                    selectedAvatar === avatar && photoUrl === null
                      ? "scale-110 bg-[#ec4899] text-white ring-2 ring-white shadow-lg"
                      : "bg-white/10 text-white/70 hover:bg-white/20",
                  )}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              onSave({
                avatar: selectedAvatar,
                photoUrl,
              })
            }
            className="mt-6 w-full rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? messages.profile.savingProfile : messages.profile.saveProfile}
          </button>
        </OverlayModalShell>
      ) : null}

      <ProfilePhotoCropperModal
        key={cropSource ?? "quick-edit-photo"}
        open={cropSource !== null}
        sourceUrl={cropSource}
        pending={isPending}
        onClose={() => setCropSource(null)}
        onConfirm={async (nextPhotoUrl) => {
          setPhotoUrl(nextPhotoUrl);
          setCropSource(null);
          setLocalError(null);
        }}
      />
    </>
  );
}

export function ProfileEditorModal({
  open,
  profile,
  mode,
  isPending = false,
  errorMessage,
  onClose,
  onSave,
  onDelete,
}: ProfileEditorModalProps) {
  const messages = useAppMessages();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(profile?.name ?? "");
  const [age, setAge] = useState(profile?.age ?? 5);
  const [avatar, setAvatar] = useState(profile?.avatar ?? boardAvatarChoices[0]);
  const [photoUrl, setPhotoUrl] = useState<string | null>(profile?.photoUrl ?? null);
  const [cropSource, setCropSource] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  return (
    <>
      {cropSource === null ? (
        <OverlayModalShell
          open={open}
          onClose={onClose}
          overlayClassName="z-[115]"
          panelClassName="relative flex w-full max-w-lg flex-row gap-6 rounded-3xl p-6"
        >
          <div className="flex w-1/3 flex-col items-center justify-center gap-4">
            <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/10 text-4xl shadow-lg">
              <ProfileAvatar
                avatar={avatar}
                photoUrl={photoUrl}
                alt={name || messages.profile.defaultName}
                emojiClassName="text-4xl"
              />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.currentTarget.value = "";

                if (!file) {
                  return;
                }

                try {
                  validatePhotoFile(
                    file,
                    messages.profile.imageInvalid,
                    messages.profile.imageTooLarge,
                  );
                  setCropSource(await readImageFileAsDataUrl(file));
                  setLocalError(null);
                } catch (error) {
                  setLocalError(
                    error instanceof Error ? error.message : messages.profile.imageInvalid,
                  );
                }
              }}
            />
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ImageIcon className="h-3.5 w-3.5" />
                <span>{messages.profile.photoButton}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col">
            <h3 className="mb-4 text-lg font-bold">{messages.profile.profileTitle}</h3>
            <div className="mb-4 space-y-4">
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder={messages.profile.namePlaceholder}
                className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-center font-bold outline-none focus:border-[#ec4899]"
              />
              <div className="flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/10 p-2">
                <span className="mr-2 text-sm text-white/50">{messages.profile.ageLabel} :</span>
                <button
                  type="button"
                  onClick={() => setAge((current) => Math.max(2, current - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  -
                </button>
                <input
                  type="number"
                  min={2}
                  max={12}
                  value={age}
                  onChange={(event) =>
                    setAge(Math.min(12, Math.max(2, Number(event.target.value) || 2)))
                  }
                  className="w-12 bg-transparent text-center font-bold outline-none"
                />
                <button
                  type="button"
                  onClick={() => setAge((current) => Math.min(12, current + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  +
                </button>
              </div>
            </div>
            <p className="mb-2 text-center text-xs font-bold uppercase text-white/50">
              {messages.profile.chooseAvatarLabel}
            </p>
            <div className="mb-6 grid h-28 grid-cols-6 gap-3 overflow-y-auto rounded-xl bg-white/10 p-2 justify-items-center">
              {boardAvatarChoices.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => {
                    setAvatar(choice);
                    setPhotoUrl(null);
                  }}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full text-xl transition-all duration-200",
                    avatar === choice
                      ? "scale-110 bg-[#ec4899] text-white ring-2 ring-white shadow-lg"
                      : "bg-white/10 text-white/70 hover:bg-white/20",
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
            {errorMessage || localError ? (
              <p className="mb-4 rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage ?? localError}
              </p>
            ) : null}
            <div className="mt-auto flex gap-3">
              {mode === "edit" && onDelete ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={onDelete}
                  className="rounded-xl bg-red-500/20 px-4 py-3 text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={messages.profile.deleteProfile}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
              <button
                type="button"
                disabled={isPending}
                onClick={() =>
                  onSave({
                    id: profile?.id,
                    name: name.trim(),
                    age,
                    avatar,
                    photoUrl,
                    headline: messages.profile.defaultHeadline(age),
                  })
                }
                className="flex-1 rounded-xl bg-[linear-gradient(90deg,#ec4899,#f97316)] py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? messages.profile.savingProfile : messages.profile.saveProfile}
              </button>
            </div>
          </div>
        </OverlayModalShell>
      ) : null}

      <ProfilePhotoCropperModal
        key={cropSource ?? `empty-editor-photo-${mode}`}
        open={cropSource !== null}
        sourceUrl={cropSource}
        pending={isPending}
        onClose={() => setCropSource(null)}
        onConfirm={async (nextPhotoUrl) => {
          setPhotoUrl(nextPhotoUrl);
          setCropSource(null);
        }}
      />
    </>
  );
}
