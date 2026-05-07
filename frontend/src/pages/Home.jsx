import React, { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { registerPolicy, payPremium } from "../utils/thahar";
import {
  kathmandu,
  khotang,
  chitwan,
  rice,
  maize,
  wheat,
  millet,
  winter,
  spring,
  monsoon,
} from "../assets/images";

const REGIONS = ["kathmandu", "khotang", "chitwan"];
const CROPS = ["Rice", "Maize", "Wheat", "Millet"];
const DURATIONS = [
  { value: 30, label: "30 days", sub: "Short term" },
  { value: 90, label: "90 days", sub: "One season" },
  { value: 180, label: "180 days", sub: "Half year" },
  { value: 365, label: "365 days", sub: "Full year" },
];
const CROP_META = {
  Rice: { img: rice, nepali: "Dhan" },
  Maize: { img: maize, nepali: "Makai" },
  Wheat: { img: wheat, nepali: "Gahu" },
  Millet: { img: millet, nepali: "Kodo" },
};
const REGION_META = {
  kathmandu: { img: kathmandu, province: "Bagmati Province" },
  khotang: { img: khotang, province: "Koshi Province" },
  chitwan: { img: chitwan, province: "Bagmati Province" },
};
const THRESHOLDS = {
  Rice: { Monsoon: 40, Spring: 30, Winter: 20 },
  Maize: { Monsoon: 35, Spring: 25, Winter: 15 },
  Wheat: { Monsoon: 30, Spring: 30, Winter: 20 },
  Millet: { Monsoon: 35, Spring: 25, Winter: 15 },
};
const MOCK_RAINFALL = { kathmandu: 38, khotang: 22, chitwan: 55 };

export default function Home({ notify, toNPR, toSOL }) {
  const wallet = useWallet();
  const isMobile = /Android|iPhone/i.test(navigator.userAgent);
  const isInPhantom = window.phantom?.solana?.isPhantom;
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardDir, setWizardDir] = useState(1);
  const [txStep, setTxStep] = useState("register");
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState(null);
  const [crop, setCrop] = useState(null);
  const [season, setSeason] = useState(null);
  const [duration, setDuration] = useState(null);
  const [coverage, setCoverage] = useState("");
  const [adjustment, setAdjustment] = useState(0);
  const wizardRef = useRef(null);
  const revealRefs = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    revealRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addRevealRef = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  const baseThreshold = crop && season ? THRESHOLDS[crop][season] : 40;
  const finalThreshold = baseThreshold + adjustment;
  const solAmount =
    coverage && toSOL ? parseFloat(toSOL(parseFloat(coverage))) : 0;
  const premiumSOL = (solAmount * 0.05).toFixed(4);

  function getRisk() {
    if (!region || !crop || !season)
      return {
        level: "low",
        label: "Low Risk",
        desc: "Select your details to see risk.",
      };
    const rainfall = MOCK_RAINFALL[region] || 40;
    const threshold = THRESHOLDS[crop][season];
    if (rainfall < threshold * 0.6)
      return {
        level: "high",
        label: "High Drought Risk",
        desc: `Rainfall (${rainfall}mm) is well below the ${threshold}mm threshold for your crop.`,
      };
    if (rainfall < threshold)
      return {
        level: "medium",
        label: "Medium Drought Risk",
        desc: `Rainfall (${rainfall}mm) is slightly below the ${threshold}mm threshold.`,
      };
    return {
      level: "low",
      label: "Low Drought Risk",
      desc: `Rainfall (${rainfall}mm) is above the ${threshold}mm threshold. Conditions look stable.`,
    };
  }

  function goToWizard() {
    setWizardStep(1);
    setTimeout(
      () =>
        wizardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }
  // REPLACE the existing goTo function with this:
  function goTo(step) {
    setWizardDir(step > wizardStep ? 1 : -1);
    setWizardStep(step);
    setTimeout(
      () =>
        wizardRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        }),
      50,
    );
  }

  const handleRegister = async () => {
    if (!wallet.connected) return notify("Connect your wallet first", "error");
    if (!coverage) return notify("Enter a coverage amount", "error");
    setLoading(true);
    try {
      const sig = await registerPolicy(wallet, {
        coverageAmount: solAmount * 1e9,
        triggerThreshold: finalThreshold,
        regionId: region,
        policyType: 0,
        durationDays: parseInt(duration),
      });
      notify(`Policy registered! TX: ${sig.slice(0, 8)}...`);
      setTxStep("premium");
    } catch (e) {
      if (e.message?.includes("already been processed")) {
        notify("Policy registered!");
        setTxStep("premium");
      } else notify(e.message || "Registration failed", "error");
    }
    setLoading(false);
  };

  const handlePremium = async () => {
    if (!wallet.connected) return notify("Connect your wallet first", "error");
    setLoading(true);
    try {
      const sig = await payPremium(wallet, solAmount * 1e9 * 0.05);
      notify(`Premium paid! TX: ${sig.slice(0, 8)}...`);
      setTxStep("done");
    } catch (e) {
      if (e.message?.includes("already been processed")) {
        notify("Premium paid!");
        setTxStep("done");
      } else notify(e.message || "Payment failed", "error");
    }
    setLoading(false);
  };

  const canNext = {
    1: !!region,
    2: !!crop,
    3: !!season,
    4: !!duration,
    5: !!coverage && parseFloat(coverage) >= 1000,
  };
  const risk = getRisk();

  return (
    <div className="page-container" style={{ maxWidth: "100%", padding: 0 }}>
      <section className="home-hero">
        <div className="home-hero-inner">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="live-dot" />
              Live on Solana Devnet
            </div>
            <h1 className="hero-title">
              Your crops are
              <br />
              <em>protected.</em>
            </h1>
            <p className="hero-sub">
              Thahar brings parametric crop insurance to Nepali farmers —
              automated, transparent, instant. No middlemen. No paperwork. Just
              protection when it matters.
            </p>
            <div className="hero-actions">
              <button
                className="cryo-btn"
                onClick={goToWizard}
                style={{ padding: "14px 28px", fontSize: 15 }}
              >
                Insure My Farm →
              </button>
              <a
                href="#how-it-works"
                className="cryo-btn btn-outline"
                style={{ padding: "14px 28px", fontSize: 15 }}
              >
                How It Works
              </a>
            </div>
          </div>
          <div className="hero-oracle-wrap">
            <div className="cryo-card oracle-card">
              <div className="oracle-card-header">
                <span className="oracle-card-title">Live Oracle Data</span>
                <span className="oracle-live-badge">
                  <span className="live-dot" style={{ width: 7, height: 7 }} />
                  Updated 2h ago
                </span>
              </div>
              {[
                {
                  region: "Kathmandu",
                  province: "Bagmati Province",
                  rain: 38,
                  risk: "medium",
                  riskLabel: "Medium Risk",
                },
                {
                  region: "Khotang",
                  province: "Koshi Province",
                  rain: 22,
                  risk: "high",
                  riskLabel: "High Risk",
                },
                {
                  region: "Chitwan",
                  province: "Bagmati Province",
                  rain: 55,
                  risk: "low",
                  riskLabel: "Low Risk",
                },
              ].map((row) => (
                <div key={row.region} className="oracle-row">
                  <div>
                    <div className="oracle-region">{row.region}</div>
                    <div className="oracle-province">{row.province}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div>
                      <span className="oracle-rain-val">{row.rain}</span>
                      <span className="oracle-rain-unit">mm</span>
                    </div>
                    <span className={`oracle-risk-badge ${row.risk}`}>
                      {row.riskLabel}
                    </span>
                  </div>
                </div>
              ))}
              <div className="oracle-footer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <circle
                    cx="6"
                    cy="6"
                    r="5"
                    stroke="#C4C4C4"
                    strokeWidth="1.2"
                  />
                  <path
                    d="M6 3.5v2.5l1.5 1.5"
                    stroke="#C4C4C4"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                  />
                </svg>
                Open-Meteo weather data · Every 12 hours
              </div>
            </div>
          </div>
        </div>
      </section>
      <div ref={addRevealRef} className="reveal stats-strip">
        <div className="stats-inner">
          {[
            {
              val: 24,
              suffix: "h",
              prefix: "~",
              label: "Automatic payout after drought trigger",
            },
            { val: 3, suffix: "", label: "Regions covered across Nepal" },
            {
              val: 0,
              suffix: "%",
              label: "Zero Middlemen in the payout process",
            },
            {
              val: "Solana",
              label: "Sub-second finality, near-zero fees",
              typewriter: true,
            },
          ].map((s, i) => (
            <StatItem key={i} {...s} />
          ))}
        </div>
      </div>

      <section id="how-it-works" className="hiw-section">
        <div ref={addRevealRef} className="reveal" style={{ marginBottom: 12 }}>
          <div className="section-label">How It Works</div>
          <div className="section-title">Five steps from signup to payout.</div>
        </div>
        <div className="steps-grid hiw-grid-wrap">
          {[
            {
              step: "01",
              emoji: "📍",
              title: "Choose Your Region",
              desc: "Select the district closest to your farmland.",
              np: "आफ्नो क्षेत्र छान्नुहोस्।",
              bg: "#f0fdf4",
              border: "#bbf7d0",
              accent: "#16a34a",
              iconBg: "#dcfce7",
            },
            {
              step: "02",
              emoji: "🌾",
              title: "Pick Your Crop",
              desc: "Your crop type determines the drought threshold.",
              np: "आफ्नो बाली छान्नुहोस्।",
              bg: "#fefce8",
              border: "#fde68a",
              accent: "#ca8a04",
              iconBg: "#fef9c3",
            },
            {
              step: "03",
              emoji: "💰",
              title: "Set Coverage",
              desc: "Enter your crop value in Nepali Rupees.",
              np: "बीमा रकम तोक्नुहोस्।",
              bg: "#eff6ff",
              border: "#bfdbfe",
              accent: "#2563eb",
              iconBg: "#dbeafe",
            },
            {
              step: "04",
              emoji: "⛓",
              title: "Register On-Chain",
              desc: "Your policy is stored on Solana — no middlemen.",
              np: "नीति दर्ता गर्नुहोस्।",
              bg: "#fdf4ff",
              border: "#e9d5ff",
              accent: "#9333ea",
              iconBg: "#f3e8ff",
            },
            {
              step: "05",
              emoji: "✅",
              title: "Auto Payout",
              desc: "When drought is detected, SOL is sent instantly.",
              np: "स्वचालित भुक्तानी पाउनुहोस्।",
              bg: "#fff1f2",
              border: "#fecdd3",
              accent: "#e11d48",
              iconBg: "#ffe4e6",
            },
          ].map((card) => (
            <StepCard key={card.step} card={card} />
          ))}
        </div>
      </section>

      <section id="register-section" ref={wizardRef} className="wizard-section">
        <div className="wizard-inner">
          <div className="wizard-header-block">
            <div className="wizard-section-label">Thahar Protocol</div>
            <div className="wizard-section-title">Register Your Policy</div>
          </div>
          {!wallet.connected ? (
            <div className="cryo-card connect-prompt">
              {wallet.connecting ? (
                <div className="wallet-skeleton">
                  <div className="skel-line skel-w60" />
                  <div className="skel-line skel-w40" />
                  <div className="skel-btn-placeholder" />
                </div>
              ) : (
                <>
                  <p>
                    Connect your Phantom wallet to register a policy on Solana
                    devnet.
                  </p>
                  {isMobile && !isInPhantom ? (
                    <button
                      className="cryo-btn"
                      onClick={() =>
                        (window.location.href =
                          "phantom://browse/https%3A%2F%2Fthahar.vercel.app")
                      }
                    >
                      🔗 Open in Phantom
                    </button>
                  ) : (
                    <WalletMultiButton className="cryo-wallet-btn" />
                  )}
                </>
              )}
            </div>
          ) : txStep === "done" ? (
            <div className="cryo-card done-state">
              <div className="done-icon">✅</div>
              <h3 className="done-title">Policy Active!</h3>
              <p className="done-desc">
                Your insurance policy is live on Solana devnet. You will receive
                SOL directly when drought conditions are met.
              </p>
              <a
                href={`https://explorer.solana.com/address/${wallet.publicKey?.toBase58()}?cluster=devnet`}
                target="_blank"
                rel="noreferrer"
                className="cryo-btn"
              >
                View on Explorer →
              </a>
            </div>
          ) : txStep === "premium" ? (
            <div className="cryo-card" style={{ padding: 36 }}>
              <div className="wizard-section-label">Step 2 of 2</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  color: "var(--grey-900)",
                  marginBottom: 6,
                }}
              >
                Pay Your Premium
              </div>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontWeight: 300,
                  marginBottom: 28,
                  fontSize: 14,
                }}
              >
                Premium is 5% of your coverage amount. This activates your
                policy on-chain.
              </p>
              <div className="premium-box">
                <div className="premium-label">Premium Due</div>
                <div className="premium-amount">{premiumSOL} SOL</div>
                <div className="premium-sub">
                  5% of {solAmount.toFixed(4)} SOL coverage
                </div>
              </div>
              <button
                className="cryo-btn full-width"
                onClick={handlePremium}
                disabled={loading}
                style={{ height: 52, fontSize: 15 }}
              >
                {loading ? "Processing..." : "💳 Pay Premium & Activate Policy"}
              </button>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: 36 }}>
                <div className="progress-steps">
                  {[
                    "Region",
                    "Crop",
                    "Season",
                    "Duration",
                    "Coverage",
                    "Review",
                  ].map((name, i) => {
                    const n = i + 1;
                    const isDone = wizardStep > n;
                    const isActive = wizardStep === n;
                    return (
                      <div key={n} className="progress-step">
                        {i < 5 && (
                          <div
                            className={`progress-line${isDone ? " done" : ""}`}
                          />
                        )}
                        <div
                          className={`step-dot${isDone ? " done" : ""}${isActive ? " active" : ""}`}
                          onClick={() => isDone && goTo(n)}
                        >
                          {isDone ? "✓" : n}
                        </div>
                        <div
                          className={`step-name${isDone || isActive ? " active" : ""}`}
                        >
                          {name}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div
                className="cryo-card wizard-card"
                style={{ overflow: "hidden" }}
              >
                <div
                  key={wizardStep}
                  style={{
                    animation: `wizardSlide${wizardDir > 0 ? "In" : "Back"} 0.32s cubic-bezier(0.4, 0, 0.2, 1) both`,
                  }}
                >
                  {wizardStep === 1 && (
                    <WizardStep
                      question="Where is your farm?"
                      hint="Select the district closest to your farmland."
                    >
                      <div className="options-grid">
                        {REGIONS.map((r) => (
                          <OptionCard
                            key={r}
                            selected={region === r}
                            onClick={() => setRegion(r)}
                            img={REGION_META[r].img}
                            label={r.charAt(0).toUpperCase() + r.slice(1)}
                            sub={REGION_META[r].province}
                          />
                        ))}
                      </div>
                      <WizardNav
                        onNext={() => goTo(2)}
                        nextDisabled={!canNext[1]}
                        showBack={false}
                      />
                    </WizardStep>
                  )}
                  {wizardStep === 2 && (
                    <WizardStep
                      question="What do you grow?"
                      hint="Your crop determines the drought threshold."
                    >
                      <div className="options-grid">
                        {CROPS.map((c) => (
                          <OptionCard
                            key={c}
                            selected={crop === c}
                            onClick={() => {
                              setCrop(c);
                              setAdjustment(0);
                            }}
                            img={CROP_META[c].img}
                            label={c}
                            sub={CROP_META[c].nepali}
                          />
                        ))}
                      </div>
                      <WizardNav
                        onBack={() => goTo(1)}
                        onNext={() => goTo(3)}
                        nextDisabled={!canNext[2]}
                      />
                    </WizardStep>
                  )}
                  {wizardStep === 3 && (
                    <WizardStep
                      question="Which season?"
                      hint="Coverage period aligns with your growing season."
                    >
                      <div className="options-grid">
                        {[
                          { val: "Monsoon", img: monsoon, sub: "Jun – Sep" },
                          { val: "Winter", img: winter, sub: "Nov – Feb" },
                          { val: "Spring", img: spring, sub: "Mar – May" },
                        ].map((s) => (
                          <OptionCard
                            key={s.val}
                            selected={season === s.val}
                            onClick={() => {
                              setSeason(s.val);
                              setAdjustment(0);
                            }}
                            img={s.img}
                            label={s.val}
                            sub={s.sub}
                          />
                        ))}
                      </div>
                      <WizardNav
                        onBack={() => goTo(2)}
                        onNext={() => goTo(4)}
                        nextDisabled={!canNext[3]}
                      />
                    </WizardStep>
                  )}
                  {wizardStep === 4 && (
                    <WizardStep
                      question="How long do you need coverage?"
                      hint="Longer coverage protects you through the full season."
                    >
                      <div className="options-grid">
                        {DURATIONS.map((d) => (
                          <OptionCard
                            key={d.value}
                            selected={duration === d.value}
                            onClick={() => setDuration(d.value)}
                            label={d.label}
                            sub={d.sub}
                          />
                        ))}
                      </div>
                      <WizardNav
                        onBack={() => goTo(3)}
                        onNext={() => goTo(5)}
                        nextDisabled={!canNext[4]}
                      />
                    </WizardStep>
                  )}
                  {wizardStep === 5 && (
                    <WizardStep
                      question="How much coverage?"
                      hint="Enter the value of your crop in Nepali Rupees."
                    >
                      <div className="coverage-wrap">
                        <div className="input-group">
                          <div className="input-prefix">Rs.</div>
                          <input
                            className="coverage-input"
                            type="number"
                            placeholder="50,000"
                            min="1000"
                            value={coverage}
                            onChange={(e) => setCoverage(e.target.value)}
                          />
                          <div
                            className={`sol-badge${coverage && parseFloat(coverage) >= 1000 ? " visible" : ""}`}
                          >
                            ≈ {solAmount.toFixed(4)} SOL
                          </div>
                        </div>
                        <div className="coverage-note">
                          Minimum Rs. 1,000 · Converts to SOL at current rate
                        </div>
                        {crop && season && (
                          <div className="threshold-box">
                            <div className="threshold-box-label">
                              Rainfall Trigger Threshold
                            </div>
                            <div className="threshold-controls">
                              <button
                                className="cryo-btn btn-outline adj-btn"
                                onClick={() =>
                                  setAdjustment((a) => Math.max(a - 1, -5))
                                }
                                type="button"
                              >
                                −
                              </button>
                              <span className="threshold-val">
                                {finalThreshold} mm
                              </span>
                              <button
                                className="cryo-btn btn-outline adj-btn"
                                onClick={() =>
                                  setAdjustment((a) => Math.min(a + 1, 5))
                                }
                                type="button"
                              >
                                +
                              </button>
                            </div>
                            <div
                              className={`threshold-note${Math.abs(adjustment) >= 3 ? " warn" : ""}`}
                            >
                              {adjustment === 0
                                ? `Recommended: ${baseThreshold}mm for ${crop} in ${season}`
                                : Math.abs(adjustment) === 5
                                  ? "⚠️ Maximum adjustment reached"
                                  : Math.abs(adjustment) >= 3
                                    ? `⚠️ ${adjustment > 0 ? "+" : ""}${adjustment}mm from recommended — payout conditions may vary`
                                    : `Adjusted ${adjustment > 0 ? "+" : ""}${adjustment}mm from recommended`}
                            </div>
                          </div>
                        )}
                      </div>
                      <WizardNav
                        onBack={() => goTo(4)}
                        onNext={() => goTo(6)}
                        nextDisabled={!canNext[5]}
                        nextLabel="Review Policy →"
                      />
                    </WizardStep>
                  )}
                  {wizardStep === 6 && (
                    <WizardStep
                      question="Review your policy"
                      hint="Confirm your details before registering on Solana."
                    >
                      <div className={`risk-banner ${risk.level}`}>
                        <div className="risk-dot" />
                        <div className="risk-text">
                          <div className="risk-label">{risk.label}</div>
                          <div className="risk-desc">{risk.desc}</div>
                        </div>
                      </div>
                      <div className="summary-grid">
                        {[
                          {
                            key: "Region",
                            val: region
                              ? region.charAt(0).toUpperCase() + region.slice(1)
                              : "—",
                          },
                          { key: "Crop", val: crop || "—" },
                          { key: "Season", val: season || "—" },
                          {
                            key: "Duration",
                            val: duration ? `${duration} days` : "—",
                          },
                          {
                            key: "Coverage",
                            val: coverage
                              ? `Rs. ${parseFloat(coverage).toLocaleString()} ≈ ${solAmount.toFixed(4)} SOL`
                              : "—",
                            green: true,
                          },
                          { key: "Policy Type", val: "Drought" },
                          {
                            key: "Threshold",
                            val: `${finalThreshold} mm rainfall`,
                          },
                          {
                            key: "Premium",
                            val: `${premiumSOL} SOL (5%)`,
                            green: true,
                          },
                        ].map((row) => (
                          <div className="summary-row" key={row.key}>
                            <div className="summary-key">{row.key}</div>
                            <div
                              className={`summary-val${row.green ? " green" : ""}`}
                            >
                              {row.val}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="wizard-nav">
                        <button className="btn-back" onClick={() => goTo(5)}>
                          ← Back
                        </button>
                        <button
                          className="btn-register"
                          onClick={handleRegister}
                          disabled={loading}
                        >
                          {loading ? "Registering..." : "Register Policy"}
                        </button>
                      </div>
                    </WizardStep>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <div ref={addRevealRef} className="reveal cta-section">
        <div>
          <div className="cta-eyebrow">Built on Solana</div>
          <div className="cta-title">Protect your harvest today.</div>
          <div className="cta-sub">
            Takes 60 seconds. Connect your Phantom wallet and register your
            first policy.
          </div>
        </div>
        <button className="cryo-btn cta-btn" onClick={goToWizard}>
          Register Policy →
        </button>
      </div>
    </div>
  );
}

function StatItem({
  val,
  suffix = "",
  prefix = "",
  label,
  static: isStatic,
  typewriter: isTypewriter,
}) {
  const [count, setCount] = useState(0);
  const [typed, setTyped] = useState("");
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (isTypewriter) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !animated.current) {
            animated.current = true;
            let i = 0;
            const timer = setInterval(() => {
              setTyped(val.slice(0, i + 1));
              i++;
              if (i >= val.length) clearInterval(timer);
            }, 120);
          }
        },
        { threshold: 0.3 },
      );
      observer.observe(el);
      return () => observer.disconnect();
    }

    if (isStatic) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          const target = val;
          const duration = 1000;
          const steps = 50;
          const increment = target / steps;
          let current = 0;
          const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [val, isStatic, isTypewriter]);

  return (
    <div className="stat-item" ref={ref}>
      <div className="stat-val">
        {isTypewriter
          ? typed
          : isStatic
            ? val
            : `${prefix || ""}${count}${suffix}`}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function StepCard({ card }) {
  const [npOn, setNpOn] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const isMobile = window.innerWidth < 1024;
    const stepIndex = parseInt(card.step) - 1;

    // Initial hidden state
    el.style.opacity = "0";
    el.style.transform = "scale(0.6)";
    el.style.transition =
      "opacity 1.2s cubic-bezier(0.19, 1, 0.22, 1), transform 1.2s cubic-bezier(0.19, 1, 0.22, 1)";

    // Single observer that handles both reveal and unreveal
    const observer = new IntersectionObserver(
      ([entry]) => {
        const fromBottom =
          entry.boundingClientRect.top > window.innerHeight / 2;

        if (entry.isIntersecting) {
          // Scrolling down → reveal left to right (card 1 first)
          // Scrolling up → reveal right to left (card 5 first)
          const delay = fromBottom ? stepIndex * 150 : (4 - stepIndex) * 150;
          setTimeout(() => {
            el.style.opacity = "1";
            el.style.transform = "scale(1)";
          }, delay);
        } else {
          // Unreveal always right to left (card 5 first)
          setTimeout(
            () => {
              el.style.opacity = "0";
              el.style.transform = "scale(0.6)";
            },
            (4 - stepIndex) * 150,
          );
        }
      },
      { threshold: 0.15, rootMargin: "-15% 0px -25% 0px" },
    );

    observer.observe(el);

    if (!isMobile) {
      // Desktop: hover enlarge
      function handleMouseEnter() {
        el.style.transform = "scale(1.08)";
        el.style.boxShadow = `0 20px 48px ${card.border}99`;
        el.style.zIndex = "10";
      }

      function handleMouseLeave() {
        el.style.transform = "scale(1)";
        el.style.boxShadow = "";
        el.style.zIndex = "2";
      }

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        observer.disconnect();
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      };
    }

    if (isMobile) {
      // Mobile: scroll-driven enlarge
      function handleScrollMobile() {
        const rect = el.getBoundingClientRect();
        const viewH = window.innerHeight;
        const cardCenter = rect.top + rect.height / 2;
        const viewCenter = viewH / 2;
        const distance = Math.abs(cardCenter - viewCenter);
        const maxDist = viewH * 0.25;
        // Only enlarge if already visible
        if (el.style.opacity === "1") {
          const scale =
            distance > maxDist
              ? 1
              : Math.max(1, 1.12 - (distance / maxDist) * 0.12);
          el.style.transform = `scale(${scale.toFixed(3)})`;
        }
      }
      window.addEventListener("scroll", handleScrollMobile, { passive: true });
      return () => {
        observer.disconnect();
        window.removeEventListener("scroll", handleScrollMobile);
      };
    }

    return () => observer.disconnect();
  }, [card.step, card.border]);

  return (
    <div
      ref={cardRef}
      className="cryo-card step-card-colored"
      style={{
        background: card.bg,
        borderColor: card.border,
        color: card.accent,
        position: "relative",
        zIndex: 2,
      }}
    >
      <div className="step-card-num" style={{ color: card.accent }}>
        {card.step}
      </div>
      <div className="step-card-icon" style={{ background: card.iconBg }}>
        {card.emoji}
      </div>
      <h3 className="step-card-title">{card.title}</h3>
      <p className="step-card-desc">{card.desc}</p>
      {npOn && (
        <p
          className="step-card-np visible"
          style={{ borderTopColor: card.border }}
        >
          {card.np}
        </p>
      )}
      <div className="step-card-footer">
        <button
          className="step-card-translate"
          onClick={() => setNpOn((o) => !o)}
        >
          {npOn ? "🇬🇧 EN" : "🇳🇵 NP"}
        </button>
      </div>
    </div>
  );
}

function WizardStep({ question, hint, children }) {
  return (
    <div>
      <div className="step-question">{question}</div>
      <div className="step-hint">{hint}</div>
      {children}
    </div>
  );
}

function OptionCard({ selected, onClick, icon, img, label, sub }) {
  return (
    <div
      className={`option-card${selected ? " selected" : ""}`}
      onClick={onClick}
    >
      {img && (
        <div className="option-img-wrap">
          <img src={img} alt={label} className="option-img" />
        </div>
      )}
      {icon && !img && <div className="option-icon">{icon}</div>}
      <div className="option-label">{label}</div>
      {sub && <div className="option-sub">{sub}</div>}
    </div>
  );
}

function WizardNav({
  onBack,
  onNext,
  nextDisabled,
  showBack = true,
  nextLabel = "Continue →",
}) {
  return (
    <div className="wizard-nav">
      {showBack && (
        <button className="btn-back" onClick={onBack}>
          ← Back
        </button>
      )}
      <button className="btn-next" onClick={onNext} disabled={nextDisabled}>
        {nextLabel}
      </button>
    </div>
  );
}
