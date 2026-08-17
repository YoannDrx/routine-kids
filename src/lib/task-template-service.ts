import "server-only";

import { type AppLocale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { getServerCopy } from "@/lib/server-copy";

type UpsertTaskTemplateInput = {
  householdId: string;
  actorUserId: string;
  templateId?: string;
  title: string;
  shortLabel: string;
  icon: string;
  imageUrl?: string | null;
  color?: string | null;
  durationMinutes: number;
  locale?: AppLocale;
};

async function ensureOwnedTemplate(
  householdId: string,
  templateId: string,
  locale: AppLocale = "fr",
) {
  const template = await prisma.taskTemplate.findFirst({
    where: {
      id: templateId,
      householdId,
    },
    select: {
      id: true,
      title: true,
      isBuiltIn: true,
      imageUrl: true,
    },
  });

  if (!template) {
    throw new Error(getServerCopy(locale).validation.templateNotFound);
  }

  return template;
}

export async function upsertTaskTemplate(
  input: UpsertTaskTemplateInput,
) {
  if (input.templateId) {
    const existingTemplate = await ensureOwnedTemplate(
      input.householdId,
      input.templateId,
      input.locale,
    );

    const updatedTemplate = await prisma.$transaction(async (tx) => {
      const updated = await tx.taskTemplate.update({
        where: {
          id: existingTemplate.id,
        },
        data: {
          title: input.title,
          shortLabel: input.shortLabel,
          icon: input.icon,
          imageUrl: input.imageUrl,
          color: input.color,
          durationMinutes: input.durationMinutes,
        },
        select: {
          id: true,
          title: true,
        },
      });

      await tx.adminAuditLog.create({
        data: {
          householdId: input.householdId,
          actorUserId: input.actorUserId,
          action: "TASK_TEMPLATE_UPDATED",
          targetType: "TaskTemplate",
          targetId: updated.id,
          metadata: {
            previousTitle: existingTemplate.title,
            title: updated.title,
          },
        },
      });

      return updated;
    });

    return {
      id: updatedTemplate.id,
      title: updatedTemplate.title,
      created: false,
      previousImageUrl: existingTemplate.imageUrl,
    };
  }

  const createdTemplate = await prisma.$transaction(async (tx) => {
    const created = await tx.taskTemplate.create({
      data: {
        householdId: input.householdId,
        title: input.title,
        shortLabel: input.shortLabel,
        icon: input.icon,
        imageUrl: input.imageUrl ?? null,
        color: input.color ?? null,
        durationMinutes: input.durationMinutes,
        autoAssignEnabled: true,
        isBuiltIn: false,
      },
      select: {
        id: true,
        title: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "TASK_TEMPLATE_CREATED",
        targetType: "TaskTemplate",
        targetId: created.id,
        metadata: {
          title: created.title,
        },
      },
    });

    return created;
  });

  return {
    id: createdTemplate.id,
    title: createdTemplate.title,
    created: true,
    previousImageUrl: null,
  };
}

export async function deleteTaskTemplate(input: {
  householdId: string;
  actorUserId: string;
  templateId: string;
  locale?: AppLocale;
}) {
  const template = await ensureOwnedTemplate(
    input.householdId,
    input.templateId,
    input.locale,
  );

  if (template.isBuiltIn) {
    throw new Error(getServerCopy(input.locale ?? "fr").actions.taskTemplateDeleteProtected);
  }

  await prisma.$transaction([
    prisma.taskTemplate.delete({
      where: {
        id: template.id,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        householdId: input.householdId,
        actorUserId: input.actorUserId,
        action: "TASK_TEMPLATE_DELETED",
        targetType: "TaskTemplate",
        targetId: template.id,
        metadata: {
          title: template.title,
        },
      },
    }),
  ]);

  return {
    id: template.id,
    title: template.title,
    previousImageUrl: template.imageUrl,
  };
}
