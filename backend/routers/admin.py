from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import User, Confession, Report, Comment, Reaction, Campus, Tag
from backend.auth import get_current_admin_user
from backend.schemas import UserResponse, AdminConfessionResponse, CampusResponse

router = APIRouter()

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    total_users = db.query(User).count()
    total_confessions = db.query(Confession).count()
    total_reports = db.query(Report).filter(Report.status == "pending").count()
    active_confessions = db.query(Confession).filter(Confession.is_hidden == False).count()
    
    return {
        "total_users": total_users,
        "total_confessions": total_confessions,
        "pending_reports": total_reports,
        "active_confessions": active_confessions
    }

@router.get("/users")
@router.get("/users/")  # Also handle with trailing slash
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponse.model_validate(user) for user in users]

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent deleting yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete yourself"
        )
    
    # Prevent deleting other admins
    if user.role.value == "admin" and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete other admins"
        )
    
    try:
        # Delete related records manually since cascade might not be set up
        # Delete user's reactions
        db.query(Reaction).filter(Reaction.user_id == user_id).delete()
        
        # Delete user's comments
        db.query(Comment).filter(Comment.author_id == user_id).delete()
        
        # Delete user's confessions (this will cascade to reactions/comments on those confessions)
        db.query(Confession).filter(Confession.author_id == user_id).delete()
        
        # Delete user's reports
        db.query(Report).filter(Report.reporter_id == user_id).delete()
        
        # Finally delete the user
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

@router.put("/users/{user_id}/ban")
def ban_user(
    user_id: int,
    is_banned: bool = Query(True, description="Whether to ban (True) or unban (False) the user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Prevent banning yourself
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot ban yourself"
        )
    
    # Prevent banning other admins
    if user.role.value == "admin" and current_user.role.value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can ban other admins"
        )
    
    user.is_banned = is_banned
    db.commit()
    return {"message": f"User {'banned' if is_banned else 'unbanned'} successfully"}

@router.put("/confessions/{confession_id}/hide")
def hide_confession(
    confession_id: int,
    is_hidden: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    confession = db.query(Confession).filter(Confession.id == confession_id).first()
    if not confession:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Confession not found"
        )
    
    confession.is_hidden = is_hidden
    db.commit()
    return {"message": f"Confession {'hidden' if is_hidden else 'unhidden'} successfully"}

@router.put("/comments/{comment_id}/hide")
def hide_comment(
    comment_id: int,
    is_hidden: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    comment.is_hidden = is_hidden
    db.commit()
    return {"message": f"Comment {'hidden' if is_hidden else 'unhidden'} successfully"}

@router.get("/confessions", response_model=list[AdminConfessionResponse])
def admin_list_confessions(
    campus_id: int | None = Query(None, description="Filter by campus id"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """
    List confessions with author details for admins. Supports optional campus filter.
    """
    query = (
        db.query(Confession)
        .options(
            joinedload(Confession.author),
            joinedload(Confession.campus),
            joinedload(Confession.tag),
        )
        .order_by(Confession.created_at.desc())
    )
    if campus_id is not None:
        query = query.filter(Confession.campus_id == campus_id)

    confessions = query.offset(skip).limit(limit).all()

    def to_counts(confession_id: int) -> dict:
        reactions = db.query(Reaction).filter(Reaction.confession_id == confession_id).all()
        counts = {"like": 0, "heart": 0, "laugh": 0, "shock": 0, "cry": 0, "angry": 0}
        for r in reactions:
            counts[r.reaction_type.value] = counts.get(r.reaction_type.value, 0) + 1
        return counts

    result: list[AdminConfessionResponse] = []
    for c in confessions:
        result.append(
            AdminConfessionResponse(
                id=c.id,
                content=c.content,
                campus=CampusResponse.model_validate(c.campus) if c.campus else None,
                tag={"id": c.tag.id, "name": c.tag.name, "is_allowed": c.tag.is_allowed, "created_at": c.tag.created_at} if c.tag else None,
                created_at=c.created_at,
                is_hidden=c.is_hidden,
                anonymous_id=c.anonymous_id,
                author=UserResponse.model_validate(c.author) if c.author else None,
                view_count=c.view_count,
                reaction_counts=to_counts(c.id),
                comment_count=db.query(Comment).filter(Comment.confession_id == c.id).count(),
            )
        )

    return result

@router.get("/campuses/{campus_id}/confessions", response_model=list[AdminConfessionResponse])
def admin_list_confessions_by_campus(
    campus_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    return admin_list_confessions(campus_id=campus_id, skip=skip, limit=limit, db=db, current_user=current_user)

