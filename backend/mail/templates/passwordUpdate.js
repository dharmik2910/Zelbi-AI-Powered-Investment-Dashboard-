import baseEmailTemplate from "./baseEmailTemplate.js";

const passwordUpdated = (email, name) => {
    return baseEmailTemplate({
        title: "Password Update Confirmation",
        eyebrow: "Account Security Update",
        heading: "Password Update Confirmation",
        body: `
            <p style="margin:0 0 15px;">Hey ${name},</p>
            <p style="margin:0 0 15px;">Your password has been successfully updated for the email <strong>${email}</strong>.</p>
            <p style="margin:0;">If you did not request this password change, please contact us immediately to secure your account.</p>
        `,
        footerNote: "If you have any questions or need help, reply to this email.",
    });
};

export default passwordUpdated;