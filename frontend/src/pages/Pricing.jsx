import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../slices/profileSlice";

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const existingScript = document.getElementById("razorpay-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.id = "razorpay-script";
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    } else {
      resolve(true);
    }
  });
};

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#a)" stroke="#3affa3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 12.83A5.833 5.833 0 1 0 7 1.165a5.833 5.833 0 0 0 0 11.667" />
      <path d="m5.25 7.003 1.167 1.166L8.75 5.836" />
    </g>
    <defs>
      <clipPath id="a">
        <path fill="#fff" d="M0 0h14v14H0z" />
      </clipPath>
    </defs>
  </svg>
);

const PLANS = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "/month",
    description: "Explore the core features and get a feel for the platform.",
    buttonText: "Get Started Free",
    popular: false,
    pro: false,
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
    priceLabel: "/month",
    description: "Everything you need to trade smarter and stay ahead of the market.",
    buttonText: "Upgrade to Pro",
    popular: true,
    pro: true,
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
    priceLabel: "/month",
    description: "Best value for power traders who need unlimited AI intelligence.",
    buttonText: "Get Elite Access",
    popular: false,
    pro: false,
    features: [
      "All Pro features",
      "Unlimited AI prompts",
      "Real-time AI insights",
      "Custom trading strategies",
      "Dedicated support",
    ],
  },
];

