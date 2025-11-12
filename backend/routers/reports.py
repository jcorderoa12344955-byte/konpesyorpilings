from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database import get_db
from backend.models import Report, Confession, Comment, User, ReportReason
from backend.schemas import ReportCreate, ReportResponse
from backend.auth import get_current_user_optional, get_current_user

router = APIRouter()

@router.post("/", response_model=ReportResponse)
def create_report(
    report: ReportCreate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    # Validate that either confession_id or comment_id is provided
    if not report.confession_id and not report.comment_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either confession_id or comment_id must be provided"
        )
    
    # Check if confession exists
    if report.confession_id:
        confession = db.query(Confession).filter(Confession.id == report.confession_id).first()
        if not confession:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Confession not found"
            )
    
    # Check if comment exists
    if report.comment_id:
        comment = db.query(Comment).filter(Comment.id == report.comment_id).first()
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )
    
    new_report = Report(
        confession_id=report.confession_id,
        comment_id=report.comment_id,
        reporter_id=current_user.id if current_user else None,
        reason=report.reason,
        description=report.description,
        status="pending"
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    return new_report

@router.get("/", response_model=List[ReportResponse])
@router.get("", response_model=List[ReportResponse])  # Also handle without trailing slash
def get_reports(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admins and moderators can view reports
    if current_user.role.value not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view reports"
        )
    
    query = db.query(Report)
    if status_filter:
        query = query.filter(Report.status == status_filter)
    
    reports = query.order_by(Report.created_at.desc()).all()
    return reports

@router.put("/{report_id}/review")
def review_report(
    report_id: int,
    action: str,  # "resolve", "dismiss"
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admins and moderators can review reports
    if current_user.role.value not in ["admin", "moderator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to review reports"
        )
    
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found"
        )
    
    if action == "resolve":
        report.status = "resolved"
        # Hide the reported content
        if report.confession_id:
            confession = db.query(Confession).filter(Confession.id == report.confession_id).first()
            if confession:
                confession.is_hidden = True
        if report.comment_id:
            comment = db.query(Comment).filter(Comment.id == report.comment_id).first()
            if comment:
                comment.is_hidden = True
    elif action == "dismiss":
        report.status = "dismissed"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Use 'resolve' or 'dismiss'"
        )
    
    report.reviewed_by = current_user.id
    from datetime import datetime
    report.reviewed_at = datetime.utcnow()
    
    db.commit()
    return {"message": f"Report {action}d successfully"}

