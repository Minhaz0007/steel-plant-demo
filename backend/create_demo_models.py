"""
Script to create demo ML model pkl files for the Steel Plant Optimization Dashboard.
Run once to generate the pkl files needed by main.py.
"""
import numpy as np
import joblib
from sklearn.preprocessing import LabelEncoder

np.random.seed(42)

# ── 1. Temperature model (XGBoost) ──────────────────────────────────────────
try:
    from xgboost import XGBRegressor

    # Feature order: [workpiece_weight, workpiece_weight*0.98, alloy_speed,
    #                 water_consumption, water_consumption*0.1, swing_frequency,
    #                 num_crystallizer, num_stream, cast_in_row]
    n = 500
    ww   = np.random.uniform(150, 185, n)
    asp  = np.random.uniform(0.5, 2.0, n)
    wc   = np.random.uniform(100, 500, n)
    sf   = np.random.uniform(50, 200, n)
    nc   = np.random.randint(1, 25, n).astype(float)
    ns   = np.random.randint(1, 7,  n).astype(float)
    cir  = np.random.randint(1, 21, n).astype(float)

    X_temp = np.column_stack([ww, ww * 0.98, asp, wc, wc * 0.1, sf, nc, ns, cir])
    y_temp = (
        1520
        + ww * 0.05
        + asp * 8
        - wc * 0.01
        + sf * 0.05
        + nc * 0.3
        + ns * 0.5
        + cir * 0.2
        + np.random.normal(0, 2, n)
    )

    model_temp = XGBRegressor(n_estimators=100, max_depth=4, random_state=42)
    model_temp.fit(X_temp, y_temp)
    joblib.dump(model_temp, "model_temperature.pkl")
    print("✓ model_temperature.pkl (XGBoost)")
except Exception as e:
    print(f"✗ model_temperature.pkl failed: {e}")

# ── 2. Production model (LightGBM) ──────────────────────────────────────────
try:
    from lightgbm import LGBMRegressor

    # Feature order: [workpiece_weight, cast_in_row, temperature_predicted,
    #                 metal_residue_grab1, alloy_speed, water_consumption,
    #                 swing_frequency, crystallizer_movement, num_crystallizer,
    #                 num_stream, P_pct, Si_pct, C_pct, Mn_pct, Cu_pct]
    n = 500
    ww   = np.random.uniform(150, 185, n)
    cir  = np.random.randint(1, 21, n).astype(float)
    tp   = np.random.uniform(1520, 1565, n)
    mrg  = np.random.uniform(0, 10, n)
    asp  = np.random.uniform(0.5, 2.0, n)
    wc   = np.random.uniform(100, 500, n)
    sf   = np.random.uniform(50, 200, n)
    cm   = np.random.uniform(1, 15, n)
    nc   = np.random.randint(1, 25, n).astype(float)
    ns   = np.random.randint(1, 7,  n).astype(float)
    p_p  = np.random.uniform(0.01, 0.05, n)
    si_p = np.random.uniform(0.1, 0.5, n)
    c_p  = np.random.uniform(0.01, 0.3, n)
    mn_p = np.random.uniform(0.5, 2.0, n)
    cu_p = np.random.uniform(0.01, 0.1, n)

    X_prod = np.column_stack([ww, cir, tp, mrg, asp, wc, sf, cm, nc, ns,
                               p_p, si_p, c_p, mn_p, cu_p])
    y_prod = (
        100
        + ww * 0.3
        + cir * 1.5
        + (tp - 1530) * 0.05
        + asp * 5
        + ns * 3
        + nc * 0.5
        - mrg * 0.3
        + np.random.normal(0, 2, n)
    )
    y_prod = np.clip(y_prod, 50, 200)

    model_prod = LGBMRegressor(n_estimators=100, max_depth=4, random_state=42, verbose=-1)
    model_prod.fit(X_prod, y_prod)
    joblib.dump(model_prod, "model_production.pkl")
    print("✓ model_production.pkl (LightGBM)")
except Exception as e:
    print(f"✗ model_production.pkl failed: {e}")

# ── 3. Energy model (LightGBM) ───────────────────────────────────────────────
try:
    from lightgbm import LGBMRegressor

    # Feature order: [lagging_reactive, leading_reactive, co2, lagging_pf,
    #                 leading_pf, nsm, week_enc, day_enc, load_enc]
    n = 500
    lr   = np.random.uniform(0, 100, n)
    ldr  = np.random.uniform(0, 50,  n)
    co2  = np.random.uniform(0, 5,   n)
    lpf  = np.random.uniform(0.5, 1.0, n)
    ldpf = np.random.uniform(0.5, 1.0, n)
    nsm  = np.random.uniform(0, 100, n)
    we   = np.random.randint(0, 2, n).astype(float)
    de   = np.random.randint(0, 7, n).astype(float)
    le   = np.random.randint(0, 3, n).astype(float)

    X_en = np.column_stack([lr, ldr, co2, lpf, ldpf, nsm, we, de, le])
    y_en = (
        2000
        + lr * 15
        + ldr * 8
        + co2 * 100
        + nsm * 5
        + le * 500
        + np.random.normal(0, 50, n)
    )
    y_en = np.clip(y_en, 500, 15000)

    model_en = LGBMRegressor(n_estimators=100, max_depth=4, random_state=42, verbose=-1)
    model_en.fit(X_en, y_en)
    joblib.dump(model_en, "model_energy.pkl")
    print("✓ model_energy.pkl (LightGBM)")
except Exception as e:
    print(f"✗ model_energy.pkl failed: {e}")

# ── 4. Machines model (placeholder, not used for prediction) ─────────────────
try:
    from lightgbm import LGBMRegressor
    model_mach = LGBMRegressor(n_estimators=10, random_state=42, verbose=-1)
    X_dummy = np.random.rand(50, 5)
    y_dummy = np.random.rand(50)
    model_mach.fit(X_dummy, y_dummy)
    joblib.dump(model_mach, "model_machines.pkl")
    print("✓ model_machines.pkl (placeholder LightGBM)")
except Exception as e:
    print(f"✗ model_machines.pkl failed: {e}")

# ── 5. Energy encoders ───────────────────────────────────────────────────────
try:
    le_week = LabelEncoder()
    le_week.fit(["Weekday", "Weekend"])

    le_day = LabelEncoder()
    le_day.fit(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])

    le_load = LabelEncoder()
    le_load.fit(["Light_Load", "Maximum_Load", "Medium_Load"])

    encoders = {
        "WeekStatus":   le_week,
        "Day_of_week":  le_day,
        "Load_Type":    le_load,
    }
    joblib.dump(encoders, "energy_encoders.pkl")
    print("✓ energy_encoders.pkl")
except Exception as e:
    print(f"✗ energy_encoders.pkl failed: {e}")

# ── 6. Manpower ratio ────────────────────────────────────────────────────────
try:
    manpower = {"workers_per_tonne": 0.35}
    joblib.dump(manpower, "manpower_ratio.pkl")
    print("✓ manpower_ratio.pkl")
except Exception as e:
    print(f"✗ manpower_ratio.pkl failed: {e}")

print("\nAll demo model files created successfully!")
