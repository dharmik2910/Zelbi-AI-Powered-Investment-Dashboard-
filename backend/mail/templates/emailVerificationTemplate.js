const otpTemplate = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zelbi AI Verification</title>
</head>

<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f7fb;padding:20px 10px;">
<tr>
<td align="center">

<!-- Main Container -->
<table width="420" cellpadding="0" cellspacing="0" border="0"
style="background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">

  <!-- Header -->
  <tr>
    <td align="center"
      style="background:#4F46E5;padding:25px 20px;">

      <h1 style="
        margin:0;
        color:#ffffff;
        font-size:28px;
        font-weight:700;">
        Zelbi AI
      </h1>

      <p style="
        margin:8px 0 0;
        color:#e0e7ff;
        font-size:14px;">
        Secure Account Verification
      </p>

    </td>
  </tr>

  <!-- Content -->
  <tr>
    <td style="padding:30px;">

      <h2 style="
        margin:0 0 20px;
        text-align:center;
        color:#111827;
        font-size:24px;">
        Verify Your Email
      </h2>

      <p style="
        margin:0 0 15px;
        color:#4b5563;
        font-size:15px;">
        Hello,
      </p>

      <p style="
        margin:0 0 20px;
        color:#4b5563;
        font-size:15px;
        line-height:1.6;">
        Thank you for signing up with
        <strong>Zelbi AI</strong>.
        Use the verification code below to complete your registration.
      </p>

      <!-- OTP Box -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:15px 0 25px;">

            <div style="
              display:inline-block;
              background:#eef2ff;
              border:2px solid #4F46E5;
              border-radius:10px;
              padding:15px 30px;
              color:#4F46E5;
              font-size:32px;
              font-weight:bold;
              letter-spacing:8px;">
              ${otp}
            </div>

          </td>
        </tr>
      </table>

      <p style="
        text-align:center;
        color:#6b7280;
        font-size:14px;
        margin:0 0 20px;">
        This OTP is valid for
        <strong>5 minutes</strong>.
      </p>

      <p style="
        color:#4b5563;
        font-size:14px;
        line-height:1.6;
        margin:0;">
        If you did not request this verification code,
        you can safely ignore this email.
      </p>

    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="
      border-top:1px solid #e5e7eb;
      background:#fafafa;
      padding:20px;
      text-align:center;">

      <p style="
        margin:0;
        color:#6b7280;
        font-size:13px;">
        Need help?
      </p>

      <p style="margin:8px 0;">
        <a href="mailto:support@zelbi.ai"
          style="
          color:#4F46E5;
          text-decoration:none;
          font-size:13px;">
          support@zelbi.ai
        </a>
      </p>

      <p style="
        margin:0;
        color:#9ca3af;
        font-size:12px;">
        © 2026 Zelbi AI. All rights reserved.
      </p>

    </td>
  </tr>

</table>
<!-- End Container -->

</td>
</tr>
</table>

</body>
</html>
`;
};

export default otpTemplate;