from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.database import get_db
from backend.models import Tag
from backend.schemas import TagCreate, TagResponse
from backend.auth import get_current_admin_user

router = APIRouter()

@router.get("/", response_model=List[TagResponse])
def get_tags(db: Session = Depends(get_db)):
    tags = db.query(Tag).filter(Tag.is_allowed == True).all()
    return tags

@router.get("/all", response_model=List[TagResponse])
def get_all_tags(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    tags = db.query(Tag).all()
    return tags

@router.post("/", response_model=TagResponse)
def create_tag(
    tag: TagCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    # Check if tag already exists
    existing = db.query(Tag).filter(Tag.name == tag.name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tag already exists"
        )
    
    new_tag = Tag(**tag.dict(), is_allowed=True)
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag

@router.put("/{tag_id}/allow")
def toggle_tag_allowed(
    tag_id: int,
    is_allowed: bool = True,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    tag.is_allowed = is_allowed
    db.commit()
    return {"message": f"Tag {'allowed' if is_allowed else 'disallowed'} successfully"}

@router.delete("/{tag_id}")
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_admin_user)
):
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found"
        )
    
    db.delete(tag)
    db.commit()
    return {"message": "Tag deleted successfully"}

