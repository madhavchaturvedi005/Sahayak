from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.content import DepartmentStat, NewsItem, NodalOfficer

router = APIRouter(prefix="/api", tags=["content"])


@router.get("/news")
def news(db: Session = Depends(get_db)):
    rows = db.query(NewsItem).order_by(NewsItem.published_on.desc()).all()
    return [
        {
            "id": r.id,
            "published_on": r.published_on.isoformat(),
            "title": r.title,
            "href": r.href,
            "size_label": r.size_label,
        }
        for r in rows
    ]


@router.get("/nodal-officers")
def officers(scope: str | None = None, db: Session = Depends(get_db)):
    q = db.query(NodalOfficer)
    if scope:
        q = q.filter(NodalOfficer.scope == scope)
    return [
        {
            "id": r.id,
            "scope": r.scope,
            "organisation": r.organisation,
            "name": r.name,
            "designation": r.designation,
            "email": r.email,
            "phone": r.phone,
            "state": r.state,
        }
        for r in q.order_by(NodalOfficer.organisation).all()
    ]


@router.get("/departments")
def departments(db: Session = Depends(get_db)):
    return [
        {
            "ministry": r.ministry,
            "avg_days": r.avg_days,
            "pendency_pct": r.pendency_pct,
            "notes": r.notes,
        }
        for r in db.query(DepartmentStat).order_by(DepartmentStat.ministry).all()
    ]
