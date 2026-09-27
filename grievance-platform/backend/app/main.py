from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import Base, engine
from app.routers import auth_router, complaints, employees, admin

# Dev convenience: auto-create tables if they don't exist yet.
# For production, use a migration tool (e.g. Alembic) instead.
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI-Powered Public Grievance Management Platform",
    description="Register, classify, assign, and track public grievances end to end.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

app.include_router(auth_router.router)
app.include_router(complaints.router)
app.include_router(employees.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
