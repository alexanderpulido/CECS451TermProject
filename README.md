# CECS 451 Term Project Team 3 Fall 2025
AI Grade Predictor &amp; Planner, an application that uses machine learning and natural language processing to track grades, forecast final grades, and visualize their predicted grades.

## Tech Stack
| Layer | Framework / Tools | Purpose |
|-------|-------------------|----------|
| **Frontend** | React + Vite + TypeScript | UI and grade dashboard |
| **State / Storage** | Zustand + Dexie.js | Local data + app state |
| **Backend** | FastAPI + scikit-learn + NumPy | Forecasting API & logic |
| **Visualization** | Recharts | Graphs and probability bands |

---


## Local Development Setup

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The app will start on http://localhost:5173
(or 5174 if 5173 is taken).

### Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # (Windows: .venv\Scripts\activate)
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The API will run at http://localhost:8000

