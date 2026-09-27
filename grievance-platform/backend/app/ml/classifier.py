import os
import joblib

from app.ml.train_model import train, MODEL_PATH

# Maps the ML model's predicted category label directly to a department name
# stored in the `departments` table. Kept as a simple 1:1 mapping here; if the
# taxonomy ever diverges (e.g. multiple categories feeding one department),
# extend this dict rather than the model's label set.
CATEGORY_TO_DEPARTMENT = {
    "Water Supply": "Water Supply",
    "Electricity": "Electricity",
    "Drainage": "Drainage",
    "Roads": "Roads",
    "Sanitation": "Sanitation",
    "Street Light": "Street Light",
}

_model = None


def _get_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            train()
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_category(text: str) -> str:
    """Classify raw complaint description text into one of the known
    department categories using the TF-IDF + Logistic Regression pipeline."""
    model = _get_model()
    return model.predict([text])[0]


def predict_department(text: str) -> str:
    category = predict_category(text)
    return CATEGORY_TO_DEPARTMENT.get(category, category)
