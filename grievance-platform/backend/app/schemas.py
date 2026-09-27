from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field

from app.models import RoleEnum, StatusEnum


# ---------- Auth / Users ----------

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str = Field(min_length=6)


class EmployeeCreate(UserCreate):
    department_id: int
    latitude: float
    longitude: float
    max_active_cases: int = 10


class UserOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str]
    role: RoleEnum

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleEnum
    user: UserOut


# ---------- Departments / Employees ----------

class DepartmentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]

    class Config:
        from_attributes = True


class EmployeeOut(BaseModel):
    id: int
    user: UserOut
    department: DepartmentOut
    latitude: float
    longitude: float
    performance_score: float
    avg_rating: float
    active_case_count: int
    max_active_cases: int

    class Config:
        from_attributes = True


# ---------- Status history / feedback ----------

class StatusHistoryOut(BaseModel):
    id: int
    status: StatusEnum
    remarks: Optional[str]
    proof_path: Optional[str]
    created_at: datetime
    changed_by_id: Optional[int]

    class Config:
        from_attributes = True


class StatusUpdateRequest(BaseModel):
    status: StatusEnum
    remarks: Optional[str] = None


class FeedbackCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class FeedbackOut(BaseModel):
    id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Complaints ----------

class ComplaintCreate(BaseModel):
    title: str
    description: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class ComplaintOut(BaseModel):
    id: int
    title: str
    description: str
    category: Optional[str]
    department: Optional[DepartmentOut]
    address: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    proof_path: Optional[str]
    status: StatusEnum
    assigned_employee: Optional[EmployeeOut]
    citizen: UserOut
    created_at: datetime
    updated_at: datetime
    status_history: List[StatusHistoryOut] = []
    feedback: Optional[FeedbackOut] = None

    class Config:
        from_attributes = True


class ComplaintListItem(BaseModel):
    id: int
    title: str
    category: Optional[str]
    status: StatusEnum
    created_at: datetime

    class Config:
        from_attributes = True


class ReassignRequest(BaseModel):
    employee_id: int
    remarks: Optional[str] = None


class AssignmentOut(BaseModel):
    id: int
    employee_id: int
    performance_component: float
    feedback_component: float
    proximity_component: float
    workload_component: float
    total_score: float
    is_manual: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Admin dashboard ----------

class DashboardStats(BaseModel):
    total_complaints: int
    submitted: int
    under_review: int
    assigned: int
    in_progress: int
    resolved: int
    closed: int
    total_employees: int
    total_departments: int
    avg_resolution_hours: Optional[float] = None
