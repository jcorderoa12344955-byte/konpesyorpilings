from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Campus
from backend.schemas import CampusCreate, CampusResponse
from backend.auth import get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[CampusResponse])
@router.get("", response_model=List[CampusResponse])  # Also handle without trailing slash
def get_campuses(db: Session = Depends(get_db)):
    campuses = db.query(Campus).filter(Campus.is_active == True).all()
    return campuses

@router.get("/{campus_id}", response_model=CampusResponse)
def get_campus(campus_id: int, db: Session = Depends(get_db)):
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campus not found"
        )
    return campus

@router.post("/", response_model=CampusResponse)
@router.post("", response_model=CampusResponse)  # Also handle without trailing slash
def create_campus(
    campus: CampusCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    # Check if campus already exists
    existing = db.query(Campus).filter(Campus.name == campus.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Campus already exists"
        )
    
    new_campus = Campus(**campus.dict())
    db.add(new_campus)
    db.commit()
    db.refresh(new_campus)
    return new_campus

@router.put("/{campus_id}", response_model=CampusResponse)
def update_campus(
    campus_id: int,
    campus: CampusCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    existing_campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not existing_campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campus not found"
        )
    
    for key, value in campus.dict().items():
        setattr(existing_campus, key, value)
    
    db.commit()
    db.refresh(existing_campus)
    return existing_campus

@router.delete("/{campus_id}")
def delete_campus(
    campus_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    campus = db.query(Campus).filter(Campus.id == campus_id).first()
    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campus not found"
        )
    
    campus.is_active = False
    db.commit()
    return {"message": "Campus deactivated successfully"}

