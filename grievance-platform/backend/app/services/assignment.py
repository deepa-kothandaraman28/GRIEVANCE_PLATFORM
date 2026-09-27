"""
Automatic employee assignment.

For a complaint routed to a given department, every employee in that
department is scored on four weighted factors:

    40% performance      - the employee's historical performance_score (0-100)
    25% citizen feedback - the employee's average citizen rating (0-5)
    20% location proximity - distance from complaint to employee, via Haversine
    15% workload availability - free capacity = 1 - (active cases / max cases)

Each factor is normalised to a 0-1 scale before weighting so that no single
factor dominates just because of its raw units. The employee with the
highest total_score is selected. Employees already at full capacity are only
considered if no one in the department has free capacity, so a complaint is
never left unassigned when a department has active staff.
"""
import math
from dataclasses import dataclass
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models import Employee, StatusEnum

WEIGHT_PERFORMANCE = 0.40
WEIGHT_FEEDBACK = 0.25
WEIGHT_PROXIMITY = 0.20
WEIGHT_WORKLOAD = 0.15


@dataclass
class ScoredEmployee:
    employee: Employee
    performance_component: float
    feedback_component: float
    proximity_component: float
    workload_component: float
    total_score: float


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Great-circle distance in kilometres between two lat/lon points."""
    R = 6371.0  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _normalize_proximity(distances: List[float]) -> List[float]:
    """Turn raw distances into 0-1 'closer is better' scores. Uses min-max
    normalization across the candidate pool; a solo candidate scores 1.0."""
    if not distances:
        return []
    min_d, max_d = min(distances), max(distances)
    if max_d == min_d:
        return [1.0 for _ in distances]
    return [1 - ((d - min_d) / (max_d - min_d)) for d in distances]


def score_candidates(
    employees: List[Employee],
    complaint_lat: Optional[float],
    complaint_lng: Optional[float],
) -> List[ScoredEmployee]:
    if not employees:
        return []

    # Proximity: default to a neutral mid-distance if the complaint has no
    # coordinates, so scoring can still proceed on the other three factors.
    if complaint_lat is None or complaint_lng is None:
        distances = [0.0 for _ in employees]
    else:
        distances = [
            haversine_km(complaint_lat, complaint_lng, e.latitude, e.longitude)
            for e in employees
        ]
    proximity_scores = _normalize_proximity(distances)

    scored = []
    for emp, prox in zip(employees, proximity_scores):
        performance_norm = max(0.0, min(1.0, emp.performance_score / 100.0))
        feedback_norm = max(0.0, min(1.0, emp.avg_rating / 5.0))
        workload_norm = max(
            0.0, 1.0 - (emp.active_case_count / max(1, emp.max_active_cases))
        )

        performance_component = WEIGHT_PERFORMANCE * performance_norm
        feedback_component = WEIGHT_FEEDBACK * feedback_norm
        proximity_component = WEIGHT_PROXIMITY * prox
        workload_component = WEIGHT_WORKLOAD * workload_norm

        total = (
            performance_component
            + feedback_component
            + proximity_component
            + workload_component
        ) * 100  # scale to a friendlier 0-100 score

        scored.append(ScoredEmployee(
            employee=emp,
            performance_component=performance_component * 100,
            feedback_component=feedback_component * 100,
            proximity_component=proximity_component * 100,
            workload_component=workload_component * 100,
            total_score=total,
        ))

    return sorted(scored, key=lambda s: s.total_score, reverse=True)


def select_best_employee(
    db: Session,
    department_id: int,
    complaint_lat: Optional[float],
    complaint_lng: Optional[float],
) -> Optional[ScoredEmployee]:
    """Pick the best-scoring employee in a department for a new complaint.

    Prefers employees who still have free workload capacity; only falls back
    to fully-loaded employees if the whole department is at capacity.
    """
    employees = db.query(Employee).filter(Employee.department_id == department_id).all()
    if not employees:
        return None

    available = [e for e in employees if e.active_case_count < e.max_active_cases]
    pool = available if available else employees

    ranked = score_candidates(pool, complaint_lat, complaint_lng)
    return ranked[0] if ranked else None
