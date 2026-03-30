import joblib
import numpy as np
import pandas as pd
from pathlib import Path

MODEL_PATH = Path(__file__).parent / "best_loan_model.pkl"

_bundle = None

def get_bundle():
    global _bundle
    if _bundle is None:
        _bundle = joblib.load(MODEL_PATH)
    return _bundle


def predict_default(applicant: dict) -> dict:
    bundle = get_bundle()
    df = pd.DataFrame([applicant])

    df["total_past_due_temp"] = df["past_due_30_59"] + df["past_due_60_89"] + df["times_90_days_late"]
    df["total_past_due"] = df["total_past_due_temp"]
    df["monthly_debt_payment"] = df["debt_ratio"] * df["monthly_income"]
    df["income_per_dependent"] = df["monthly_income"] / (df["num_dependents"] + 1)
    df["is_ever_late"] = (df["total_past_due"] > 0).astype(int)
    df["high_utilization"] = (df["revolving_utilization"] > 0.75).astype(int)

    X = bundle["imputer"].transform(df[bundle["features"]])
    X = bundle["scaler"].transform(X)

    prob = float(bundle["model"].predict_proba(X)[0][1])
    pred = prob >= bundle["threshold"]

    if prob < 0.20:   risk = "LOW"
    elif prob < 0.40: risk = "MEDIUM"
    elif prob < 0.65: risk = "HIGH"
    else:             risk = "VERY HIGH"

    return {
        "default_probability": round(prob, 4),
        "prediction": "DEFAULT" if pred else "REPAY",
        "risk_level": risk,
        "recommendation": "REJECT" if pred else "APPROVE",
    }


def get_model_info() -> dict:
    bundle = get_bundle()
    return {
        "model_name": bundle["model_name"],
        "roc_auc": round(bundle["roc_auc"], 4),
        "threshold": round(float(bundle["threshold"]), 4),
        "num_features": len(bundle["features"]),
        "dataset": "Give Me Some Credit (Kaggle) — 150,000 records",
    }
