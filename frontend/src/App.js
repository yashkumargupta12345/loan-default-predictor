import { useState } from "react";
import PredictForm from "./components/PredictForm";
import Dashboard from "./components/Dashboard";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("predict");
  const [lastResult, setLastResult] = useState(null);

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">🏦</span>
            <div>
              <h1>LoanGuard AI</h1>
              <p>ML-Powered Loan Default Predictor</p>
            </div>
          </div>
          <nav className="nav">
            <button
              className={`nav-btn ${activeTab === "predict" ? "active" : ""}`}
              onClick={() => setActiveTab("predict")}
            >
              🔮 Predict
            </button>
            <button
              className={`nav-btn ${activeTab === "dashboard" ? "active" : ""}`}
              onClick={() => setActiveTab("dashboard")}
            >
              📊 Dashboard
            </button>
          </nav>
        </div>
      </header>

      <main className="main">
        {activeTab === "predict" ? (
          <PredictForm
            onResult={(r) => {
              setLastResult(r);
              // auto-switch to dashboard after prediction
            }}
          />
        ) : (
          <Dashboard />
        )}
      </main>

      <footer className="footer">
        <p>
          Trained on{" "}
          <a
            href="https://www.kaggle.com/competitions/GiveMeSomeCredit"
            target="_blank"
            rel="noreferrer"
          >
            Kaggle "Give Me Some Credit"
          </a>{" "}
          — 150,000 real US borrower records · Gradient Boosting · ROC-AUC 0.8694
        </p>
      </footer>
    </div>
  );
}
