from dotenv import load_dotenv
load_dotenv()
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class PredictionRecord(Base):
    __tablename__ = "loan_predictions"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Input features
    revolving_utilization = Column(Float)
    age = Column(Integer)
    past_due_30_59 = Column(Integer)
    debt_ratio = Column(Float)
    monthly_income = Column(Float)
    open_credit_lines = Column(Integer)
    times_90_days_late = Column(Integer)
    real_estate_loans = Column(Integer)
    past_due_60_89 = Column(Integer)
    num_dependents = Column(Integer)
    
    # Output
    default_probability = Column(Float)
    prediction = Column(String)
    risk_level = Column(String)
    recommendation = Column(String)


def init_db():
    Base.metadata.create_all(bind=engine)


def save_prediction(db, input_data: dict, result: dict):
    record = PredictionRecord(
        **input_data,
        default_probability=result["default_probability"],
        prediction=result["prediction"],
        risk_level=result["risk_level"],
        recommendation=result["recommendation"],
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_all_predictions(db):
    return db.query(PredictionRecord).order_by(PredictionRecord.id.desc()).all()


def get_stats_from_db(db):
    records = db.query(PredictionRecord).all()
    if not records:
        return None
    
    total = len(records)
    approved = sum(1 for r in records if r.recommendation == "APPROVE")
    rejected = total - approved
    avg_prob = sum(r.default_probability for r in records) / total
    
    risk_dist = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "VERY HIGH": 0}
    for r in records:
        risk_dist[r.risk_level] += 1
    
    return {
        "total_predictions": total,
        "total_approved": approved,
        "total_rejected": rejected,
        "approval_rate": round(approved / total, 4),
        "avg_default_probability": round(avg_prob, 4),
        "risk_distribution": risk_dist,
        "recent_predictions": [
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
            for r in records[-5:][::-1]
        ]
    }