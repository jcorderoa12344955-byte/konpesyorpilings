from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from backend.models import ReactionType, UserRole, ReportReason

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    campus_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: UserRole
    anonymous_id: Optional[str] = None
    is_banned: bool = False
    created_at: datetime
    
    class Config:
        from_attributes = True

# Campus schemas
class CampusBase(BaseModel):
    name: str
    domain: Optional[str] = None
    description: Optional[str] = None

class CampusCreate(CampusBase):
    pass

class CampusResponse(CampusBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Tag schemas
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class TagResponse(TagBase):
    id: int
    is_allowed: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Confession schemas
class ConfessionBase(BaseModel):
    content: str
    campus_id: int
    tag_id: Optional[int] = None
    gender_tag: Optional[str] = None

class ConfessionCreate(ConfessionBase):
    pass

class ConfessionResponse(ConfessionBase):
    id: int
    anonymous_id: Optional[str] = None
    is_hidden: bool
    view_count: int
    created_at: datetime
    reaction_counts: Optional[dict] = None
    comment_count: Optional[int] = None
    tag: Optional[dict] = None
    
    class Config:
        from_attributes = True

# Admin-facing schemas
class AdminConfessionResponse(BaseModel):
    id: int
    content: str
    campus: Optional[CampusResponse] = None
    tag: Optional[TagResponse] = None
    created_at: datetime
    is_hidden: bool
    anonymous_id: Optional[str] = None
    author: Optional[UserResponse] = None  # May be None if posted fully anonymous
    view_count: int
    reaction_counts: Optional[dict] = None
    comment_count: Optional[int] = None

    class Config:
        from_attributes = True

# Reaction schemas
class ReactionBase(BaseModel):
    confession_id: int
    reaction_type: ReactionType

class ReactionCreate(ReactionBase):
    pass

class ReactionResponse(ReactionBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Comment schemas
class CommentBase(BaseModel):
    confession_id: int
    content: str
    nickname: Optional[str] = None
    parent_id: Optional[int] = None

class CommentCreate(CommentBase):
    pass

class CommentResponse(CommentBase):
    id: int
    anonymous_id: Optional[str] = None
    is_hidden: bool
    created_at: datetime
    reply_count: Optional[int] = None
    
    class Config:
        from_attributes = True

# Report schemas
class ReportBase(BaseModel):
    confession_id: Optional[int] = None
    comment_id: Optional[int] = None
    reason: ReportReason
    description: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class ReportResponse(ReportBase):
    id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Bookmark schemas
class BookmarkCreate(BaseModel):
    confession_id: int

class BookmarkResponse(BaseModel):
    id: int
    confession_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Search schemas
class SearchQuery(BaseModel):
    query: str
    campus_id: Optional[int] = None
    tag_id: Optional[int] = None
    sort_by: Optional[str] = "recent"  # recent, reactions, comments, trending

