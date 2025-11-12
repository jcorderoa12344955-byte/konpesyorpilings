from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models import Comment, Confession, User
from backend.schemas import CommentCreate, CommentResponse
from backend.auth import get_current_user_optional
import random

router = APIRouter()

@router.post("/", response_model=CommentResponse)
def create_comment(
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Check if confession exists
    confession = db.query(Confession).filter(Confession.id == comment.confession_id).first()
    if not confession or confession.is_hidden:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    
    # Check if parent comment exists (for replies)
    if comment.parent_id:
        parent = db.query(Comment).filter(Comment.id == comment.parent_id).first()
        if not parent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent comment not found"
            )
    
    # Generate anonymous ID
    anonymous_id = None
    if not current_user:
        anonymous_id = f"Anon#{random.randint(100, 9999)}"
    elif current_user.anonymous_id:
        anonymous_id = current_user.anonymous_id
    
    new_comment = Comment(
        confession_id=comment.confession_id,
        author_id=current_user.id if current_user else None,
        content=comment.content,
        nickname=comment.nickname,
        parent_id=comment.parent_id,
        anonymous_id=anonymous_id
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    response_data = CommentResponse.model_validate(new_comment)
    response_data.reply_count = db.query(Comment).filter(Comment.parent_id == new_comment.id).count()
    return response_data

@router.get("/confession/{confession_id}", response_model=List[CommentResponse])
def get_confession_comments(confession_id: int, db: Session = Depends(get_db)):
    comments = db.query(Comment).filter(
        Comment.confession_id == confession_id,
        Comment.is_hidden == False,
        Comment.parent_id == None  # Only top-level comments
    ).order_by(Comment.created_at.desc()).all()
    
    results = []
    for comment in comments:
        response_data = CommentResponse.model_validate(comment)
        response_data.reply_count = db.query(Comment).filter(
            Comment.parent_id == comment.id,
            Comment.is_hidden == False
        ).count()
        results.append(response_data)
    
    return results

@router.get("/{comment_id}/replies", response_model=List[CommentResponse])
def get_comment_replies(comment_id: int, db: Session = Depends(get_db)):
    replies = db.query(Comment).filter(
        Comment.parent_id == comment_id,
        Comment.is_hidden == False
    ).order_by(Comment.created_at.asc()).all()
    
    return [CommentResponse.model_validate(reply) for reply in replies]

@router.delete("/{comment_id}")
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is author or admin
    if current_user and (comment.author_id == current_user.id or current_user.role.value in ["admin", "moderator"]):
        db.delete(comment)
        db.commit()
        return {"message": "Comment deleted"}
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this comment"
        )

