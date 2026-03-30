from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from models import ApplicantInput, PredictionResponse, StatsResponse
from predictor import predict_default, get_model_info
from database import SessionLocal, init_db, save_prediction, get_all_predictions, get_stats_from_db
import os

app = FastAPI(
    title="Loan Default Predictor API",
    description="ML-powered loan default prediction using Gradient Boosting trained on 150K real borrower records.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# DB dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.on_event("startup")
def startup():
    init_db()


@app.get("/")
def root():
    return {
        "message": "Loan Default Predictor API is running 🏦",
        "docs": "/docs",
        "endpoints": ["/predict", "/stats", "/predictions", "/model-info"],
    }


@app.get("/model-info")
def model_info():
    return get_model_info()


@app.post("/predict")
def predict(applicant: ApplicantInput, db: Session = Depends(get_db)):
    try:
        result = predict_default(applicant.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

    record = save_prediction(db, applicant.model_dump(), result)

    return {
        "id": record.id,
        "timestamp": record.timestamp.isoformat(),
        "input_data": applicant.model_dump(),
        **result,
    }


@app.get("/predictions")
def get_predictions(limit: int = 50, db: Session = Depends(get_db)):
    records = get_all_predictions(db)
    return {
        "total": len(records),
        "predictions": [
            {
                "id": r.id,
                "timestamp": r.timestamp.isoformat(),
                "default_probability": r.default_probability,
                "prediction": r.prediction,
                "risk_level": r.risk_level,
                "recommendation": r.recommendation,
                "input_data": {
                    "revolving_utilization": r.revolving_utilization,
                    "age": r.age,
                    "monthly_income": r.monthly_income,
                }
            }
            for r in records[:limit]
        ],
    }


@app.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    stats = get_stats_from_db(db)
    if not stats:
        return {
            "total_predictions": 0,
            "total_approved": 0,
            "total_rejected": 0,
            "approval_rate": 0.0,
            "avg_default_probability": 0.0,
            "risk_distribution": {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "VERY HIGH": 0},
            "recent_predictions": [],
        }
    return stats


@app.delete("/predictions/clear")
def clear_predictions(db: Session = Depends(get_db)):
    db.query(__import__('database').PredictionRecord).delete()
    db.commit()
    return {"message": "All predictions cleared."}
