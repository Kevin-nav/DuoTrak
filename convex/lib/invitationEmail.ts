type InvitationEmailParams = {
  senderName: string;
  receiverName: string;
  acceptUrl: string;
  customMessage?: string;
  expiresInDays?: number;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const defaultBodyCopy = `You've been invited to team up on DuoTrak!

DuoTrak is a revolutionary new app designed to help partners like you achieve their goals together. It's all about teamwork, motivation, and celebrating your wins, big and small.

Ready to join forces and make amazing things happen? We can't wait to see what you'll accomplish together.`;

const emailShell = (subject: string, body: string): string => `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8f4ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#2f2a25;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;background-color:#f8f4ef;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #e5d6c9;border-radius:16px;overflow:hidden;">
            ${body}
          </table>
          <p style="margin:14px 0 0 0;font-size:12px;color:#8f7c6c;">&copy; 2026 DuoTrak. Let&apos;s achieve more, together.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export const renderPartnerInvitationEmail = (
  params: InvitationEmailParams
): { subject: string; html: string } => {
  const senderName = escapeHtml(params.senderName);
  const receiverName = escapeHtml(params.receiverName);
  const safeUrl = escapeHtml(params.acceptUrl);
  const expiresInDays = params.expiresInDays ?? 7;

  const customMessageSection = params.customMessage?.trim()
    ? `<p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;color:#5e4e42;"><strong>A message from ${senderName}:</strong></p>
       <blockquote style="margin:0 0 16px 0;padding:10px 12px;border-left:4px solid #cfb7a1;background:#fbf7f2;color:#5e4e42;font-size:14px;line-height:1.6;">
         ${escapeHtml(params.customMessage.trim())}
       </blockquote>
       <hr style="border:none;border-top:1px solid #eee2d5;margin:14px 0 18px 0;" />`
    : "";

  const defaultBody = escapeHtml(defaultBodyCopy).replace(/\n/g, "<br/>");
  const subject = `You're invited to team up with ${params.senderName} on DuoTrak!`;

  const html = emailShell(
    subject,
    `<tr>
      <td style="padding:16px 20px;background:#2f2a25;color:#f8f4ef;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:18px;font-weight:700;">DuoTrak Invitation</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:24px 22px;">
        <h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.2;color:#2f2a25;">You&apos;re invited to join DuoTrak!</h1>
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#5e4e42;">Hi ${receiverName},</p>
        ${customMessageSection}
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#5e4e42;">${defaultBody}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:22px 0 16px;">
          <tr>
            <td align="center">
              <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;background:#2f2a25;color:#f8f4ef;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                Accept Invitation &amp; Join DuoTrak
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0 0 10px 0;font-size:13px;color:#7d6a5b;text-align:center;">This invitation is valid for ${expiresInDays} days.</p>
        <p style="margin:0;font-size:13px;color:#7d6a5b;">If you were not expecting this, you can safely ignore this email.</p>
      </td>
    </tr>`
  );

  return { subject, html };
};

export const renderPartnerNudgeEmail = (
  params: InvitationEmailParams
): { subject: string; html: string } => {
  const senderName = escapeHtml(params.senderName);
  const receiverName = escapeHtml(params.receiverName);
  const safeUrl = escapeHtml(params.acceptUrl);
  const subject = `Reminder: ${params.senderName} invited you on DuoTrak`;

  const html = emailShell(
    subject,
    `<tr>
      <td style="padding:16px 20px;background:#2f2a25;color:#f8f4ef;font-size:18px;font-weight:700;">
        DuoTrak Reminder
      </td>
    </tr>
    <tr>
      <td style="padding:24px 22px;">
        <h1 style="margin:0 0 14px 0;font-size:24px;line-height:1.2;color:#2f2a25;">A quick reminder for you</h1>
        <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#5e4e42;">Hi ${receiverName},</p>
        <p style="margin:0 0 18px 0;font-size:14px;line-height:1.7;color:#5e4e42;">
          ${senderName} is waiting for you to join them on DuoTrak. Accept the invitation to start your shared goals together.
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:22px 0 16px;">
          <tr>
            <td align="center">
              <a href="${safeUrl}" style="display:inline-block;padding:13px 20px;background:#2f2a25;color:#f8f4ef;text-decoration:none;border-radius:10px;font-weight:700;font-size:14px;">
                Accept Invitation &amp; Join DuoTrak
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`
  );

  return { subject, html };
};
