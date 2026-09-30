// Single source of truth for plan pricing and AI prompt limits.
// Keep frontend/src/data/plans.js in sync when changing prices or limits.
export const PLANS = [
    {
        id: "free",
        name: "Free",
        price: 0,
        currency: "INR",
        promptLimit: 5,
        holdingLimit: 3,
        features: [
            "5 AI prompts per month",
            "Basic market insights",
            "Dashboard access",
            "Track up to 3 holdings",
            "Tax calculator",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        price: 499,
        yearlyPrice: 349,
        currency: "INR",
        promptLimit: 100,
        holdingLimit: Infinity,
        features: [
            "100 AI prompts per month",
            "Advanced market analysis",
            "Unlimited portfolio tracking",
            "Priority support",
            "All Free features",
        ],
    },
    {
        id: "elite",
        name: "Elite",
        price: 999,
        yearlyPrice: 699,
        currency: "INR",
        promptLimit: Infinity,
        holdingLimit: Infinity,
        features: [
            "Unlimited AI prompts",
            "Real-time AI insights",
            "Custom trading strategies",
            "Dedicated support",
            "Early access to features",
            "All Pro features",
        ],
    },
];
