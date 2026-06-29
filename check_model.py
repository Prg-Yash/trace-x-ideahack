import joblib
from pathlib import Path

p = Path("apps/ai-ml/models/smurf_model.pkl")
m = joblib.load(p)
print("Type:", type(m))
if isinstance(m, dict):
    print("Keys:", m.keys())
    for k, v in m.items():
        print(f"  {k}: {type(v)}")
