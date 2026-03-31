import pandas as pd
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel

router = APIRouter()

FEATURES = [
    'workpiece_weight',
    'cast_in_row',
    'num_crystallizer',
    'num_stream',
    'alloy_speed_f',
    'water_cons_f',
    'water_delta_f',
    'swing_frequency',
    'crystallizer_movement_f',
    'C_pct', 'Si_pct', 'Mn_pct', 'P_pct', 'Cu_pct'
]

BASE_WORKERS = {"Day Shift": 75, "Night Shift": 65, "Weekend": 50}

class PredictRequest(BaseModel):
    production_target:     float = 163.0
    cast_in_row:           int   = 18
    num_crystallizer:      int   = 12
    num_stream:            int   = 3
    casting_speed:         float = 2.0
    water_flow:            float = 2155.0
    water_temp_delta:      float = 9.0
    swing_frequency:       float = 200.0
    crystallizer_movement: float = 7.0
    C_pct:                 float = 0.19
    Si_pct:                float = 0.19
    Mn_pct:                float = 0.70
    P_pct:                 float = 0.01
    Cu_pct:                float = 0.04
    shift:                 str   = "Day Shift"

class PredictResponse(BaseModel):
    steel_temperature_celsius: float
    production_tonnes:         float
    yield_pct:                 float
    energy_mwh:                float
    rul_heats:                 float
    energy_cost_usd:           float
    workforce:                 int
    shift:                     str

@router.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, request: Request):
    state = request.app.state

    required = ["model_temperature", "model_production",
                "model_energy", "model_rul", "feature_names"]
    missing = [m for m in required if getattr(state, m, None) is None]
    if missing:
        raise HTTPException(
            status_code=503,
            detail=f"Models not yet loaded. Please upload pkl files to backend/models/. Missing: {missing}"
        )

    try:
        input_df = pd.DataFrame([{
            'workpiece_weight':        req.production_target,
            'cast_in_row':             req.cast_in_row,
            'num_crystallizer':        req.num_crystallizer,
            'num_stream':              req.num_stream,
            'alloy_speed_f':           req.casting_speed,
            'water_cons_f':            req.water_flow,
            'water_delta_f':           req.water_temp_delta,
            'swing_frequency':         req.swing_frequency,
            'crystallizer_movement_f': req.crystallizer_movement,
            'C_pct':                   req.C_pct,
            'Si_pct':                  req.Si_pct,
            'Mn_pct':                  req.Mn_pct,
            'P_pct':                   req.P_pct,
            'Cu_pct':                  req.Cu_pct,
        }])[state.feature_names]

        steel_temp_c      = float(state.model_temperature.predict(input_df)[0])
        # Cap at production_target: conservation of mass — you cannot cast more
        # steel than was in the ladle (real CCM yield is always < 100%).
        production_tonnes = min(float(state.model_production.predict(input_df)[0]),
                                req.production_target)
        yield_pct         = (production_tonnes / req.production_target) * 100
        energy_mwh        = float(state.model_energy.predict(input_df)[0])
        rul_heats         = float(state.model_rul.predict(input_df)[0])

        equipment_factor  = 1.0 + (req.num_stream - 3) * 0.04 + (req.num_crystallizer - 12) * 0.008
        workforce         = round(BASE_WORKERS.get(req.shift, 75) * equipment_factor)
        energy_cost_usd   = round(energy_mwh * 1000 * 0.07, 2)

        return PredictResponse(
            steel_temperature_celsius = round(steel_temp_c, 1),
            production_tonnes         = round(production_tonnes, 2),
            yield_pct                 = round(yield_pct, 2),
            energy_mwh                = round(energy_mwh, 2),
            rul_heats                 = round(rul_heats, 0),
            energy_cost_usd           = energy_cost_usd,
            workforce                 = workforce,
            shift                     = req.shift,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
