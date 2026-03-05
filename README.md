# 🏭 Steel Plant ML Optimization Dashboard

A full-stack, ML-powered real-time dashboard for steel plant operations. Predicts **steel temperature**, **production output**, **yield**, **energy consumption**, **workforce requirements**, and **crystallizer remaining useful life** from casting and process parameters.

---

## 📐 Architecture

```
steel-plant-demo/
├── backend/               # FastAPI + ML models
│   ├── main.py            # API server
│   ├── requirements.txt
│   ├── model_temperature.pkl   # XGBoost
│   ├── model_production.pkl    # LightGBM
│   ├── model_yield.pkl         # LightGBM
│   ├── model_energy.pkl        # LightGBM
│   └── model_rul.pkl           # LightGBM
├── frontend/              # React + Vite dashboard
│   ├── src/
│   │   ├── App.jsx        # Main UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── Dockerfile             # Docker image for Render
├── render.yaml            # Render.com deployment config
├── vercel.json            # Vercel deployment config
└── README.md
```

---

## 🤖 ML Models

| Model | Algorithm | Target | Typical Range |
|-------|-----------|--------|---------------|
| `model_temperature` | XGBoost  | Molten steel temperature  | 1520–1620 °C |
| `model_production`  | LightGBM | Production output         | 100–185 t    |
| `model_yield`       | LightGBM | Yield percentage          | 69–100 %     |
| `model_energy`      | LightGBM | Energy consumption        | 23–90 MWh    |
| `model_rul`         | LightGBM | Crystallizer RUL          | 0–99000 heats|

---

## 🚀 Deployment

### Backend (Render)

1. Connect this repo to [render.com](https://render.com)
2. Render auto-detects `render.yaml` and the `Dockerfile` — no manual config needed
3. After your first Vercel deploy, set the env var **`FRONTEND_URL`** to your Vercel URL (e.g. `https://your-app.vercel.app`) in the Render dashboard
4. Your API will be available at: `https://steel-plant-api.onrender.com`

> **Note:** Free tier instances spin down after inactivity. First request may take ~30s (the frontend shows "WARMING UP" during this time).

### Frontend (Vercel)

1. Connect this repo to [vercel.com](https://vercel.com)
2. Vercel will use `vercel.json` for build config automatically — no root directory override needed
3. Set the env var **`VITE_API_URL`** to your Render backend URL (e.g. `https://steel-plant-api.onrender.com`)
   - In the Vercel dashboard: Settings → Environment Variables → add `VITE_API_URL`
   - Or create a Vercel secret `steel_plant_api_url` (referenced in `vercel.json`)

---

## 🛠 Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Dashboard: http://localhost:5173
```

---

## 🎨 UI Features

- **14 live input parameters** — sliders and number inputs with 400ms debounce
- **5 ML model predictions** — temperature, production, yield, energy, RUL
- **Warming-up indicator** — polls `/health` every 3s until all 5 models are loaded
- **Dark/light theme** toggle (dark by default)
- **Crystallizer Health card** with colour-coded wear status
- **Production Yield Score** progress bar

---

## 📡 API Reference

### `POST /api/predict`

**Request body:**

```json
{
  "production_target": 163.0,
  "cast_in_row": 18,
  "num_crystallizer": 12,
  "num_stream": 3,
  "casting_speed": 2.0,
  "water_flow": 2155.0,
  "water_temp_delta": 9.0,
  "swing_frequency": 200.0,
  "crystallizer_movement": 7.0,
  "C_pct": 0.19, "Si_pct": 0.19, "Mn_pct": 0.70, "P_pct": 0.01, "Cu_pct": 0.04,
  "shift": "Day Shift"
}
```

**Response:**

```json
{
  "steel_temperature_celsius": 1553.2,
  "production_tonnes": 161.45,
  "yield_pct": 88.50,
  "energy_mwh": 47.30,
  "rul_heats": 24500.0,
  "energy_cost_usd": 3311.0,
  "workforce": 75,
  "shift": "Day Shift"
}
```

### `GET /health`

Returns `{ "status": "ok", "models_loaded": [...] }` — the frontend polls this until `models_loaded` has 5 items before showing "LIVE".

---

## 📄 License

MIT — free to use, modify, and deploy.
