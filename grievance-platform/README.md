# AI-Powered Public Grievance Management Platform

Full-stack implementation: **React + Tailwind** frontend, **FastAPI** backend,
**MySQL** storage, **scikit-learn** (TF-IDF + Logistic Regression) complaint
classifier, and a Haversine-based weighted scoring algorithm for automatic
employee assignment.

## Features

- **Public users**: register/login, submit complaints (text + location + photo/video
  proof), track status history, rate resolutions.
- **Automatic classification**: complaint text → TF-IDF features → Logistic
  Regression → department (Water Supply, Electricity, Drainage, Roads,
  Sanitation, Street Light).
- **Automatic assignment**: best employee in the department chosen by a weighted
  score — 40% performance, 25% citizen feedback, 20% proximity (Haversine
  distance), 15% workload availability.
- **Employees**: dashboard of assigned complaints, status transitions
  (Assigned → In Progress → Resolved → Closed) with remarks and proof upload.
- **Admins**: dashboard of stats/departments/employees, full complaint list,
  transparent scoring breakdown for every candidate employee, and manual
  reassignment.
- **Auth**: JWT + role-based access control (citizen / employee / admin).

## Project layout

```
backend/
  app/
    main.py            FastAPI app, CORS, router registration
    config.py           Settings (reads .env)
    database.py          SQLAlchemy engine/session
    models.py             ORM models (User, Department, Employee, Complaint,
                            StatusHistory, Feedback, Assignment)
    schemas.py             Pydantic request/response schemas
    auth.py                 Password hashing + JWT
    deps.py                  get_current_user / require_role dependencies
    seed.py                   Seeds departments, an admin login and sample employees
    ml/
      training_data.csv        Labeled sample complaints (~85 rows, 6 categories)
      train_model.py             Trains TfidfVectorizer + LogisticRegression pipeline
      classifier.py                Loads/trains the model, predicts department
    services/
      assignment.py               Haversine distance + weighted scoring algorithm
    routers/
      auth_router.py, complaints.py, employees.py, admin.py
  database/                          (schema is created via SQLAlchemy models)
  .env.example
  requirements.txt

frontend/
  src/
    api/client.js         Axios client + every API call used by the pages
    context/AuthContext.jsx   Login/logout/session state
    components/            Navbar, ProtectedRoute, StatusBadge, StatusTimeline, ScoreBar
    pages/
      Home, Login, Register
      CitizenDashboard, SubmitComplaint, ComplaintDetail
      EmployeeDashboard, EmployeeComplaintDetail
      AdminDashboard, AdminComplaints, AdminComplaintDetail, AdminEmployees
```

## Backend setup

```bash
cd backend
python -m venv venv && source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# edit .env: set DATABASE_URL to your MySQL instance, and a real SECRET_KEY

# create the MySQL database first, e.g.:
#   mysql -u root -p -e "CREATE DATABASE grievance_db;"

python -m app.ml.train_model   # trains and saves app/ml/model.joblib
python -m app.seed             # creates departments, admin login, sample employees

uvicorn app.main:app --reload --port 8000
```

Seeded logins (change the passwords after first login):
- Admin: `admin@grievance.gov` / `Admin@123`
- Employees: `<department_slug>.emp1@grievance.gov` / `Employee@123` (e.g. `water_supply.emp1@grievance.gov`)

API docs are auto-served at `http://localhost:8000/docs`.

## Frontend setup

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173, proxies /api and /uploads to :8000
```

Register a new account through the UI to try the citizen flow (submission →
auto-classification → auto-assignment), then sign in as one of the seeded
employee or admin accounts to see the other two dashboards.

## Notes on the ML model

`training_data.csv` is a small hand-written sample set (about 85 labeled
complaints) meant to make the pipeline work end-to-end out of the box. For a
real deployment, replace/expand it with real historical complaint text before
retraining — more data per category will meaningfully improve classification
accuracy. The pipeline itself (`TfidfVectorizer` → `LogisticRegression`,
`class_weight="balanced"`) is production-shaped; only the dataset size is a
placeholder.

## Notes on the assignment algorithm

Each of the four factors is normalized to 0–1 before weighting:
- performance / feedback: divided by their max (100 and 5)
- proximity: min-max normalized Haversine distance across the candidate pool
  (closest candidate scores 1.0)
- workload: `1 - active_cases / max_active_cases`

`total_score = 100 × (0.40·performance + 0.25·feedback + 0.20·proximity + 0.15·workload)`

Employees at full capacity are only considered if the whole department is
full, so a complaint is never left unassigned when staff exist. The admin's
"reassign" screen shows this same breakdown for every candidate, so a manual
override is never a black box.
