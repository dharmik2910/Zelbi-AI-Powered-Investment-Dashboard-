import { Link } from "react-router-dom";
import { useState } from "react";
import { PLANS } from "../data/plans";

const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 14 14" fill="none"> <g stroke="#3affa3" strokeLinecap="round" strokeLinejoin="round"> <path d="M7 12.83A5.833 5.833 0 1 0 7 1.165a5.833 5.833 0 0 0 0 11.667" /> <path d="m5.25 7.003 1.167 1.166L8.75 5.836" /> </g> </svg>
);

export default function PricingCards({
    currentPlan = "free",
    loadingPlan = null,
    onPlanClick,
    showHeading = true,
    showViewAllButton = true,
}) {
    const [yearly, setYearly] = useState(false);
    const billingCycle = yearly ? "yearly" : "monthly";
    return (
        <div style={{ backgroundColor: "#000", padding: "10px 16px", position: "relative", zIndex: 40 }}>
            <div style={{ maxWidth: 1000, margin: "0 auto" }}>
                {showHeading && (
                    <>
                        <h2
                            style={{
                                color: "#fff",
                                textAlign: "center",
                                fontSize: "36px",
                                fontWeight: 700,
                                marginBottom: 16,
                            }}
                        >
                            Simple & Affordable Pricing </h2>
                        <p
                            style={{
                                color: "#a1a1aa",
                                textAlign: "center",
                                marginBottom: 48,
                            }}
                        >
                            Pick a plan that matches your workflow. Upgrade anytime as you grow.
                        </p>
                    </>
                )}

                {/* Toggle */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 20, marginTop: showHeading ? 0 : 32 }}>
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

                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "center",
                        gap: 24,
                    }}
                >
                    {PLANS.map((plan) => {
                        const active = currentPlan === plan.id;
                        const price = yearly
                            ? plan.yearlyPrice
                            : plan.monthlyPrice;
                        const priceLabel = yearly ? "/year" : "/month";

                        return (
                            <div
                                key={plan.id}
                                style={{
                                    backgroundColor: "#141414",
                                    border: active
                                        ? "1px solid #3affa3"
                                        : "1px solid #27272a",
                                    borderRadius: 12,
                                    padding: 24,
                                    flex: "1 1 240px",
                                    maxWidth: 300,
                                    display: "flex",
                                    flexDirection: "column",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: 20,
                                    }}
                                >
                                    <span
                                        style={{
                                            color: "#fff",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {plan.name}
                                    </span>

                                    {active ? (
                                        <span
                                            style={{
                                                fontSize: 11,
                                                color: "#3affa3",
                                                border: "1px solid rgba(58,255,163,0.3)",
                                                padding: "3px 8px",
                                                borderRadius: 999,
                                            }}
                                        >
                                            Active
                                        </span>
                                    ) : (
                                        plan.popular && (
                                            <span
                                                style={{
                                                    fontSize: 11,
                                                    color: "#3affa3",
                                                    border: "1px solid rgba(58,255,163,0.3)",
                                                    padding: "3px 8px",
                                                    borderRadius: 999,
                                                }}
                                            >
                                                Popular
                                            </span>
                                        )
                                    )}
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 4,
                                        marginBottom: 12,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 32,
                                            fontWeight: 700,
                                            color: "#fff",
                                        }}
                                    >
                                        {price === 0 ? "Free" : `₹${price}`}
                                    </span>

                                    {price !== 0 && (
                                        <span
                                            style={{
                                                fontSize: 12,
                                                color: "#71717a",
                                            }}
                                        >
                                            {priceLabel}
                                        </span>
                                    )}
                                </div>

                                <p
                                    style={{
                                        fontSize: 13,
                                        color: "#a1a1aa",
                                        marginBottom: 20,
                                    }}
                                >
                                    {plan.description}
                                </p>

                                {onPlanClick ? (
                                    <button
                                        disabled={active}
                                        onClick={() => onPlanClick(plan.id, billingCycle)}
                                        style={{
                                            width: "100%",
                                            padding: "10px 0",
                                            borderRadius: 8,
                                            marginBottom: 24,
                                            border: "1px solid #3affa3",
                                            backgroundColor: "#3affa3",
                                            color: "#000",
                                            cursor: active ? "default" : "pointer",
                                        }}
                                    >
                                        {loadingPlan === plan.id
                                            ? "Loading..."
                                            : active
                                                ? "Current Plan"
                                                : plan.buttonText || "Upgrade"}
                                    </button>
                                ) : (
                                    <Link to="/pricing">
                                        <button
                                            style={{
                                                width: "100%",
                                                padding: "10px 0",
                                                borderRadius: 8,
                                                marginBottom: 24,
                                                border: "1px solid #3affa3",
                                                backgroundColor: "#3affa3",
                                                color: "#000",
                                                cursor: active ? "default" : "pointer",
                                            }}
                                        >
                                            {active
                                                ? "Current Plan"
                                                : plan.buttonText || "Upgrade"}
                                        </button>
                                    </Link>
                                )}

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 8,
                                        marginBottom: 16,
                                    }}
                                >
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 1,
                                            backgroundColor: "#27272a",
                                        }}
                                    />
                                    <span
                                        style={{
                                            color: "#d4d4d8",
                                            fontSize: 12,
                                        }}
                                    >
                                        Features
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            height: 1,
                                            backgroundColor: "#27272a",
                                        }}
                                    />
                                </div>

                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 10,
                                    }}
                                >
                                    {plan.features.map((feature, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                alignItems: "center",
                                            }}
                                        >
                                            <CheckIcon />
                                            <span
                                                style={{
                                                    color: "#d4d4d8",
                                                    fontSize: 13,
                                                }}
                                            >
                                                {feature}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {showViewAllButton && (
                    <div
                        style={{
                            textAlign: "center",
                            marginTop: 40,
                        }}
                    >
                        <Link to="/pricing">
                            <button
                                style={{
                                    border: "1px solid #3affa3",
                                    color: "#3affa3",
                                    background: "transparent",
                                    padding: "10px 30px",
                                    borderRadius: 999,
                                }}
                            >
                                View all plans →
                            </button>
                        </Link>
                    </div>
                )}
            </div>
        </div>


    );
}
