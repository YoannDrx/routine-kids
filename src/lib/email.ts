import "server-only";

import { Resend } from "resend";

export function isTransactionalEmailConfigured() {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim(),
  );
}

export function assertProductionEmailConfiguration() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  // Vercel Preview builds intentionally run with NODE_ENV=production but do not
  // receive Production-only delivery credentials. Keep the hard gate for the
  // actual Production deployment and for local production verification.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return;
  }

  if (!isTransactionalEmailConfigured()) {
    throw new Error(
      "RESEND_API_KEY and EMAIL_FROM must be configured in production.",
    );
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendRoutineKidsAuthEmail(input: {
  kind: "verify-email" | "reset-password";
  to: string;
  name: string;
  url: string;
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    throw new Error("Transactional email is not configured.");
  }

  const isVerification = input.kind === "verify-email";
  const subject = isVerification
    ? "Confirmez votre adresse RoutineKids"
    : "Réinitialisez votre mot de passe RoutineKids";
  const heading = isVerification
    ? "Confirmez votre adresse email"
    : "Choisissez un nouveau mot de passe";
  const action = isVerification
    ? "Confirmer mon adresse"
    : "Réinitialiser mon mot de passe";
  const safeName = escapeHtml(input.name || "parent");
  const safeUrl = escapeHtml(input.url);

  const { error } = await new Resend(apiKey).emails.send({
    from,
    to: input.to,
    subject,
    text: `${heading}\n\n${input.url}\n\nCe lien expire dans une heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.`,
    html: `<!doctype html>
      <html lang="fr">
        <body style="margin:0;background:#120d2b;color:#ffffff;font-family:Arial,sans-serif">
          <div style="max-width:560px;margin:0 auto;padding:40px 20px">
            <p style="color:#8fd8ff;font-weight:700;letter-spacing:.12em;text-transform:uppercase">RoutineKids</p>
            <h1 style="font-size:28px;line-height:1.2">${heading}</h1>
            <p style="color:#d8d3e8;line-height:1.6">Bonjour ${safeName}, ce lien sécurisé expire dans une heure.</p>
            <p style="margin:32px 0"><a href="${safeUrl}" style="display:inline-block;border-radius:16px;background:#ff6fb5;color:#fff;padding:15px 22px;text-decoration:none;font-weight:700">${action}</a></p>
            <p style="color:#9d96b6;font-size:13px;line-height:1.6">Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email.</p>
          </div>
        </body>
      </html>`,
  });

  if (error) {
    throw new Error(`Resend rejected the authentication email: ${error.message}`);
  }
}
