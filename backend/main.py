import logging
import pickle
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

load_dotenv()

MODELS_DIR = Path(__file__).parent
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

def load_pkl(filename):
    try:
        with open(MODELS_DIR / filename, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        logging.warning(f"Could not load {filename}: {e}")
        return None

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model_temperature = load_pkl("model_temperature.pkl")
    app.state.model_production  = load_pkl("model_production.pkl")
    app.state.model_yield       = load_pkl("model_yield.pkl")
    app.state.model_energy      = load_pkl("model_energy.pkl")
    app.state.model_rul         = load_pkl("model_rul.pkl")
    app.state.feature_names     = load_pkl("feature_names.pkl")
    app.state.energy_meta       = load_pkl("energy_meta.pkl")

    loaded = [k for k in ["model_temperature","model_production","model_yield",
                           "model_energy","model_rul","feature_names","energy_meta"]
              if getattr(app.state, k, None) is not None]
    logging.info(f"Loaded: {loaded}")
    yield

app = FastAPI(title="Steel Plant ML API", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.predict import router
app.include_router(router, prefix="/api")

@app.get("/health")
def health():
    loaded = [k for k in ["model_temperature","model_production","model_yield",
                           "model_energy","model_rul"]
              if getattr(app.state, k, None) is not None]
    return {"status": "ok", "models_loaded": loaded}