const SuccessModal = ({ plan, onClose }) => (
  <AnimatePresence>
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        style={{
          backgroundColor: "#0d0d0d",
          border: "1px solid rgba(58,255,163,0.3)",
          borderRadius: "16px",
          padding: "40px",
          maxWidth: "360px",
          width: "100%",
          margin: "0 16px",
          textAlign: "center",
          boxShadow: "0 0 50px rgba(58,255,163,0.1)",
        }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <motion.div
          style={{
            width: 64, height: 64, borderRadius: "50%",
            backgroundColor: "rgba(58,255,163,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
          }}
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ repeat: 2, duration: 0.4 }}
        >
          <HiSparkles style={{ fontSize: 28, color: "#3affa3" }} />
        </motion.div>
        <h3 style={{ fontSize: 20, fontWeight: 600, color: "#fff", marginBottom: 8 }}>
          Welcome to <span style={{ color: "#3affa3" }}>{plan}</span>!
        </h3>
        <p style={{ color: "#a1a1aa", fontSize: 14, marginBottom: 28 }}>
          Your plan has been activated. Enjoy AI-powered trading insights.
        </p>
        <button
          onClick={onClose}
          style={{
            width: "100%", backgroundColor: "#3affa3", color: "#000",
            fontWeight: 700, padding: "10px 0", borderRadius: 10,
            fontSize: 14, cursor: "pointer", border: "none",
            transition: "background 0.2s",
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = "#2de88f"}
          onMouseLeave={(e) => e.target.style.backgroundColor = "#3affa3"}
        >
          Start Using AI
        </button>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

const Pricing = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.profile);
  const { token } = useSelector((state) => state.auth);

  const currentPlan = user?.subscriptionPlan || "free";
  const [yearly, setYearly] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Zelbi | Pricing";
    return () => { document.title = "Zelbi"; };
  }, []);

  const handleUpgrade = async (planId) => {
    if (!token) { navigate("/login"); return; }
    if (planId === currentPlan) return;
    setLoadingPlan(planId);
    setError(null);
    try {
      // For free plan, just call upgrade API directly
      if (planId === "free") {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/subscription/upgrade`,
          { plan: planId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { subscriptionPlan, subscriptionExpiry, aiPromptCount } = response.data;
        const updatedUser = { ...user, subscriptionPlan, subscriptionExpiry, aiPromptCount };
        dispatch(setUser(updatedUser));
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setSuccessPlan(PLANS.find((p) => p.id === planId)?.name);
        return;
      }

      // Paid plan: create Razorpay order first
      const orderRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/subscription/create-razorpay-order`,
        { plan: planId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { order_id, amount, currency, key_id } = orderRes.data;

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      const options = {
        key: key_id,
        amount: amount,
        currency: currency,
        name: "Zelbi AI",
        description: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan Upgrade`,
        order_id: order_id,
        handler: async function (response) {
          // Verify payment on backend and finalize upgrade
          try {
            const verifyRes = await axios.post(
              `${process.env.REACT_APP_API_URL}/subscription/verify-razorpay-payment`,
              {
                plan: planId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const { subscriptionPlan, subscriptionExpiry, aiPromptCount } = verifyRes.data;
            const updatedUser = { ...user, subscriptionPlan, subscriptionExpiry, aiPromptCount };
            dispatch(setUser(updatedUser));
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setSuccessPlan(PLANS.find((p) => p.id === planId)?.name);
          } catch (verifyErr) {
            setError(verifyErr.response?.data?.error || "Payment verification failed.");
          }
        },
        prefill: {
          email: user?.email || "",
          name: user?.name || "",
        },
        theme: { color: "#3affa3" },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to upgrade. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };
  const planRank = { free: 0, pro: 1, elite: 2 };
  const isActive = (id) => currentPlan === id;
  const isDowngrade = (id) => planRank[id] < planRank[currentPlan];

  return (
    <section
      style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 16px 80px" }}
    >
      {/* Heading */}
      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 500, color: "#fff", textAlign: "center", margin: 0 }}>
        Simple &amp; affordable pricing
      </h1>
      <p style={{ fontSize: 15, color: "#a1a1aa", textAlign: "center", marginTop: 12, maxWidth: 380 }}>
        Pick a plan that matches your workflow today and scale anytime as you grow.
      </p>

      {/* Toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 32 }}>
        <span style={{ fontSize: 14, color: "#fff" }}>Monthly</span>
        <button
          id="billing-toggle"
          onClick={() => setYearly((v) => !v)}
          style={{
            width: 44, height: 24, borderRadius: 999, padding: 2,
            backgroundColor: yearly ? "#3affa3" : "transparent",
            border: yearly ? "none" : "1px solid #3f3f46",
            cursor: "pointer", transition: "background 0.3s",
            display: "flex", alignItems: "center",
          }}
        >
          <div
            style={{
              width: 16, height: 16, borderRadius: "50%",
              backgroundColor: yearly ? "#000" : "#fff",
              transform: yearly ? "translateX(20px)" : "translateX(0)",
              transition: "transform 0.3s, background 0.3s",
            }}
          />
        </button>
        <span style={{ fontSize: 14, color: "#fff" }}>Yearly</span>
        <span style={{ fontSize: 11, backgroundColor: "#D9D9D9", color: "#000", padding: "3px 10px", borderRadius: 999, fontWeight: 600 }}>
          30% OFF
        </span>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "stretch", justifyContent: "center", gap: 24, width: "100%", maxWidth: 1000, marginTop: 40 }}>
        {PLANS.map((plan, idx) => {
          const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
          const active = isActive(plan.id);
          const downgrade = isDowngrade(plan.id);
          const loading = loadingPlan === plan.id;

          return (
            <motion.div
              key={plan.id}
              style={{
                backgroundColor: plan.pro ? "#0a0a0a" : "#000",
                border: "1px solid #27272a",
                borderRadius: 12,
                padding: 24,
                flex: "1 1 240px",
                maxWidth: 320,
                display: "flex",
                flexDirection: "column",
                transition: "border-color 0.2s",
              }}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "#3f3f46"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "#27272a"}
            >
              {/* Name + badges */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>{plan.name}</span>
                <div style={{ display: "flex", gap: 6 }}>
                  {active && (
                    <span style={{ fontSize: 11, color: "#3affa3", border: "1px solid rgba(58,255,163,0.3)", padding: "3px 8px", borderRadius: 999 }}>
                      Active
                    </span>
                  )}
                  {plan.popular && !active && (
                    <span style={{ fontSize: 11, color: "#fff", border: "1px solid #3f3f46", padding: "3px 8px", borderRadius: 999 }}>
                      Popular
                    </span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 20 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
                  {price === 0 ? "Free" : `₹${price}`}
                </span>
                {price !== 0 && (
                  <span style={{ fontSize: 12, color: "#71717a" }}>{plan.priceLabel}</span>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: "#a1a1aa", marginTop: 14, lineHeight: 1.6 }}>
                {plan.description}
              </p>

              {/* CTA button */}
              <button
                id={`plan-btn-${plan.id}`}
                onClick={() => handleUpgrade(plan.id)}
                disabled={active || loading}
                style={{
                  width: "100%",
                  marginTop: 20,
                  padding: "10px 0",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: active || downgrade ? "default" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.2s, opacity 0.2s",
                  opacity: downgrade ? 0.4 : 1,
                  ...(active
                    ? { background: "transparent", border: "1px solid #3f3f46", color: "#71717a" }
                    : plan.pro
                    ? { background: "#3affa3", border: "none", color: "#000" }
                    : { background: "transparent", border: "1px solid #3f3f46", color: "#fff" }
                  ),
                }}
                onMouseEnter={(e) => {
                  if (!active && !downgrade) {
                    e.currentTarget.style.opacity = "0.85";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active && !downgrade) {
                    e.currentTarget.style.opacity = "1";
                  }
                }}
              >
                {loading ? (
                  <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.3)", borderTopColor: "#000", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                ) : active ? "Current Plan" : downgrade ? "Free Plan" : plan.buttonText}
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 28 }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "#27272a" }} />
                <span style={{ fontSize: 13, fontWeight: 500, color: "#d4d4d8" }}>Features</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "#27272a" }} />
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16, flex: 1 }}>
                {plan.features.map((feature, fi) => (
                  <div key={fi} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <CheckIcon />
                    <span style={{ fontSize: 13, color: "#d4d4d8" }}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          style={{ color: "#f87171", textAlign: "center", marginTop: 24, fontSize: 13 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      {/* Footer note */}
      <p style={{ color: "#52525b", fontSize: 12, textAlign: "center", marginTop: 40 }}>
        🔒 Prompt count resets when you upgrade. Cancel or change plans anytime.
      </p>

      {/* Spinner keyframes */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Success modal */}
      {successPlan && (
        <SuccessModal
          plan={successPlan}
          onClose={() => { setSuccessPlan(null); navigate("/ai"); }}
        />
      )}
    </section>
  );
};

export default Pricing;
