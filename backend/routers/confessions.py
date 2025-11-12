from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
from backend.database import get_db
from backend.models import Confession, Reaction, Comment, User
from backend.schemas import ConfessionCreate, ConfessionResponse
from backend.auth import get_current_user_optional
import random

router = APIRouter()

def get_reaction_counts(confession_id: int, db: Session) -> dict:
    """Get reaction counts for a confession"""
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

@router.post("/", response_model=ConfessionResponse)
@router.post("", response_model=ConfessionResponse)  # Also handle without trailing slash
def create_confession(
    confession: ConfessionCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Validate campus exists
    from backend.models import Campus
    campus = db.query(Campus).filter(Campus.id == confession.campus_id).first()
    if not campus:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Campus with id {confession.campus_id} not found"
        )
    
    # Validate tag exists if provided
    if confession.tag_id:
        from backend.models import Tag
        tag = db.query(Tag).filter(Tag.id == confession.tag_id).first()
        if not tag:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tag with id {confession.tag_id} not found"
            )
        if not tag.is_allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This tag is not allowed"
            )
    
    # Check if user is banned
    if current_user and current_user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are banned and cannot post confessions"
        )
    
    # Generate anonymous ID if user is anonymous
    anonymous_id = None
    if not current_user:
        anonymous_id = f"Anon#{random.randint(100, 9999)}"
    elif current_user.anonymous_id:
        anonymous_id = current_user.anonymous_id
    
    try:
        new_confession = Confession(
            content=confession.content,
            campus_id=confession.campus_id,
            tag_id=confession.tag_id,
            gender_tag=confession.gender_tag,
            author_id=current_user.id if current_user else None,
            anonymous_id=anonymous_id
        )
        db.add(new_confession)
        db.commit()
        db.refresh(new_confession)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create confession: {str(e)}"
        )
    
    # Load tag relationship
    from sqlalchemy.orm import joinedload
    confession_with_tag = db.query(Confession).options(joinedload(Confession.tag)).filter(Confession.id == new_confession.id).first()
    
    # Add reaction counts and comment count
    response_dict = {
        "id": confession_with_tag.id,
        "content": confession_with_tag.content,
        "campus_id": confession_with_tag.campus_id,
        "tag_id": confession_with_tag.tag_id,
        "gender_tag": confession_with_tag.gender_tag,
        "anonymous_id": confession_with_tag.anonymous_id,
        "is_hidden": confession_with_tag.is_hidden,
        "view_count": confession_with_tag.view_count,
        "created_at": confession_with_tag.created_at,
        "reaction_counts": get_reaction_counts(confession_with_tag.id, db),
        "comment_count": 0,
    }
    if confession_with_tag.tag:
        response_dict["tag"] = {"id": confession_with_tag.tag.id, "name": confession_with_tag.tag.name}
    return ConfessionResponse(**response_dict)

@router.get("/", response_model=List[ConfessionResponse])
@router.get("", response_model=List[ConfessionResponse])  # Also handle without trailing slash
def get_confessions(
    campus_id: Optional[int] = Query(None),
    tag_id: Optional[int] = Query(None),
    sort_by: str = Query("recent", regex="^(recent|reactions|comments|trending)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    from sqlalchemy.orm import joinedload
    
    query = db.query(Confession).options(joinedload(Confession.tag)).filter(Confession.is_hidden == False)
    
    if campus_id:
        query = query.filter(Confession.campus_id == campus_id)
    if tag_id:
        query = query.filter(Confession.tag_id == tag_id)
    
    # For complex sorting, we'll fetch all and sort in Python for simplicity
    # In production, you might want to use subqueries for better performance
    if sort_by == "recent":
        query = query.order_by(desc(Confession.created_at))
        confessions = query.offset(skip).limit(limit).all()
    else:
        # For other sorts, get all confessions and sort
        all_confessions = query.all()
        
        if sort_by == "reactions":
            # Sort by reaction count
            confessions_with_counts = []
            for conf in all_confessions:
                reaction_count = db.query(Reaction).filter(Reaction.confession_id == conf.id).count()
                confessions_with_counts.append((conf, reaction_count))
            confessions_with_counts.sort(key=lambda x: x[1], reverse=True)
            confessions = [c[0] for c in confessions_with_counts[skip:skip+limit]]
        elif sort_by == "comments":
            # Sort by comment count
            confessions_with_counts = []
            for conf in all_confessions:
                comment_count = db.query(Comment).filter(Comment.confession_id == conf.id, Comment.is_hidden == False).count()
                confessions_with_counts.append((conf, comment_count))
            confessions_with_counts.sort(key=lambda x: x[1], reverse=True)
            confessions = [c[0] for c in confessions_with_counts[skip:skip+limit]]
        elif sort_by == "trending":
            # Trending: combination of reactions, comments, and recency
            from datetime import datetime, timedelta
            confessions_with_scores = []
            for conf in all_confessions:
                reaction_count = db.query(Reaction).filter(Reaction.confession_id == conf.id).count()
                comment_count = db.query(Comment).filter(Comment.confession_id == conf.id, Comment.is_hidden == False).count()
                hours_ago = (datetime.utcnow() - conf.created_at.replace(tzinfo=None)).total_seconds() / 3600
                score = reaction_count * 2 + comment_count * 3 - hours_ago / 24  # Decay over time
                confessions_with_scores.append((conf, score))
            confessions_with_scores.sort(key=lambda x: x[1], reverse=True)
            confessions = [c[0] for c in confessions_with_scores[skip:skip+limit]]
        else:
            confessions = all_confessions[skip:skip+limit]
    
    # Add reaction counts and comment counts
    results = []
    for confession in confessions:
        response_dict = {
            **confession.__dict__,
            "reaction_counts": get_reaction_counts(confession.id, db),
            "comment_count": db.query(Comment).filter(
                Comment.confession_id == confession.id,
                Comment.is_hidden == False
            ).count(),
        }
        # Remove SQLAlchemy internal attributes
        response_dict.pop("_sa_instance_state", None)
        if confession.tag:
            response_dict["tag"] = {"id": confession.tag.id, "name": confession.tag.name}
        response_data = ConfessionResponse(**response_dict)
        results.append(response_data)
    
    return results

@router.get("/{confession_id}", response_model=ConfessionResponse)
def get_confession(confession_id: int, db: Session = Depends(get_db)):
    from sqlalchemy.orm import joinedload
    confession = db.query(Confession).options(joinedload(Confession.tag)).filter(Confession.id == confession_id).first()
    if not confession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    if confession.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    
    # Increment view count
    confession.view_count += 1
    db.commit()
    db.refresh(confession)
    
    response_dict = {
        **confession.__dict__,
        "reaction_counts": get_reaction_counts(confession.id, db),
        "comment_count": db.query(Comment).filter(
            Comment.confession_id == confession.id,
            Comment.is_hidden == False
        ).count(),
    }
    response_dict.pop("_sa_instance_state", None)
    if confession.tag:
        response_dict["tag"] = {"id": confession.tag.id, "name": confession.tag.name}
    return ConfessionResponse(**response_dict)

@router.delete("/{confession_id}")
def delete_confession(
    confession_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    confession = db.query(Confession).filter(Confession.id == confession_id).first()
    if not confession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    
    # Check if user is author or admin
    if current_user and (confession.author_id == current_user.id or current_user.role.value in ["admin", "moderator"]):
        db.delete(confession)
        db.commit()
        return {"message": "Confession deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this confession"
        )

