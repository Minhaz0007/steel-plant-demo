"""
Steel Plant Optimization – FastAPI Backend
Loads 6 pkl model files and exposes a POST /predict endpoint.
"""
import os
from pathlib import Path
from typing import Optional

import joblib
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ─── App setup ────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Steel Plant Optimization API",
    description="ML-powered predictions for temperature, production, energy and manpower.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Load models on startup ───────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent

def _load(name: str):
    path = BASE_DIR / name
    if not path.exists():
        raise FileNotFoundError(f"Required model file not found: {path}")
    return joblib.load(path)

model_temperature = _load("model_temperature.pkl")   # XGBoost
model_production  = _load("model_production.pkl")    # LightGBM
model_energy      = _load("model_energy.pkl")        # LightGBM
energy_encoders   = _load("energy_encoders.pkl")     # dict of LabelEncoders
manpower_ratio    = _load("manpower_ratio.pkl")      # dict {"workers_per_tonne": float}

WORKERS_PER_TONNE: float = manpower_ratio["workers_per_tonne"]


# ─── Request schema ───────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    # Casting parameters
    workpiece_weight: float       = Field(163.0, description="Workpiece weight (tonnes)")
    num_crystallizer: int         = Field(12,    ge=1,  le=24)
    num_stream: int               = Field(3,     ge=1,  le=6)
    cast_in_row: int              = Field(5,     ge=1,  le=20)
    alloy_speed: float            = Field(1.2,   ge=0.5, le=2.0)
    water_consumption: float      = Field(280.0, ge=100, le=500)
    swing_frequency: float        = Field(120.0, ge=50,  le=200)
    crystallizer_movement: float  = Field(5.0,   ge=1,   le=15)
    metal_residue_grab1: float    = Field(2.0,   ge=0,   le=10)

    # Chemistry
    P_pct:  float = Field(0.02)
    Si_pct: float = Field(0.25)
    C_pct:  float = Field(0.15)
    Mn_pct: float = Field(1.0)
    Cu_pct: float = Field(0.05)

    # Energy / electrical
    lagging_reactive: float  = Field(50.0)
    leading_reactive: float  = Field(25.0)
    co2: float               = Field(2.5)
    lagging_pf: float        = Field(0.85)
    leading_pf: float        = Field(0.90)
    nsm: float               = Field(50.0)

    # Categorical
    week_status:  str = Field("Weekday", description="Weekday | Weekend")
    day_of_week:  str = Field("Monday",  description="Monday … Sunday")
    load_type:    str = Field("Medium_Load", description="Light_Load | Medium_Load | Maximum_Load")


# ─── Response schema ──────────────────────────────────────────────────────────
class PredictResponse(BaseModel):
    temperature: float        # °C
    production: float         # tonnes
    energy_kwh: float         # kWh
    manpower: int             # workers needed
    energy_cost_usd: float    # USD
    efficiency_score: float   # 0-100 %


# ─── Helper: safe label encoding ──────────────────────────────────────────────
def _encode(encoder_key: str, value: str) -> int:
    enc = energy_encoders[encoder_key]
    classes = list(enc.classes_)
    if value not in classes:
        # fall back to first class instead of raising
        return 0
    return int(enc.transform([value])[0])


# ─── Predict endpoint ─────────────────────────────────────────────────────────
@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    # 1. Temperature prediction
    # Features: [workpiece_weight, workpiece_weight*0.98, alloy_speed,
    #            water_consumption, water_consumption*0.1, swing_frequency,
    #            num_crystallizer, num_stream, cast_in_row]
    X_temp = np.array([[
        req.workpiece_weight,
        req.workpiece_weight * 0.98,
        req.alloy_speed,
        req.water_consumption,
        req.water_consumption * 0.1,
        req.swing_frequency,
        req.num_crystallizer,
        req.num_stream,
        req.cast_in_row,
    ]])
    temperature = float(model_temperature.predict(X_temp)[0])

    # 2. Production prediction
    # Features: [workpiece_weight, cast_in_row, temperature_predicted,
    #            metal_residue_grab1, alloy_speed, water_consumption,
    #            swing_frequency, crystallizer_movement, num_crystallizer,
    #            num_stream, P_pct, Si_pct, C_pct, Mn_pct, Cu_pct]
    X_prod = np.array([[
        req.workpiece_weight,
        req.cast_in_row,
        temperature,
        req.metal_residue_grab1,
        req.alloy_speed,
        req.water_consumption,
        req.swing_frequency,
        req.crystallizer_movement,
        req.num_crystallizer,
        req.num_stream,
        req.P_pct,
        req.Si_pct,
        req.C_pct,
        req.Mn_pct,
        req.Cu_pct,
    ]])
    production = float(model_production.predict(X_prod)[0])

    # 3. Energy prediction
    # Features: [lagging_reactive, leading_reactive, co2, lagging_pf,
    #            leading_pf, nsm, week_enc, day_enc, load_enc]
    week_enc = _encode("WeekStatus",  req.week_status)
    day_enc  = _encode("Day_of_week", req.day_of_week)
    load_enc = _encode("Load_Type",   req.load_type)

    X_en = np.array([[
        req.lagging_reactive,
        req.leading_reactive,
        req.co2,
        req.lagging_pf,
        req.leading_pf,
        req.nsm,
        week_enc,
        day_enc,
        load_enc,
    ]])
    energy_kwh = float(model_energy.predict(X_en)[0])

    # 4. Derived metrics
    manpower        = int(round(production * WORKERS_PER_TONNE * 1000))
    energy_cost_usd = round(energy_kwh * 0.12, 2)
    efficiency_score = min(100.0, round(production / 170.0 * 100, 2))

    return PredictResponse(
        temperature=round(temperature, 2),
        production=round(production, 2),
        energy_kwh=round(energy_kwh, 2),
        manpower=manpower,
        energy_cost_usd=energy_cost_usd,
        efficiency_score=efficiency_score,
    )


# ─── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "Steel Plant Optimization API"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ─── Dev server entry point ───────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
