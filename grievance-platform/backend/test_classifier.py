import joblib
from app.ml.classifier import MODEL_PATH

pipeline = joblib.load(MODEL_PATH)

tests = [
    "No water supply in our area for the last three days",
    "Streetlight near my house is not working",
    "Garbage has not been collected from our street",
    "There are potholes on the main road",
]

for t in tests:
    probs = pipeline.predict_proba([t])[0]
    print(t)
    for cls, p in sorted(zip(pipeline.classes_, probs), key=lambda x: -x[1]):
        print(f"   {cls}: {p:.2f}")
    print()