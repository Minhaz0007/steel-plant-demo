# 🏭 Steel Plant ML Optimization Dashboard

A full-stack, ML-powered real-time dashboard for steel plant operations. Predicts **steel temperature**, **production output**, **energy consumption**, and **workforce requirements** from casting and process parameters.

---

## 📐 Architecture

```
steel-plant-demo/
├── backend/               # FastAPI + ML models
│   ├── main.py            # API server
│   ├── requirements.txt
│   ├── model_temperature.pkl   # XGBoost
│   ├── model_production.pkl    # LightGBM
│   ├── model_energy.pkl        # LightGBM
│   ├── model_machines.pkl      # placeholder
│   ├── energy_encoders.pkl     # LabelEncoders
│   └── manpower_ratio.pkl      # dict
├── frontend/              # React + Vite dashboard
│   ├── src/
│   │   ├── App.jsx        # Main UI
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── vercel.json
│   └── .env.example
├── render.yaml            # Render.com deployment config
├── .gitignore
└── README.md
```

---

## 🤖 ML Models

| Model | Algorithm | Target | Typical Range |
|-------|-----------|--------|---------------|
| `model_temperature` | XGBoost | Molten steel temperature | ~1520–1565 °C |
| `model_production` | LightGBM | Production output | ~100–180 tonnes |
| `model_energy` | LightGBM | Energy consumption | ~2,000–12,000 kWh |
| `model_machines` | LightGBM | (loaded, not used) | — |

### Feature Engineering

**Temperature model** inputs: `[workpiece_weight, workpiece_weight×0.98, alloy_speed, water_consumption, water_consumption×0.1, swing_frequency, num_crystallizer, num_stream, cast_in_row]`

**Production model** inputs: `[workpiece_weight, cast_in_row, temperature_predicted, metal_residue_grab1, alloy_speed, water_consumption, swing_frequency, crystallizer_movement, num_crystallizer, num_stream, P_pct, Si_pct, C_pct, Mn_pct, Cu_pct]`

**Energy model** inputs: `[lagging_reactive, leading_reactive, co2, lagging_pf, leading_pf, nsm, week_enc, day_enc, load_enc]`

### Derived metrics

| Metric | Formula |
|--------|---------|
| Manpower | `production_tonnes × workers_per_tonne × 1000` |
| Energy cost | `energy_kwh × $0.12` |
| Efficiency score | `min(100, production / 170 × 100)` |

---

## 🚀 Deployment

### Backend → Render.com (Free Tier)

1. Create a free account at [render.com](https://render.com)
2. Connect your GitHub repository
3. Choose **Web Service** and point it to this repo
4. Render auto-detects `render.yaml` — no manual config needed
5. Your API URL will be: `https://steel-plant-api.onrender.com`

> **Note:** Free tier instances spin down after inactivity. First request may take ~30s.

### Frontend → Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. From the `frontend/` folder:
   ```bash
   cp .env.example .env
   # Edit .env and set VITE_API_URL to your Render URL
   vercel --prod
   ```
3. Or connect the repo in [vercel.com](https://vercel.com) dashboard
   - Set **Root Directory** → `frontend`
   - Add env var: `VITE_API_URL=https://your-render-url.onrender.com`

---

## 🛠 Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # set VITE_API_URL=http://localhost:8000
npm run dev
# Dashboard: http://localhost:5173
```

---

## 🎨 UI Design

- **Background:** Deep charcoal `#0a0a0f` with animated grid overlay
- **Accents:** Electric blue `#00d4ff` · Amber `#ffaa00` · Green `#00ff88`
- **Fonts:** Rajdhani (headers) · JetBrains Mono (numbers)
- **Live predictions** with 300ms debounce on every slider change
- **Temperature color coding:** Blue <1530°C · Green 1530–1560°C · Red >1560°C
- **Skeleton loading** animation while fetching

---

## 📡 API Reference

### `POST /predict`

**Request body** (all fields have defaults):

```json
{
  "workpiece_weight": 163.0,
  "num_crystallizer": 12,
  "num_stream": 3,
  "cast_in_row": 5,
  "alloy_speed": 1.2,
  "water_consumption": 280.0,
  "swing_frequency": 120.0,
  "crystallizer_movement": 5.0,
  "metal_residue_grab1": 2.0,
  "P_pct": 0.02, "Si_pct": 0.25, "C_pct": 0.15, "Mn_pct": 1.0, "Cu_pct": 0.05,
  "lagging_reactive": 50.0, "leading_reactive": 25.0, "co2": 2.5,
  "lagging_pf": 0.85, "leading_pf": 0.90, "nsm": 50.0,
  "week_status": "Weekday",
  "day_of_week": "Monday",
  "load_type": "Medium_Load"
}
```

**Response:**

```json
{
  "temperature": 1541.23,
  "production": 152.87,
  "energy_kwh": 4823.50,
  "manpower": 53504,
  "energy_cost_usd": 578.82,
  "efficiency_score": 89.92
}
```

---

## 📄 License

MIT — free to use, modify, and deploy.
