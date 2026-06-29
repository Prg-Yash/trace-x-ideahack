import joblib
from pathlib import Path

for p in Path("apps/ai-ml/models").glob("*.pkl"):
    try:
        m = joblib.load(p)
        print(f"\nModel {p.name}: type={type(m)}")
        if isinstance(m, dict):
            print("  keys:", m.keys())
            for k, v in m.items():
                print(f"    {k}: {type(v)}")
    except Exception as e:
        print(f"\nModel {p.name}: failed to load ({e})")
