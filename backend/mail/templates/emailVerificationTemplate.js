import baseEmailTemplate from "./baseEmailTemplate.js";

const otpTemplate = (otp) => {
  return baseEmailTemplate({
    title: "Zelbi AI Verification",
    eyebrow: "Secure Account Verification",
    heading: "Verify Your Email",
    body: `
      <p style="margin:0 0 15px;color:#4b5563;font-size:15px;">Hello,</p>
      <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.6;">
        Thank you for signing up with <strong>Zelbi AI</strong>. Use the verification code below to complete your registration.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:15px 0 25px;">
            <div style="display:inline-block;background:#eef2ff;border:2px solid #4F46E5;border-radius:10px;padding:15px 30px;color:#4F46E5;font-size:32px;font-weight:bold;letter-spacing:8px;">${otp}</div>
          </td>
        </tr>
      </table>
      <p style="text-align:center;color:#6b7280;font-size:14px;margin:0 0 20px;">This OTP is valid for <strong>5 minutes</strong>.</p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6;margin:0;">If you did not request this verification code, you can safely ignore this email.</p>
    `,
    footerNote: "Need help? Reach out if you did not request this code.",
  });
};

export default otpTemplate;