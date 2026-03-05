from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import numpy as np
import os

app = FastAPI(title="Steel Plant Optimizer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = os.path.dirname(__file__)

def _load(name):
    return joblib.load(os.path.join(BASE, name))

model_temperature = _load("model_temperature.pkl")
model_production  = _load("model_production.pkl")
model_energy      = _load("model_energy.pkl")
encoders          = _load("energy_encoders.pkl")
manpower          = _load("manpower_ratio.pkl")

# Temperature model features (10):
# ['steel_weight, tonn', 'workpiece_weight, tonn', 'num_crystallizer', 'num_stream',
#  'cast_in_row', 'alloy_speed, meter/minute', 'water_consumption, liter/minute',
#  'swing_frequency, amount/minute', 'crystallizer_movement, mm', 'resistance, tonn']

# Production model features (15):
# ['workpiece_weight_tonn', 'cast_in_row', 'steel_temperature_grab1_Celsius_deg',
#  'metal_residue_grab1_tonn', 'alloy_speed_meter_minute', 'water_consumption_liter_minute',
#  'swing_frequency_amount_minute', 'crystallizer_movement_mm', 'num_crystallizer',
#  'num_stream', 'P_pct', 'Si_pct', 'C_pct', 'Mnpct', 'Cu_pct']

# Energy model features (9):
# ['Lagging_Current_ReactivePower_kVarh', 'Leading_Current_Reactive_Power_kVarh',
#  'CO2tCO2', 'Lagging_Current_Power_Factor', 'Leading_Current_Power_Factor',
#  'NSM', 'WeekStatus_enc', 'Day_enc', 'Load_enc']

class PredictRequest(BaseModel):
    workpiece_weight: float = 163.0
    num_crystallizer: int = 12
    num_stream: int = 3
    cast_in_row: int = 18
    alloy_speed: float = 2.0
    water_consumption: float = 2155.0
    swing_frequency: float = 200.0
    crystallizer_movement: float = 7.0
    resistance: float = 5500.0
    metal_residue_grab1: float = 2.0
    P_pct: float = 0.015
    Si_pct: float = 0.25
    C_pct: float = 0.18
    Mn_pct: float = 0.80
    Cu_pct: float = 0.05
    lagging_reactive: float = 50.0
    leading_reactive: float = 30.0
    co2: float = 0.05
    lagging_pf: float = 0.85
    leading_pf: float = 0.90
    nsm: float = 43200.0
    week_status: str = "Weekday"
    day_of_week: str = "Monday"
    load_type: str = "Medium_Load"

@app.get("/")
def root():
    return {"status": "ok", "service": "Steel Plant Optimization API"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/predict")
def predict(req: PredictRequest):
    # --- Temperature (10 features) ---
    X_temp = np.array([[
        req.workpiece_weight,       # steel_weight, tonn
        req.workpiece_weight,       # workpiece_weight, tonn
        req.num_crystallizer,       # num_crystallizer
        req.num_stream,             # num_stream
        req.cast_in_row,            # cast_in_row
        req.alloy_speed,            # alloy_speed, meter/minute
        req.water_consumption,      # water_consumption, liter/minute
        req.swing_frequency,        # swing_frequency, amount/minute
        req.crystallizer_movement,  # crystallizer_movement, mm
        req.resistance              # resistance, tonn
    ]])
    temperature = float(model_temperature.predict(X_temp)[0])

    # --- Production (15 features) ---
    X_prod = np.array([[
        req.workpiece_weight,       # workpiece_weight_tonn
        req.cast_in_row,            # cast_in_row
        temperature,                # steel_temperature_grab1_Celsius_deg
        req.metal_residue_grab1,    # metal_residue_grab1_tonn
        req.alloy_speed,            # alloy_speed_meter_minute
        req.water_consumption,      # water_consumption_liter_minute
        req.swing_frequency,        # swing_frequency_amount_minute
        req.crystallizer_movement,  # crystallizer_movement_mm
        req.num_crystallizer,       # num_crystallizer
        req.num_stream,             # num_stream
        req.P_pct,                  # P_pct
        req.Si_pct,                 # Si_pct
        req.C_pct,                  # C_pct
        req.Mn_pct,                 # Mnpct
        req.Cu_pct                  # Cu_pct
    ]])
    production = float(model_production.predict(X_prod)[0])

    # --- Energy (9 features) ---
    week_enc = int(encoders['week'].transform([req.week_status])[0])
    day_enc  = int(encoders['day'].transform([req.day_of_week])[0])
    load_enc = int(encoders['load'].transform([req.load_type])[0])

    X_energy = np.array([[
        req.lagging_reactive,   # Lagging_Current_ReactivePower_kVarh
        req.leading_reactive,   # Leading_Current_Reactive_Power_kVarh
        req.co2,                # CO2tCO2
        req.lagging_pf,         # Lagging_Current_Power_Factor
        req.leading_pf,         # Leading_Current_Power_Factor
        req.nsm,                # NSM
        week_enc,               # WeekStatus_enc
        day_enc,                # Day_enc
        load_enc                # Load_enc
    ]])
    raw_energy = float(model_energy.predict(X_energy)[0])

    # Scale raw facility-interval output to realistic batch energy.
    # The energy model was trained on 15-min interval data (max ~15000 kWh).
    # Normalise to a 0-1 load factor, then multiply by industry benchmark:
    # 400 kWh/tonne is a conservative mid-range for EAF/CCM operations.
    ENERGY_PER_TONNE_KWH = 400
    load_factor = min(1.0, max(0.0, (raw_energy - 500) / (15000 - 500)))
    energy_kwh = production * ENERGY_PER_TONNE_KWH * (0.85 + 0.3 * load_factor)

    # --- Manpower ---
    # Industry-standard shift crew sizing for continuous casting operations.
    # Source: CCM benchmark data (50-120 workers depending on shift/automation).
    BASE_WORKERS = {'Day Shift': 75, 'Night Shift': 65, 'Weekend': 50}
    if req.week_status == 'Weekend':
        shift_key = 'Weekend'
    elif req.load_type == 'Maximum_Load':
        shift_key = 'Night Shift'
    else:
        shift_key = 'Day Shift'
    base = BASE_WORKERS[shift_key]
    equipment_factor = 1.0 + (req.num_stream - 3) * 0.04 + (req.num_crystallizer - 12) * 0.008
    wf_load_factor = 1.0 + (production - 163) / 163 * 0.15
    manpower_count = round(base * equipment_factor * wf_load_factor)

    return {
        "temperature": round(temperature, 1),
        "production": round(production, 2),
        "energy_kwh": round(energy_kwh, 1),
        "manpower": manpower_count,
        "num_crystallizer": req.num_crystallizer,
        "num_stream": req.num_stream,
        "energy_cost_usd": round(energy_kwh * 0.07, 2),
        "efficiency_score": round(min(100.0, (production / 170.0) * 100), 1)
    }
