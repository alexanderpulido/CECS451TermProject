from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ForecastIn(BaseModel):
    weights: dict              # {"Homework":0.2,"Midterm":0.3,"Final":0.5}
    completed: dict            # {"Homework":[92,88,95], "Midterm":[81]}
    remaining: dict            # {"Homework":2, "Final":1}
    priors: dict | None = None # {"Homework":{"mu":90,"sigma":5}, ...}

@app.get("/health")
def health(): return {"ok": True}

@app.post("/api/forecast")
def forecast(inp: ForecastIn):
    # Very simple Monte Carlo per-category (replace with quantile/Bayesian later)
    sims = 10_000
    totals = []
    for _ in range(sims):
        total = 0.0
        for cat, w in inp.weights.items():
            done = inp.completed.get(cat, [])
            k_rem = inp.remaining.get(cat, 0)
            mu, sigma = 85, 7
            if inp.priors and cat in inp.priors:
                mu = inp.priors[cat].get("mu", mu)
                sigma = inp.priors[cat].get("sigma", sigma)
            future = list(np.clip(np.random.normal(mu, sigma, k_rem), 0, 100))
            cat_scores = done + future
            if len(cat_scores) > 0:
                total += w * (np.mean(cat_scores))
        totals.append(total)
    totals = np.array(totals)
    return {
        "mean": float(np.mean(totals)),
        "p10": float(np.percentile(totals, 10)),
        "p50": float(np.percentile(totals, 50)),
        "p90": float(np.percentile(totals, 90))
    }

class ScenarioIn(BaseModel):
    target: float
    weights: dict
    completed_avgs: dict
    remaining_items: dict      # {"Homework":[2], "Final":[1]}
    bounds: dict = {"min":50,"max":100}

@app.post("/api/scenario")
def scenario(inp: ScenarioIn):
    # Greedy: push high-weight categories toward target first
    plan = {}
    current = sum(inp.weights.get(c,0)*v for c,v in inp.completed_avgs.items())
    needed = inp.target - current
    if needed <= 0: return {"plan": {}, "feasible": True}

    items = []
    for c, arr in inp.remaining_items.items():
        for _ in arr:
            items.append((c, inp.weights.get(c,0)))
    items.sort(key=lambda x: x[1], reverse=True)

    for c, w in items:
        if needed <= 0: break
        gain = w * (inp.bounds["max"] - inp.completed_avgs.get(c, 0))
        score = inp.bounds["max"]
        plan.setdefault(c, []).append(score)
        needed -= w * (score - inp.completed_avgs.get(c,0))

    return {"plan": plan, "feasible": needed <= 0}
