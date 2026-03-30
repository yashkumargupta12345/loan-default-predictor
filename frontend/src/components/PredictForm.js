import { useState } from "react";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const RISK_CONFIG = {
  LOW:       { color: "#2ecc71", bg: "#0d2b1a", emoji: "🟢", label: "Low Risk" },
  MEDIUM:    { color: "#f39c12", bg: "#2b1f0a", emoji: "🟡", label: "Medium Risk" },
  HIGH:      { color: "#e67e22", bg: "#2b1500", emoji: "🟠", label: "High Risk" },
  "VERY HIGH": { color: "#e74c3c", bg: "#2b0a0a", emoji: "🔴", label: "Very High Risk" },
};

const defaultForm = {
  revolving_utilization: "",
  age: "",
  past_due_30_59: "",
  debt_ratio: "",
  monthly_income: "",
  open_credit_lines: "",
  times_90_days_late: "",
  real_estate_loans: "",
  past_due_60_89: "",
  num_dependents: "",
};

const FIELDS = [
  { key: "revolving_utilization", label: "Revolving Credit Utilization", type: "number", step: "0.01", min: 0, max: 1, placeholder: "0.0 – 1.0  (e.g. 0.75)", help: "% of credit limit currently used" },
  { key: "age", label: "Age", type: "number", min: 18, max: 120, placeholder: "e.g. 42", help: "Borrower's age in years" },
  { key: "monthly_income", label: "Monthly Income ($)", type: "number", min: 0, placeholder: "e.g. 5500", help: "Gross monthly income" },
  { key: "debt_ratio", label: "Debt Ratio", type: "number", step: "0.01", min: 0, placeholder: "e.g. 0.35", help: "Monthly debt payments / monthly income" },
  { key: "past_due_30_59", label: "Times 30–59 Days Late", type: "number", min: 0, max: 20, placeholder: "e.g. 0", help: "In the past 2 years" },
  { key: "past_due_60_89", label: "Times 60–89 Days Late", type: "number", min: 0, max: 20, placeholder: "e.g. 0", help: "In the past 2 years" },
  { key: "times_90_days_late", label: "Times 90+ Days Late", type: "number", min: 0, max: 20, placeholder: "e.g. 0", help: "In the past 2 years" },
  { key: "open_credit_lines", label: "Open Credit Lines", type: "number", min: 0, placeholder: "e.g. 6", help: "Number of open loans & credit cards" },
  { key: "real_estate_loans", label: "Real Estate Loans", type: "number", min: 0, placeholder: "e.g. 1", help: "Mortgages and home equity lines" },
  { key: "num_dependents", label: "Number of Dependents", type: "number", min: 0, placeholder: "e.g. 2", help: "Family members relying on income" },
];

// Prefill examples
const EXAMPLES = {
  safe: {
    revolving_utilization: 0.15, age: 38, past_due_30_59: 0,
    debt_ratio: 0.2, monthly_income: 8500, open_credit_lines: 5,
    times_90_days_late: 0, real_estate_loans: 1, past_due_60_89: 0, num_dependents: 1,
  },
  risky: {
    revolving_utilization: 0.9, age: 45, past_due_30_59: 3,
    debt_ratio: 0.6, monthly_income: 3500, open_credit_lines: 8,
    times_90_days_late: 2, real_estate_loans: 0, past_due_60_89: 1, num_dependents: 3,
  },
};

