from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from backend.database import get_db
from backend.models import Reaction, Confession, User, ReactionType
from backend.schemas import ReactionCreate, ReactionResponse
from backend.auth import get_current_user_optional

router = APIRouter()

@router.post("/", response_model=ReactionResponse)
def create_reaction(
    reaction: ReactionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Check if confession exists
    confession = db.query(Confession).filter(Confession.id == reaction.confession_id).first()
    if not confession or confession.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    
    # Check if user already reacted (one reaction per user per post)
    existing_reaction = None
    if current_user:
        existing_reaction = db.query(Reaction).filter(
            Reaction.confession_id == reaction.confession_id,
            Reaction.user_id == current_user.id
        ).first()
    else:
        # For anonymous users, we'd need IP hash or session token
        # For now, allow multiple reactions from anonymous users
        pass
    
    if existing_reaction:
        # Update existing reaction
        existing_reaction.reaction_type = reaction.reaction_type
        db.commit()
        db.refresh(existing_reaction)
        return existing_reaction
    
    # Create new reaction
    new_reaction = Reaction(
        confession_id=reaction.confession_id,
        user_id=current_user.id if current_user else None,
        reaction_type=reaction.reaction_type
    )
    db.add(new_reaction)
    db.commit()
    db.refresh(new_reaction)
    return new_reaction

@router.delete("/{reaction_id}")
def delete_reaction(
    reaction_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    reaction = db.query(Reaction).filter(Reaction.id == reaction_id).first()
    if not reaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found"
        )
    
    # Check if user is the owner
    if current_user and reaction.user_id == current_user.id:
        db.delete(reaction)
        db.commit()
        return {"message": "Reaction deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this reaction"
        )

@router.get("/confession/{confession_id}")
def get_confession_reactions(confession_id: int, db: Session = Depends(get_db)):
    reactions = db.query(Reaction).filter(Reaction.confession_id == confession_id).all()
    counts = {
        "like": 0,
        "heart": 0,
        "laugh": 0,
        "shock": 0,
        "cry": 0,
        "angry": 0
    }
    for reaction in reactions:
        counts[reaction.reaction_type.value] = counts.get(reaction.reaction_type.value, 0) + 1
    return counts

