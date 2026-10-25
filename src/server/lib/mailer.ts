import nodemailer, { type Transporter } from "nodemailer";
import { env } from "../env";

export interface Mailer {
  send(msg: { to: string; subject: string; text: string; html: string }): Promise<void>;
}

let transport: Transporter | undefined;

/** SMTP mailer (Mailpit locally; any SMTP provider in production). */
export function getMailer(): Mailer {
  const e = env();
  transport ??= nodemailer.createTransport({
    host: e.SMTP_HOST,
    port: e.SMTP_PORT,
    secure: e.SMTP_SECURE,
    auth: e.SMTP_USER ? { user: e.SMTP_USER, pass: e.SMTP_PASSWORD } : undefined,
  });
  return {
    async send(msg) {
      await transport!.sendMail({ from: e.EMAIL_FROM, ...msg });
    },
  };
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Plain, high-contrast sign-in email that renders well in any client. */
export function magicLinkEmail(url: string): { subject: string; text: string; html: string } {
  const subject = "Your TukTrail sign-in link";
  const text = `Sign in to TukTrail:\n\n${url}\n\nThis link expires in 5 minutes and can be used once. If you didn't ask for it, you can ignore this email.`;
  const safe = escapeHtml(url);
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F4ECDD;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1F1A15">
<table role="presentation" width="100%" style="max-width:480px;margin:0 auto;background:#FFFBF4;border:2px solid #D8CAB3;border-radius:16px">
<tr><td style="padding:28px">
<p style="margin:0 0 4px;font-size:22px;font-weight:700">Tuk<span style="color:#9A3B1F">Trail</span></p>
<h1 style="margin:16px 0 8px;font-size:22px">Sign in to TukTrail</h1>
<p style="margin:0 0 24px;font-size:16px;line-height:1.5">Tap the button below to sign in. The link expires in 5 minutes and works once.</p>
<p style="margin:0 0 24px"><a href="${safe}" style="display:inline-block;background:#9A3B1F;color:#FFFBF4;text-decoration:none;font-weight:700;font-size:17px;padding:14px 22px;border-radius:10px">Sign in</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#5A4F44">If the button doesn't work, copy this link into your browser:<br><span style="word-break:break-all">${safe}</span></p>
<p style="margin:16px 0 0;font-size:13px;color:#5A4F44">Didn't ask for this? You can ignore this email.</p>
</td></tr></table></body></html>`;
  return { subject, text, html };
}
