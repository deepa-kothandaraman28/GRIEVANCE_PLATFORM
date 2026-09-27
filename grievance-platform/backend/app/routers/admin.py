from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.auth import hash_password
from app.database import get_db
from app.deps import require_admin
from app.models import (
    Complaint, Department, Employee, RoleEnum, StatusEnum, StatusHistory,
    User, Assignment,
)
from app.schemas import (
    ComplaintListItem, ComplaintOut, DashboardStats, DepartmentOut,
    EmployeeCreate, EmployeeOut, ReassignRequest, AssignmentOut,
)
from app.services.assignment import score_candidates

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ---------- Dashboard ----------

@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    counts = {s: 0 for s in StatusEnum}
    rows = db.query(Complaint.status, func.count(Complaint.id)).group_by(Complaint.status).all()
    for status_value, count in rows:
        counts[status_value] = count

    # Average resolution time is computed in Python (rather than a
    # database-specific SQL function) to stay portable across DB backends.
    resolved_complaints = (
        db.query(Complaint)
        .filter(Complaint.status.in_([StatusEnum.resolved, StatusEnum.closed]))
        .all()
    )
    avg_hours = None
    if resolved_complaints:
        total_hours = sum(
            (c.updated_at - c.created_at).total_seconds() / 3600.0
            for c in resolved_complaints
        )
        avg_hours = round(total_hours / len(resolved_complaints), 1)

    return DashboardStats(
        total_complaints=sum(counts.values()),
        submitted=counts[StatusEnum.submitted],
        under_review=counts[StatusEnum.under_review],
        assigned=counts[StatusEnum.assigned],
        in_progress=counts[StatusEnum.in_progress],
        resolved=counts[StatusEnum.resolved],
        closed=counts[StatusEnum.closed],
        total_employees=db.query(Employee).count(),
        total_departments=db.query(Department).count(),
        avg_resolution_hours=avg_hours,
    )


# ---------- Departments ----------

@router.get("/departments", response_model=List[DepartmentOut])
def list_departments(db: Session = Depends(get_db), _: User = Depends(require_admin)):
    return db.query(Department).order_by(Department.name).all()


# ---------- Employees ----------

@router.get("/employees", response_model=List[EmployeeOut])
def list_employees(
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Employee)
    if department_id:
        query = query.filter(Employee.department_id == department_id)
    return query.all()


@router.post("/employees", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    department = db.query(Department).filter(Department.id == payload.department_id).first()
    if not department:
        raise HTTPException(status_code=404, detail="Department not found")

    user = User(
        name=payload.name,
        email=payload.email,
        phone=payload.phone,
        password_hash=hash_password(payload.password),
        role=RoleEnum.employee,
    )
    db.add(user)
    db.flush()

    employee = Employee(
        user_id=user.id,
        department_id=payload.department_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        max_active_cases=payload.max_active_cases,
    )
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee


# ---------- Complaints ----------

@router.get("/complaints", response_model=List[ComplaintListItem])
def list_all_complaints(
    status_filter: Optional[StatusEnum] = None,
    department_id: Optional[int] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    query = db.query(Complaint)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if department_id:
        query = query.filter(Complaint.department_id == department_id)
    return query.order_by(Complaint.created_at.desc()).all()


@router.get("/complaints/{complaint_id}", response_model=ComplaintOut)
def get_complaint(complaint_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return complaint


@router.get("/complaints/{complaint_id}/candidates", response_model=List[AssignmentOut])
def preview_candidates(complaint_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    """Shows the admin the full ranked scoring breakdown for every employee
    in the complaint's department, to make manual reassignment transparent."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if not complaint.department_id:
        raise HTTPException(status_code=400, detail="This complaint has no department assigned")

    employees = db.query(Employee).filter(Employee.department_id == complaint.department_id).all()
    ranked = score_candidates(employees, complaint.latitude, complaint.longitude)
    return [
        AssignmentOut(
            id=0,
            employee_id=s.employee.id,
            performance_component=s.performance_component,
            feedback_component=s.feedback_component,
            proximity_component=s.proximity_component,
            workload_component=s.workload_component,
            total_score=s.total_score,
            is_manual=True,
            created_at=complaint.created_at,
        )
        for s in ranked
    ]


@router.post("/complaints/{complaint_id}/reassign", response_model=ComplaintOut)
def reassign_complaint(
    complaint_id: int,
    payload: ReassignRequest,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.status in (StatusEnum.resolved, StatusEnum.closed):
        raise HTTPException(status_code=400, detail="Cannot reassign a resolved or closed complaint")

    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    previous_employee_id = complaint.assigned_employee_id
    complaint.assigned_employee_id = employee.id
    complaint.department_id = employee.department_id
    if complaint.status == StatusEnum.under_review:
        complaint.status = StatusEnum.assigned

    db.add(Assignment(
        complaint_id=complaint.id,
        employee_id=employee.id,
        performance_component=0,
        feedback_component=0,
        proximity_component=0,
        workload_component=0,
        total_score=0,
        is_manual=True,
        assigned_by_id=admin.id,
    ))
    db.add(StatusHistory(
        complaint_id=complaint.id,
        status=complaint.status,
        remarks=(
            payload.remarks
            or f"Manually reassigned by admin from employee #{previous_employee_id} to "
               f"{employee.user.name}."
        ),
        changed_by_id=admin.id,
    ))
    db.commit()
    db.refresh(complaint)
    return complaint
