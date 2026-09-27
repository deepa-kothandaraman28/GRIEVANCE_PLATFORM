from typing import List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_citizen
from app.ml.classifier import predict_department
from app.models import Complaint, Department, Feedback, StatusEnum, StatusHistory, User, Assignment
from app.schemas import ComplaintOut, ComplaintListItem, FeedbackCreate, FeedbackOut
from app.services.assignment import select_best_employee
from app.utils import save_upload

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


@router.post("", response_model=ComplaintOut, status_code=201)
def submit_complaint(
    title: str = Form(...),
    description: str = Form(...),
    address: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    proof: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen),
):
    proof_path = save_upload(proof, "complaints") if proof else None

    # 1. Classify complaint text -> category -> department (TF-IDF + Logistic Regression)
    department_name = predict_department(f"{title}. {description}")
    department = db.query(Department).filter(Department.name == department_name).first()

    complaint = Complaint(
        citizen_id=current_user.id,
        title=title,
        description=description,
        category=department_name,
        department_id=department.id if department else None,
        address=address,
        latitude=latitude,
        longitude=longitude,
        proof_path=proof_path,
        status=StatusEnum.under_review,
    )
    db.add(complaint)
    db.flush()  # get complaint.id before commit

    db.add(StatusHistory(
        complaint_id=complaint.id,
        status=StatusEnum.submitted,
        remarks="Complaint submitted by citizen.",
        changed_by_id=current_user.id,
    ))
    db.add(StatusHistory(
        complaint_id=complaint.id,
        status=StatusEnum.under_review,
        remarks=f"Automatically classified as '{department_name}' by the ML model.",
        changed_by_id=None,
    ))

    # 2. Auto-assign the best-scoring employee in that department
    if department:
        best = select_best_employee(db, department.id, latitude, longitude)
        if best:
            complaint.assigned_employee_id = best.employee.id
            complaint.status = StatusEnum.assigned
            db.add(Assignment(
                complaint_id=complaint.id,
                employee_id=best.employee.id,
                performance_component=best.performance_component,
                feedback_component=best.feedback_component,
                proximity_component=best.proximity_component,
                workload_component=best.workload_component,
                total_score=best.total_score,
                is_manual=False,
            ))
            db.add(StatusHistory(
                complaint_id=complaint.id,
                status=StatusEnum.assigned,
                remarks=f"Auto-assigned to {best.employee.user.name} "
                        f"(score {best.total_score:.1f}/100).",
                changed_by_id=None,
            ))

    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("/my", response_model=List[ComplaintListItem])
def my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen),
):
    return (
        db.query(Complaint)
        .filter(Complaint.citizen_id == current_user.id)
        .order_by(Complaint.created_at.desc())
        .all()
    )


@router.get("/{complaint_id}", response_model=ComplaintOut)
def get_complaint(
    complaint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")

    is_owner = complaint.citizen_id == current_user.id
    is_assigned_employee = (
        complaint.assigned_employee
        and complaint.assigned_employee.user_id == current_user.id
    )
    is_admin = current_user.role.value == "admin"

    if not (is_owner or is_assigned_employee or is_admin):
        raise HTTPException(status_code=403, detail="You do not have access to this complaint")

    return complaint


@router.post("/{complaint_id}/feedback", response_model=FeedbackOut, status_code=201)
def submit_feedback(
    complaint_id: int,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_citizen),
):
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
    if complaint.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only review your own complaints")
    if complaint.status not in (StatusEnum.resolved, StatusEnum.closed):
        raise HTTPException(status_code=400, detail="Feedback can only be left once a complaint is resolved")
    if complaint.feedback:
        raise HTTPException(status_code=400, detail="Feedback has already been submitted for this complaint")
    if not complaint.assigned_employee_id:
        raise HTTPException(status_code=400, detail="This complaint has no assigned employee to review")

    feedback = Feedback(
        complaint_id=complaint.id,
        citizen_id=current_user.id,
        employee_id=complaint.assigned_employee_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(feedback)

    # Roll the new rating into the employee's running average so future
    # assignment scoring reflects the latest citizen sentiment.
    employee = complaint.assigned_employee
    prior_feedback_count = (
        db.query(Feedback).filter(Feedback.employee_id == employee.id).count()
    )
    employee.avg_rating = (
        (employee.avg_rating * prior_feedback_count) + payload.rating
    ) / (prior_feedback_count + 1)

    db.commit()
    db.refresh(feedback)
    return feedback
