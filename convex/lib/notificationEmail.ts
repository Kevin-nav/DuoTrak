const emailShell = (subject: string, body: string): string => `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f6f2ee;font-family:Arial,sans-serif;color:#2f2a25;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fff;border:1px solid #e4d7ca;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;border-bottom:1px solid #f0e8df;">
                <div style="font-size:18px;font-weight:700;color:#2f2a25;">DuoTrak</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid #f0e8df;font-size:12px;color:#7d6a5b;">
                You are receiving this because notifications are enabled in your DuoTrak account.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

export function renderNotificationEmail(params: {
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
}) {
  const subject = `DuoTrak: ${params.title}`;
  const actionCta =
    params.actionUrl && params.actionLabel
      ? `<div style="margin-top:18px;">
          <a href="${params.actionUrl}" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#2f2a25;color:#fff;text-decoration:none;font-weight:600;font-size:14px;">
            ${params.actionLabel}
          </a>
        </div>`
      : "";

  const html = emailShell(
    subject,
    `
      <h1 style="margin:0 0 10px 0;font-size:22px;line-height:1.3;color:#2f2a25;">${params.title}</h1>
      <p style="margin:0;font-size:15px;line-height:1.55;color:#4d4034;">${params.message}</p>
      ${actionCta}
    `
  );

  return { subject, html };
}

