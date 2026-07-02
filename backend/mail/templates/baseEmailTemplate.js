const baseEmailTemplate = ({
  title,
  brandName = "Zelbi AI",
  eyebrow = "",
  heading,
  body,
  ctaText,
  ctaUrl,
  ctaBackground = "#4F46E5",
  footerNote = "If you did not request this email, you can safely ignore it.",
}) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb;padding:20px 10px;">
    <tr>
      <td align="center">
        <table width="420" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#4F46E5;padding:25px 20px;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;">${brandName}</h1>
              ${eyebrow ? `<p style="margin:8px 0 0;color:#e0e7ff;font-size:14px;">${eyebrow}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:30px;">
              <h2 style="margin:0 0 20px;text-align:center;color:#111827;font-size:24px;">${heading}</h2>
              <div style="color:#4b5563;font-size:15px;line-height:1.7;">
                ${body}
              </div>
              ${ctaText && ctaUrl ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:25px;">
                <tr>
                  <td align="center">
                    <a href="${ctaUrl}" style="background:${ctaBackground};color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:700;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>` : ""}
            </td>
          </tr>
          <tr>
            <td style="border-top:1px solid #e5e7eb;background:#fafafa;padding:20px;text-align:center;">
              <p style="margin:0;color:#6b7280;font-size:13px;">${footerNote}</p>
              <p style="margin:8px 0 0;">
                <a href="mailto:support@zelbi.ai" style="color:#4F46E5;text-decoration:none;font-size:13px;">support@zelbi.ai</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export default baseEmailTemplate;