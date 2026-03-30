# 🏦 Loan Default Predictor

An end-to-end ML-powered web app that predicts whether a borrower will default on their loan.

**Live Demo:** [Frontend on Vercel](#) · [API Docs on Render](#)

---

## 🧠 ML Model

| Detail | Value |
|---|---|
| Dataset | [Give Me Some Credit — Kaggle](https://www.kaggle.com/competitions/GiveMeSomeCredit) |
| Records | 150,000 real US borrower records |
| Algorithm | Gradient Boosting Classifier |
| ROC-AUC | **0.8694** |
| Explainability | SHAP feature importance |

**Key engineering decisions:**
- `class_weight='balanced'` instead of SMOTE (120K rows → SMOTE too slow)
- Threshold optimization for max F1 (not default 0.5)
- 5 engineered features: `total_past_due`, `monthly_debt_payment`, `income_per_dependent`, `is_ever_late`, `high_utilization`
- SHAP for model explainability

---

## 🛠 Tech Stack

**Backend:** Python · FastAPI · Scikit-learn · XGBoost · SHAP · Joblib  
**Frontend:** React.js · Recharts · CSS (dark glassmorphism)  
**Deploy:** Render (backend) · Vercel (frontend)

---

## 📁 Project Structure

```
loan-default-predictor/
├── backend/
│   ├── main.py           ← FastAPI server (routes, CORS)
│   ├── predictor.py      ← ML prediction logic
│   ├── models.py         ← Pydantic schemas
│   ├── best_loan_model.pkl
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── App.js
│       ├── App.css
│       └── components/
│           ├── PredictForm.js   ← borrower input form
│           └── Dashboard.js     ← stats + charts
└── notebook/
    └── Loan_Default_Prediction_v2.ipynb
```

---

## 🚀 Run Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

**Frontend:**
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/predict` | Predict default for a borrower |
| `GET` | `/stats` | Aggregated prediction statistics |
| `GET` | `/predictions` | Last N predictions |
| `GET` | `/model-info` | Model metadata |

**Sample request:**
```json
POST /predict
{
  "revolving_utilization": 0.75,
  "age": 45,
  "past_due_30_59": 2,
  "debt_ratio": 0.5,
  "monthly_income": 4500,
  "open_credit_lines": 6,
  "times_90_days_late": 1,
  "real_estate_loans": 0,
  "past_due_60_89": 0,
  "num_dependents": 2
}
```

**Sample response:**
```json
{
  "id": 1,
  "default_probability": 0.5812,
  "prediction": "DEFAULT",
  "risk_level": "HIGH",
  "recommendation": "REJECT",
  "timestamp": "2025-01-01T10:00:00Z"
}
```

---

## ⚠️ Known Limitations

1. In-memory prediction store — resets on server restart (no DB yet)
2. Static threshold — in production, tune per lender's risk appetite
3. No temporal validation — production would use time-based train/test split
