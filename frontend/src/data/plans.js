// Keep in sync with backend/config/plans.js, which enforces prices and limits.
export const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    promptLimit: 5,
    description: "Explore the core features and get a feel for the platform.",
    buttonText: "Get Started",
    features: [
      "5 AI prompts per month",
      "Basic market insights",
      "Dashboard access",
      "Tax calculator",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 499,
    yearlyPrice: 349,
    promptLimit: 100,
    description: "Everything you need to trade smarter and stay ahead of the market.",
    popular: true,
    features: [
      "Everything in Free",
      "100 AI prompts per month",
      "Advanced market analysis",
      "Portfolio tracking",
      "Priority support",
    ],
  },
  {
    id: "elite",
    name: "Elite",
    monthlyPrice: 999,
    yearlyPrice: 699,
    promptLimit: Infinity,
    description: "Best value for power traders who need unlimited AI intelligence.",
    features: [
      "All Pro features",
      "Unlimited AI prompts",
      "Real-time AI insights",
      "Custom trading strategies",
      "Dedicated support",
    ],
  },
];

// Monthly AI prompt limit for a plan id (Infinity for unlimited)
export const getPromptLimit = (planId) =>
  (PLANS.find((plan) => plan.id === planId) ?? PLANS[0]).promptLimit;
