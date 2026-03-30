from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
from models import ApplicantInput, PredictionResponse, StatsResponse
from predictor import predict_default, get_model_info

app = FastAPI(
    title="Loan Default Predictor API",
    description="ML-powered loan default prediction using Gradient Boosting trained on 150K real borrower records (Kaggle 'Give Me Some Credit').",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory store (same as AI Code Reviewer pattern) ────────
prediction_store: list[dict] = []
prediction_counter: int = 0


# ── Routes ────────────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "message": "Loan Default Predictor API is running 🏦",
        "docs": "/docs",
        "endpoints": ["/predict", "/stats", "/predictions", "/model-info"],
    }


@app.get("/model-info")
def model_info():
    """Returns info about the trained ML model."""
    return get_model_info()


@app.post("/predict", response_model=PredictionResponse)
def predict(applicant: ApplicantInput):
    """
    Predict whether a borrower will default on their loan.

    Runs Gradient Boosting model trained on 150,000 real US borrower records.
    Returns default probability, risk level, and approve/reject recommendation.
    """
    global prediction_counter

    try:
        result = predict_default(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    prediction_counter += 1
    timestamp = datetime.now(timezone.utc).isoformat()

    record = {
        "id": prediction_counter,
        "timestamp": timestamp,
        "input_data": applicant.model_dump(),
        **result,
    }
    prediction_store.append(record)

    return record


@app.get("/predictions")
def get_predictions(limit: int = 50):
    """Returns the last N predictions made."""
    return {
        "total": len(prediction_store),
        "predictions": prediction_store[-limit:][::-1],  # newest first
    }


@app.get("/stats", response_model=StatsResponse)
def get_stats():
    """Aggregated statistics across all predictions made so far."""
    if not prediction_store:
        return StatsResponse(
            total_predictions=0,
            total_approved=0,
            total_rejected=0,
            approval_rate=0.0,
            avg_default_probability=0.0,
            risk_distribution={"LOW": 0, "MEDIUM": 0, "HIGH": 0, "VERY HIGH": 0},
            recent_predictions=[],
        )

    total = len(prediction_store)
    approved = sum(1 for p in prediction_store if p["recommendation"] == "APPROVE")
    rejected = total - approved
    avg_prob = sum(p["default_probability"] for p in prediction_store) / total

    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "VERY HIGH": 0}
    for p in prediction_store:
        risk_dist[p["risk_level"]] += 1

    return StatsResponse(
        total_predictions=total,
        total_approved=approved,
        total_rejected=rejected,
        approval_rate=round(approved / total, 4),
        avg_default_probability=round(avg_prob, 4),
        risk_distribution=risk_dist,
        recent_predictions=prediction_store[-5:][::-1],
    )


@app.delete("/predictions/clear")
def clear_predictions():
    """Clear all stored predictions (for demo/testing)."""
    global prediction_counter
    prediction_store.clear()
    prediction_counter = 0
    return {"message": "All predictions cleared."}
