from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
from sklearn.linear_model import LinearRegression

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Forecast ----------

class ForecastIn(BaseModel):
    # {"Homework":0.2,"Midterm":0.3,"Final":0.5}
    weights: dict
    # {"Homework":[92,88,95], "Midterm":[81]}  (0–100)
    completed: dict
    # {"Homework":2, "Final":1}
    remaining: dict
    # optional per-category linear params and priors
    linear_params: dict | None = None   # {"Homework":{"alpha":0,"beta":1}, ...}
    priors: dict | None = None          # {"Homework":{"sigma":7}, ...}
    z: float = 1.28                     # interval width (approx. 80%)

@app.post("/api/forecast")
def forecast_linear(inp: ForecastIn):
    """
    Forecasting final grade using a weighted model with
    scikit-learn LinearRegression to estimate future scores.
    """
    pred_final = 0.0
    var_final = 0.0

    for cat, w in inp.weights.items():
        # Completed scores in this category as a numpy array
        done = np.array(inp.completed.get(cat, []), dtype=float)
        k_done = len(done)
        k_rem = int(inp.remaining.get(cat, 0))
        n_total = k_done + k_rem

        if n_total == 0:
            # no items at all in this category so skip
            continue

        # Mean of completed work
        mu_done = float(done.mean()) if k_done > 0 else 0.0

        # Observed standard deviation, if we have enough points
        sigma_obs = float(done.std(ddof=1)) if k_done > 1 else None

        # --- scikit-learn part: predict future scores ---
        # Defaults, in case we don't have enough data
        alpha = 0.0
        beta = 1.0
        mu_future = mu_done if k_done > 0 else 85.0  # fallback guess

        if k_done >= 2:
            # X = time indices [0, 1, 2, ...], y = scores
            X = np.arange(k_done).reshape(-1, 1)
            y = done.reshape(-1, 1)

            reg = LinearRegression()
            reg.fit(X, y)

            # Regression coefficients (for documentation/debugging)
            alpha = float(reg.intercept_[0])
            beta = float(reg.coef_[0][0])

            if k_rem > 0:
                # Predict scores for the remaining k_rem items
                next_indices = np.arange(k_done, k_done + k_rem).reshape(-1, 1)
                future_preds = reg.predict(next_indices).ravel()
                mu_future = float(future_preds.mean())
            else:
                mu_future = mu_done

        # If the client passed explicit linear_params, let them override
        if inp.linear_params and cat in inp.linear_params:
            lp = inp.linear_params[cat]
            alpha = float(lp.get("alpha", alpha))
            beta = float(lp.get("beta", beta))
            base = mu_done if k_done > 0 else 85.0
            mu_future = alpha + beta * base

        # ---- Combine completed and future into a category mean ----
        mu_cat = ((k_done * mu_done) + (k_rem * mu_future)) / n_total
        pred_final += w * mu_cat

        # ---- Uncertainty (variance) ----
        prior_sigma = float(((inp.priors or {}).get(cat, {})).get("sigma", 7.0))
        sigma_c = sigma_obs if sigma_obs is not None else prior_sigma

        if k_rem > 0:
            # Variance contribution from remaining items
            var_cat = ((k_rem / n_total) ** 2) * (sigma_c ** 2 / (k_rem + 1e-9))
        else:
            var_cat = 0.0

        var_final += (w ** 2) * var_cat

    # ---- Aggregate and return interval ----
    std_final = float(np.sqrt(max(var_final, 1e-9)))
    mean = pred_final
    p10 = mean - inp.z * std_final
    p90 = mean + inp.z * std_final

    return {
        "mean": mean,
        "p10": p10,
        "p90": p90,
        "std": std_final,
    }

# ---------- Scenario Solver ----------

class ScenarioIn(BaseModel):
    target: float      # desired final grade (0–100)
    weights: dict      # {"Homework":0.2,"Midterm":0.3,"Final":0.5}
    completed: dict    # {"Homework":[90, 80], "Midterm":[81]}
    remaining: dict    # {"Final":1, "Project":0, ...}


@app.post("/api/scenario")
def scenario_solver(inp: ScenarioIn):
    """
    Compute the minimum average needed on remaining work
    (across all categories with remaining items) to hit the target grade.
    
    Assumes:
      - scores are in [0,100]
      - weights sum to 1.0
    """
    target = float(inp.target)
    weights = inp.weights
    completed = inp.completed
    remaining = inp.remaining

    # Contribution from completed work so far
    current_total = 0.0
    remaining_weight = 0.0

    for cat, w in weights.items():
        done = completed.get(cat, [])
        k_done = len(done)
        k_rem = int(remaining.get(cat, 0))

        # Average of completed scores in this category (if any)
        if k_done > 0:
            avg_done = sum(done) / k_done
            current_total += w * avg_done

        # Total weight of categories that still have remaining work
        if k_rem > 0:
            remaining_weight += w

    # Case 1: nothing left to do.
    if remaining_weight == 0:
        return {
            "feasible": True,
            "needed": {},
            "note": f"All work completed. Current final ≈ {current_total:.1f}%."
        }

    # Overall average we must get on the remaining items
    needed_avg_remaining = (target - current_total) / remaining_weight

    # Case 2: already guaranteed the target
    if needed_avg_remaining <= 0:
        return {
            "feasible": True,
            "needed": {},
            "note": (
                f"Target already achieved. Even 0%% on remaining work still "
                f"keeps you at ≥ {target:.1f}%."
            ),
        }

    # Case 3: mathematically impossible (would require >100% average)
    if needed_avg_remaining > 100:
        return {
            "feasible": False,
            "needed": {},
            "note": (
                "Target unreachable; would require > 100% average on "
                "remaining work."
            ),
        }

    # Case 4: feasible, therefore it assigns same required average to each remaining category
    needed = {}
    for cat, w in weights.items():
        if int(remaining.get(cat, 0)) > 0:
            needed[cat] = float(min(max(needed_avg_remaining, 0.0), 100.0))

    return {
        "feasible": True,
        "needed": needed,
        "note": f"Need an average of about {needed_avg_remaining:.1f}% "
                "on remaining work.",
    }

