from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_employee
from app.models import Complaint, Employee, StatusEnum, StatusHistory, User
from app.schemas import ComplaintOut, ComplaintListItem, EmployeeOut
from app.utils import save_upload

router = APIRouter(prefix="/api/employees", tags=["employees"])


def _get_employee_or_404(db: Session, user: User) -> Employee:
    employee = db.query(Employee).filter(Employee.user_id == user.id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="No employee profile found for this account")
    return employee


@router.get("/me", response_model=EmployeeOut)
def my_profile(db: Session = Depends(get_db), current_user: User = Depends(require_employee)):
    return _get_employee_or_404(db, current_user)


@router.get("/me/complaints", response_model=List[ComplaintListItem])
def my_assigned_complaints(
    status_filter: Optional[StatusEnum] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    employee = _get_employee_or_404(db, current_user)
    query = db.query(Complaint).filter(Complaint.assigned_employee_id == employee.id)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    return query.order_by(Complaint.created_at.desc()).all()
@router.get("/me/complaints/{complaint_id}", response_model=ComplaintOut)
def get_assigned_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    employee = _get_employee_or_404(db, current_user)
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.assigned_employee_id == employee.id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found or not assigned to you")
    return complaint
VALID_TRANSITIONS = {
    StatusEnum.assigned: {StatusEnum.in_progress},
    StatusEnum.in_progress: {StatusEnum.resolved, StatusEnum.in_progress},
    StatusEnum.resolved: {StatusEnum.closed},
}
@router.patch("/me/complaints/{complaint_id}/status", response_model=ComplaintOut)
def update_status(
    complaint_id: int,
    status_value: StatusEnum = Form(..., alias="status"),
    remarks: Optional[str] = Form(None),
    proof: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employee),
):
    employee = _get_employee_or_404(db, current_user)
    complaint = (
        db.query(Complaint)
        .filter(Complaint.id == complaint_id, Complaint.assigned_employee_id == employee.id)
        .first()
    )
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found or not assigned to you")
    allowed_next = VALID_TRANSITIONS.get(complaint.status, set())
    if status_value not in allowed_next:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot move a complaint from '{complaint.status.value}' to '{status_value.value}'",
        )
    proof_path = save_upload(proof, "resolutions") if proof else None
    complaint.status = status_value
    db.add(StatusHistory(
        complaint_id=complaint.id,
        status=status_value,
        remarks=remarks,
        proof_path=proof_path,
        changed_by_id=current_user.id,
    ))
    db.commit()
    db.refresh(complaint)
    return complaint
