import baseEmailTemplate from "./baseEmailTemplate.js";

export const paymentFailureEmail = (name, planName, amount, orderId) => {
    const body = `
        <p>Dear ${name},</p>
        <p>We regret to inform you that your payment for the <strong>${planName}</strong> plan subscription has failed.</p>
        <br>
        <p><strong>Payment Details:</strong></p>
        <ul>
            <li><strong>Plan:</strong> ${planName}</li>
            <li><strong>Amount:</strong> ₹${amount}</li>
            <li><strong>Order ID:</strong> ${orderId}</li>
        </ul>
        <br>
        <p>This could be due to:</p>
        <ul>
            <li>Insufficient funds in your account</li>
            <li>Incorrect card details</li>
            <li>Network connectivity issues</li>
            <li>Bank authorization failure</li>
        </ul>
        <br>
        <p>Please try again with a different payment method or contact your bank for assistance.</p>
        <br>
        <p>If you believe this is an error or need assistance, please don't hesitate to reach out to our support team at <a href="mailto:support@zelbi.ai">support@zelbi.ai</a>.</p>
    `;

    return baseEmailTemplate({
        title: "Payment Failed - Zelbi AI",
        brandName: "Zelbi AI",
        eyebrow: "Subscription Payment",
        heading: "Payment Failed",
        body: body,
        ctaText: "Try Again",
        ctaUrl: "https://zelbi.ai/subscription",
        ctaBackground: "#EF4444",
        footerNote: "Your subscription has not been activated. Please complete the payment to access premium features.",
    });
};