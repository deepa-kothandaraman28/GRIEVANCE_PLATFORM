"""
One-time (or repeatable) seed script.

Run with:
    python -m app.seed

Creates the six departments, one admin login, and 2 sample employees per
department so the auto-assignment algorithm has real candidates to score.
Safe to re-run - it skips anything that already exists.
"""
from app.auth import hash_password
from app.database import Base, engine, SessionLocal
from app.models import Department, Employee, RoleEnum, User

DEPARTMENTS = [
    ("Water Supply", "Pipelines, tankers, water quality and pressure issues"),
    ("Electricity", "Power outages, transformers, wiring and connection issues"),
    ("Drainage", "Sewage, storm water drains and flooding"),
    ("Roads", "Potholes, road damage, signals and footpaths"),
    ("Sanitation", "Garbage collection, public toilets and waste dumping"),
    ("Street Light", "Non-functional or damaged street lighting"),
]

# Roughly spread around Perambalur, Tamil Nadu so the Haversine proximity
# scoring has meaningfully different distances to work with.
BASE_LAT, BASE_LNG = 11.2333, 78.8833
SAMPLE_OFFSETS = [(0.01, 0.01), (-0.02, 0.015)]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        dept_objs = {}
        for name, desc in DEPARTMENTS:
            dept = db.query(Department).filter(Department.name == name).first()
            if not dept:
                dept = Department(name=name, description=desc)
                db.add(dept)
                db.flush()
            dept_objs[name] = dept

        if not db.query(User).filter(User.email == "admin@grievance.gov").first():
            admin_user = User(
                name="Platform Administrator",
                email="admin@grievance.gov",
                phone="9999999999",
                password_hash=hash_password("Admin@123"),
                role=RoleEnum.admin,
            )
            db.add(admin_user)
            print("Created admin login -> admin@grievance.gov / Admin@123")

        for name, dept in dept_objs.items():
            slug = name.lower().replace(" ", "_")
            for i, (dlat, dlng) in enumerate(SAMPLE_OFFSETS, start=1):
                email = f"{slug}.emp{i}@grievance.gov"
                if db.query(User).filter(User.email == email).first():
                    continue
                user = User(
                    name=f"{name} Officer {i}",
                    email=email,
                    phone="9000000000",
                    password_hash=hash_password("Employee@123"),
                    role=RoleEnum.employee,
                )
                db.add(user)
                db.flush()
                db.add(Employee(
                    user_id=user.id,
                    department_id=dept.id,
                    latitude=BASE_LAT + dlat,
                    longitude=BASE_LNG + dlng,
                    performance_score=70 + (i * 5),
                    avg_rating=3.8 + (i * 0.2),
                    max_active_cases=10,
                ))
                print(f"Created employee login -> {email} / Employee@123")

        db.commit()
        print("Seeding complete.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
