import logging
import pickle
from concurrent.futures import ThreadPoolExecutor
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

MODELS = {
    "model_temperature": "model_temperature.pkl",
    "model_production":  "model_production.pkl",
    "model_yield":       "model_yield.pkl",
    "model_energy":      "model_energy.pkl",
    "model_rul":         "model_rul.pkl",
    "feature_names":     "feature_names.pkl",
    "energy_meta":       "energy_meta.pkl",
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    with ThreadPoolExecutor() as pool:
        futures = {key: pool.submit(load_pkl, fname) for key, fname in MODELS.items()}
        for key, future in futures.items():
            setattr(app.state, key, future.result())

    loaded = [k for k in MODELS if getattr(app.state, k, None) is not None]
    logging.info(f"Loaded: {loaded}")
    yield

app = FastAPI(title="Steel Plant ML API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers.predict import router
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"status": "ok", "message": "Steel Plant ML API"}

@app.get("/health")
def health():
    loaded = [k for k in ["model_temperature","model_production","model_yield",
                           "model_energy","model_rul"]
              if getattr(app.state, k, None) is not None]
    return {"status": "ok", "models_loaded": loaded}
