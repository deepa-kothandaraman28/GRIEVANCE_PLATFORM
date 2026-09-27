import enum
from datetime import datetime

from sqlalchemy import (
    Column, Integer, String, Text, Float, ForeignKey, DateTime, Enum, Boolean
)
from sqlalchemy.orm import relationship

from app.database import Base


class RoleEnum(str, enum.Enum):
    citizen = "citizen"
    employee = "employee"
    admin = "admin"


class StatusEnum(str, enum.Enum):
    submitted = "Submitted"
    under_review = "Under Review"
    assigned = "Assigned"
    in_progress = "In Progress"
    resolved = "Resolved"
    closed = "Closed"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.citizen, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    employee_profile = relationship("Employee", back_populates="user", uselist=False)
    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")


class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(255), nullable=True)

    employees = relationship("Employee", back_populates="department")
    complaints = relationship("Complaint", back_populates="department")


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    latitude = Column(Float, nullable=False, default=0.0)
    longitude = Column(Float, nullable=False, default=0.0)
    performance_score = Column(Float, default=70.0)   # 0-100, admin/system adjustable
    avg_rating = Column(Float, default=4.0)            # 0-5 from citizen feedback
    max_active_cases = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="employee_profile")
    department = relationship("Department", back_populates="employees")
    assigned_complaints = relationship("Complaint", back_populates="assigned_employee")

    @property
    def active_case_count(self):
        return sum(
            1 for c in self.assigned_complaints
            if c.status not in (StatusEnum.resolved, StatusEnum.closed)
        )


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String(100), nullable=True)       # predicted by ML
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    address = Column(String(255), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    proof_path = Column(String(500), nullable=True)     # citizen-uploaded image/video
    status = Column(Enum(StatusEnum), default=StatusEnum.submitted, nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    department = relationship("Department", back_populates="complaints")
    assigned_employee = relationship("Employee", back_populates="assigned_complaints")
    status_history = relationship("StatusHistory", back_populates="complaint", order_by="StatusHistory.created_at")
    feedback = relationship("Feedback", back_populates="complaint", uselist=False)
    assignments = relationship("Assignment", back_populates="complaint", order_by="Assignment.created_at")


class StatusHistory(Base):
    __tablename__ = "status_history"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    status = Column(Enum(StatusEnum), nullable=False)
    remarks = Column(Text, nullable=True)
    proof_path = Column(String(500), nullable=True)     # resolution proof
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="status_history")
    changed_by = relationship("User")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), unique=True, nullable=False)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    rating = Column(Integer, nullable=False)   # 1-5
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="feedback")


class Assignment(Base):
    """Audit trail of every automatic/manual assignment decision, for transparency
    on the admin dashboard (shows why an employee was picked / re-picked)."""
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True, index=True)
    complaint_id = Column(Integer, ForeignKey("complaints.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    performance_component = Column(Float, default=0.0)
    feedback_component = Column(Float, default=0.0)
    proximity_component = Column(Float, default=0.0)
    workload_component = Column(Float, default=0.0)
    total_score = Column(Float, default=0.0)
    is_manual = Column(Boolean, default=False)
    assigned_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="assignments")
    employee = relationship("Employee")