export default function PredictForm({ onResult }) {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const fillExample = (type) => {
    setForm(EXAMPLES[type]);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Validate all fields filled
    for (const f of FIELDS) {
      if (form[f.key] === "" || form[f.key] === null) {
        setError(`Please fill in: ${f.label}`);
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {};
      for (const f of FIELDS) {
        payload[f.key] = parseFloat(form[f.key]);
      }

      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Prediction failed");
      }

      const data = await res.json();
      setResult(data);
      onResult && onResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const risk = result ? RISK_CONFIG[result.risk_level] : null;

  return (
    <div className="predict-page">
      {/* Left — Form */}
      <div className="form-card">
        <div className="form-header">
          <h2>Applicant Details</h2>
          <div className="example-btns">
            <button className="ex-btn safe" onClick={() => fillExample("safe")}>
              🟢 Safe Example
            </button>
            <button className="ex-btn risky" onClick={() => fillExample("risky")}>
              🔴 Risky Example
            </button>
          </div>
        </div>

        <div className="fields-grid">
          {FIELDS.map((f) => (
            <div className="field" key={f.key}>
              <label>{f.label}</label>
              <input
                type={f.type}
                step={f.step}
                min={f.min}
                max={f.max}
                placeholder={f.placeholder}
                value={form[f.key]}
                onChange={(e) => handleChange(f.key, e.target.value)}
              />
              <span className="field-help">{f.help}</span>
            </div>
          ))}
        </div>

        <button
          className="submit-btn"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "⏳ Analyzing..." : "🔮 Predict Default Risk"}
        </button>

        {error && <div className="error-box">⚠️ {error}</div>}
      </div>

      {/* Right — Result */}
      <div className="result-panel">
        {!result ? (
          <div className="result-placeholder">
            <div className="placeholder-icon">🏦</div>
            <h3>Enter applicant details</h3>
            <p>Fill in the form and click Predict to see the ML model's assessment.</p>
            <p className="placeholder-hint">
              Try the example buttons to see how the model responds to different risk profiles.
            </p>
          </div>
        ) : (
          <div className="result-card" style={{ borderColor: risk.color }}>
            {/* Main verdict */}
            <div className="verdict" style={{ background: risk.bg }}>
              <span className="verdict-emoji">{risk.emoji}</span>
              <div>
                <div className="verdict-recommendation" style={{ color: risk.color }}>
                  {result.recommendation}
                </div>
                <div className="verdict-risk">{risk.label}</div>
              </div>
            </div>

            {/* Probability bar */}
            <div className="prob-section">
              <div className="prob-label">
                <span>Default Probability</span>
                <span style={{ color: risk.color, fontWeight: 700 }}>
                  {(result.default_probability * 100).toFixed(1)}%
                </span>
              </div>
              <div className="prob-bar-bg">
                <div
                  className="prob-bar-fill"
                  style={{
                    width: `${result.default_probability * 100}%`,
                    background: risk.color,
                  }}
                />
              </div>
            </div>

            {/* Stats grid */}
            <div className="result-stats">
              <div className="stat-box">
                <div className="stat-label">Prediction</div>
                <div className="stat-value">{result.prediction}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Risk Level</div>
                <div className="stat-value" style={{ color: risk.color }}>
                  {result.risk_level}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Prediction ID</div>
                <div className="stat-value">#{result.id}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Model</div>
                <div className="stat-value" style={{ fontSize: 12 }}>Gradient Boosting</div>
              </div>
            </div>

            {/* Key factors */}
            <div className="factors">
              <div className="factors-title">Key Risk Factors</div>
              <div className="factor-list">
                {result.input_data.revolving_utilization > 0.75 && (
                  <div className="factor bad">⚠️ High credit utilization ({(result.input_data.revolving_utilization * 100).toFixed(0)}%)</div>
                )}
                {(result.input_data.past_due_30_59 + result.input_data.past_due_60_89 + result.input_data.times_90_days_late) > 0 && (
                  <div className="factor bad">⚠️ History of late payments</div>
                )}
                {result.input_data.debt_ratio > 0.5 && (
                  <div className="factor bad">⚠️ High debt-to-income ratio ({(result.input_data.debt_ratio * 100).toFixed(0)}%)</div>
                )}
                {result.input_data.revolving_utilization <= 0.3 && (
                  <div className="factor good">✅ Low credit utilization</div>
                )}
                {(result.input_data.past_due_30_59 + result.input_data.past_due_60_89 + result.input_data.times_90_days_late) === 0 && (
                  <div className="factor good">✅ Clean payment history</div>
                )}
                {result.input_data.monthly_income > 7000 && (
                  <div className="factor good">✅ Strong monthly income</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
