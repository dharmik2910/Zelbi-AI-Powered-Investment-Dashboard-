import axios from "axios";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { HiSparkles } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setUser } from "../slices/profileSlice";
import PricingCards from "../components/PricingCards";
import { PLANS } from "../data/plans";

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

  const currentPlan = user ? (user.subscriptionPlan || "free") : null;
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [successPlan, setSuccessPlan] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "Zelbi | Pricing";
    return () => { document.title = "Zelbi"; };
  }, []);

  const handleUpgrade = async (planId, billingCycle = "monthly") => {
    if (!token) { navigate("/login"); return; }
    if (planId === currentPlan) return;
    setLoadingPlan(planId);
    setError(null);
    try {
      // For free plan, just call upgrade API directly
      if (planId === "free") {
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/subscription/upgrade`,
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
        `${process.env.REACT_APP_API_URL}/api/subscription/create-razorpay-order`,
        { plan: planId, billingCycle },
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
              `${process.env.REACT_APP_API_URL}/api/subscription/verify-razorpay-payment`,
              {
                plan: planId,
                billingCycle,
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

  return (
    <section
      style={{ minHeight: "100vh", backgroundColor: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "96px 16px 80px" }}
    >
      {/* Heading */}
      <h1 style={{ fontSize: "clamp(28px, 5vw, 42px)", fontWeight: 500, color: "#fff", textAlign: "center", margin: 0 }}>
        Simple &amp; affordable pricing
      </h1>
      <p style={{ fontSize: 15, color: "#a1a1aa", textAlign: "center", marginTop: 4, maxWidth: 380 }}>
        Pick a plan that matches your workflow today and scale anytime as you grow.
      </p>



      <PricingCards
        currentPlan={currentPlan}
        loadingPlan={loadingPlan}
        onPlanClick={handleUpgrade}
        showHeading={false}
        showViewAllButton={false}
      />
   
      {/* Error */ }
  {
    error && (
      <motion.p
        style={{ color: "#f87171", textAlign: "center", marginTop: 24, fontSize: 13 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {error}
      </motion.p>
    )
  }

  {/* Footer note */ }
  <p style={{ color: "#52525b", fontSize: 12, textAlign: "center", marginTop: 40 }}>
    🔒 Prompt count resets when you upgrade. Cancel or change plans anytime.
  </p>

  {/* Spinner keyframes */ }
  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

  {/* Success modal */ }
  {
    successPlan && (
      <SuccessModal
        plan={successPlan}
        onClose={() => { setSuccessPlan(null); navigate("/ai-assistant"); }}
      />
    )
  }
    </section >
  );
};

export default Pricing;
