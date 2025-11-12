from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, func, desc
from typing import List, Optional
from backend.database import get_db
from backend.models import Confession, Tag, Reaction, Comment
from backend.schemas import ConfessionResponse, SearchQuery

router = APIRouter()

def get_reaction_counts(confession_id: int, db: Session) -> dict:
    """Get reaction counts for a confession"""
    from backend.models import ReactionType
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

@router.get("/", response_model=List[ConfessionResponse])
def search_confessions(
    q: str = Query(..., min_length=1),
    campus_id: Optional[int] = Query(None),
    tag_id: Optional[int] = Query(None),
    sort_by: str = Query("recent", regex="^(recent|reactions|comments|trending)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(Confession).filter(
        Confession.is_hidden == False,
        or_(
            Confession.content.ilike(f"%{q}%")
        )
    )
    
    if campus_id:
        query = query.filter(Confession.campus_id == campus_id)
    if tag_id:
        query = query.filter(Confession.tag_id == tag_id)
    
    # Also search in tags
    if q.startswith("#"):
        tag_name = q[1:].strip()
        tag = db.query(Tag).filter(Tag.name.ilike(f"%{tag_name}%")).first()
        if tag:
            query = query.filter(Confession.tag_id == tag.id)
    
    # Sorting
    if sort_by == "recent":
        query = query.order_by(desc(Confession.created_at))
    elif sort_by == "reactions":
        query = query.outerjoin(Reaction).group_by(Confession.id).order_by(desc(func.count(Reaction.id)))
    elif sort_by == "comments":
        query = query.outerjoin(Comment).group_by(Confession.id).order_by(desc(func.count(Comment.id)))
    elif sort_by == "trending":
        query = query.outerjoin(Reaction).outerjoin(Comment).group_by(Confession.id).order_by(
            desc(
                func.count(Reaction.id) * 2 + 
                func.count(Comment.id) * 3
            )
        )
    
    confessions = query.offset(skip).limit(limit).all()
    
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
        response_dict.pop("_sa_instance_state", None)
        if confession.tag:
            response_dict["tag"] = {"id": confession.tag.id, "name": confession.tag.name}
        response_data = ConfessionResponse(**response_dict)
        results.append(response_data)
    
    return results

