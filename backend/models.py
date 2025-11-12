from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database import Base
import enum

class ReactionType(enum.Enum):
    LIKE = "like"
    HEART = "heart"
    LAUGH = "laugh"
    SHOCK = "shock"
    CRY = "cry"
    ANGRY = "angry"

class UserRole(enum.Enum):
    USER = "user"
    MODERATOR = "moderator"
    ADMIN = "admin"

class ReportReason(enum.Enum):
    HARASSMENT = "harassment"
    HATE = "hate"
    SPAM = "spam"
    INAPPROPRIATE = "inappropriate"
    OTHER = "other"

class Campus(Base):
    __tablename__ = "campuses"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)
    domain = Column(String(100), nullable=True)  # Email domain for auto-assignment
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    confessions = relationship("Confession", back_populates="campus")
    users = relationship("User", back_populates="campus")

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(Enum(UserRole), default=UserRole.USER)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=True)
    anonymous_id = Column(String(50), nullable=True)  # Per-campus anonymous ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_banned = Column(Boolean, default=False)
    
    campus = relationship("Campus", back_populates="users")
    confessions = relationship("Confession", back_populates="author")
    reactions = relationship("Reaction", back_populates="user")
    comments = relationship("Comment", back_populates="author")
    reports = relationship("Report", back_populates="reporter", foreign_keys="Report.reporter_id")

class Confession(Base):
    __tablename__ = "confessions"
    
    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    campus_id = Column(Integer, ForeignKey("campuses.id"), nullable=False)
    tag_id = Column(Integer, ForeignKey("tags.id"), nullable=True)
    anonymous_id = Column(String(50), nullable=True)  # Display ID like "Anon#304"
    gender_tag = Column(String(20), nullable=True)  # "Male", "Female", "Secret"
    is_hidden = Column(Boolean, default=False)
    view_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    author = relationship("User", back_populates="confessions")
    campus = relationship("Campus", back_populates="confessions")
    tag = relationship("Tag", back_populates="confessions")
    reactions = relationship("Reaction", back_populates="confession", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="confession", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="confession", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="confession", cascade="all, delete-orphan")

class Tag(Base):
    __tablename__ = "tags"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, index=True)
    is_allowed = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    confessions = relationship("Confession", back_populates="tag")

class Reaction(Base):
    __tablename__ = "reactions"
    
    id = Column(Integer, primary_key=True, index=True)
    confession_id = Column(Integer, ForeignKey("confessions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reaction_type = Column(Enum(ReactionType), nullable=False)
    user_ip_hash = Column(String(64), nullable=True)  # For anonymous users
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    confession = relationship("Confession", back_populates="reactions")
    user = relationship("User", back_populates="reactions")

class Comment(Base):
    __tablename__ = "comments"
    
    id = Column(Integer, primary_key=True, index=True)
    confession_id = Column(Integer, ForeignKey("confessions.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    content = Column(Text, nullable=False)
    nickname = Column(String(50), nullable=True)  # Optional nickname for anonymous comments
    anonymous_id = Column(String(50), nullable=True)
    parent_id = Column(Integer, ForeignKey("comments.id"), nullable=True)  # For nested replies
    is_hidden = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    author = relationship("User", back_populates="comments")
    confession = relationship("Confession", back_populates="comments")
    parent = relationship("Comment", remote_side=[id], backref="replies")
    reports = relationship("Report", back_populates="comment", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    confession_id = Column(Integer, ForeignKey("confessions.id"), nullable=True)
    comment_id = Column(Integer, ForeignKey("comments.id"), nullable=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(20), default="pending")  # pending, reviewed, resolved, dismissed
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    confession = relationship("Confession", back_populates="reports")
    comment = relationship("Comment", back_populates="reports")
    reporter = relationship("User", back_populates="reports", foreign_keys=[reporter_id], remote_side="User.id")

class Bookmark(Base):
    __tablename__ = "bookmarks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    confession_id = Column(Integer, ForeignKey("confessions.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    confession = relationship("Confession", back_populates="bookmarks")

