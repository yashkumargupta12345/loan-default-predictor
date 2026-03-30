from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ApplicantInput(BaseModel):
    revolving_utilization: float = Field(..., ge=0, le=1, description="Credit utilization ratio (0–1)")
    age: int = Field(..., ge=18, le=120, description="Borrower age")
    past_due_30_59: int = Field(..., ge=0, le=20, description="Times 30–59 days past due")
    debt_ratio: float = Field(..., ge=0, description="Monthly debt / monthly income")
    monthly_income: float = Field(..., gt=0, description="Monthly income in USD")
    open_credit_lines: int = Field(..., ge=0, description="Number of open credit lines")
    times_90_days_late: int = Field(..., ge=0, le=20, description="Times 90+ days late")
    real_estate_loans: int = Field(..., ge=0, description="Real estate loans or lines")
    past_due_60_89: int = Field(..., ge=0, le=20, description="Times 60–89 days past due")
    num_dependents: int = Field(..., ge=0, description="Number of dependents")

    class Config:
        json_schema_extra = {
            "example": {
                "revolving_utilization": 0.75,
                "age": 45,
                "past_due_30_59": 2,
                "debt_ratio": 0.5,
                "monthly_income": 4500,
                "open_credit_lines": 6,
                "times_90_days_late": 1,
                "real_estate_loans": 0,
                "past_due_60_89": 0,
                "num_dependents": 2,
            }
        }


class PredictionResponse(BaseModel):
    id: int
    default_probability: float
    prediction: str           # "DEFAULT" or "REPAY"
    risk_level: str           # "LOW" / "MEDIUM" / "HIGH" / "VERY HIGH"
    recommendation: str       # "APPROVE" or "REJECT"
    timestamp: str
    input_data: dict


class StatsResponse(BaseModel):
    total_predictions: int
    total_approved: int
    total_rejected: int
    approval_rate: float
    avg_default_probability: float
    risk_distribution: dict   # {"LOW": n, "MEDIUM": n, ...}
    recent_predictions: list
