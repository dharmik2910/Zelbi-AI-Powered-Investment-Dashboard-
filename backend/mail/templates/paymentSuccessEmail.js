import baseEmailTemplate from "./baseEmailTemplate.js";

export const paymentSuccessEmail = (name, planName, amount, orderId, paymentId) => {
    const body = `
        <p>Dear ${name},</p>
        <p>Thank you for your payment! We have successfully received your subscription payment for the <strong>${planName}</strong> plan.</p>
        <br>
        <p><strong>Payment Details:</strong></p>
        <ul>
            <li><strong>Plan:</strong> ${planName}</li>
            <li><strong>Amount Paid:</strong> ₹${amount}</li>
            <li><strong>Payment ID:</strong> ${paymentId}</li>
            <li><strong>Order ID:</strong> ${orderId}</li>
        </ul>
        <br>
        <p>Your subscription has been activated and you can now enjoy all the premium features of the ${planName} plan.</p>
        <br>
        <p>If you have any questions or need assistance, please feel free to reach out to our support team at <a href="mailto:support@zelbi.ai">support@zelbi.ai</a>. We are here to help!</p>
    `;

    return baseEmailTemplate({
        title: "Payment Successful - Zelbi AI",
        brandName: "Zelbi AI",
        eyebrow: "Subscription Payment",
        heading: "Payment Successful! 🎉",
        body: body,
        ctaText: "Go to Dashboard",
        ctaUrl: "FRONTEND_URL/dashboard",
        ctaBackground: "#10B981",
        footerNote: "Thank you for choosing Zelbi AI. Your subscription is now active.",
    });
};
