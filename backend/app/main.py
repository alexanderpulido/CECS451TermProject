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
    completed: dict            # {"Homework":[92,88,95], "Midterm":[81]}  (0–100)
    remaining: dict            # {"Homework":2, "Final":1}
    # set per-category linear params and priors
    linear_params: dict | None = None   # {"Homework":{"alpha":0,"beta":1}, ...}
    priors: dict | None = None          # {"Homework":{"sigma":7}, ...}
    z: float = 1.28                     # interval width (≈80%)

@app.post("/api/forecast")
def forecast_linear(inp: ForecastIn):
    pred_final = 0.0
    var_final = 0.0

    for cat, w in inp.weights.items():
        done = np.array(inp.completed.get(cat, []), dtype=float)
        k_done = len(done)
        k_rem = int(inp.remaining.get(cat, 0))
        n_total = k_done + k_rem
        if n_total == 0:
            continue

        # observed mean and std
        mu_done = float(done.mean()) if k_done > 0 else 0.0
        sigma_obs = float(done.std(ddof=1)) if k_done > 1 else None

        # linear expectation for future
        params = (inp.linear_params or {}).get(cat, {})
        alpha = float(params.get("alpha", 0.0))
        beta  = float(params.get("beta", 1.0))
        mu_future = alpha + beta * (mu_done if k_done > 0 else 85.0)

        # blended category mean
        mu_cat = ((k_done * mu_done) + (k_rem * mu_future)) / n_total
        pred_final += w * mu_cat

        # uncertainty for category: use observed sigma or prior
        prior_sigma = float(((inp.priors or {}).get(cat, {})).get("sigma", 7.0))
        sigma_c = sigma_obs if sigma_obs is not None else prior_sigma

        # variance of the blended estimate, scaled by weight
        # intuition: more remaining items -> more uncertainty
        if k_rem > 0:
            # a simple variance model for now for the mean of remaining items
            var_cat = ((k_rem / n_total) ** 2) * (sigma_c ** 2 / (k_rem + 1e-9))
        else:
            var_cat = 0.0

        var_final += (w ** 2) * var_cat

    std_final = float(np.sqrt(max(var_final, 1e-9)))
    low = pred_final - inp.z * std_final
    med = pred_final
    high = pred_final + inp.z * std_final

    return {"mean": med, "p10": low, "p90": high, "std": std_final} # p are the percentiles
