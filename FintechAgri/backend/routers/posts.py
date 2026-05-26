"""Community posts and comments endpoints."""

from typing import Annotated, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models.inventory import Comment, Post
from models.user import User
from services.auth_service import get_current_user

router = APIRouter(prefix="/api/posts", tags=["Community"])


# ── Schemas (kept local since they're small) ────────────────────────────────

class PostCreate(BaseModel):
    content: str
    category: str = "general"


class CommentCreate(BaseModel):
    content: str


class PostResponse(BaseModel):
    id: int
    user_id: int
    author_name: str
    content: str
    category: str
    likes_count: int
    comments_count: int
    created_at: str

    model_config = {"from_attributes": True}


class CommentResponse(BaseModel):
    id: int
    post_id: int
    user_id: int
    author_name: str
    content: str
    created_at: str

    model_config = {"from_attributes": True}


# ── Helpers ──────────────────────────────────────────────────────────────────

def _post_to_response(post: Post) -> PostResponse:
    return PostResponse(
        id=post.id,
        user_id=post.user_id,
        author_name=post.user.name if post.user else "Unknown",
        content=post.content,
        category=post.category or "general",
        likes_count=post.likes_count or 0,
        comments_count=len(post.comments) if post.comments else 0,
        created_at=post.created_at.isoformat() if post.created_at else "",
    )


def _comment_to_response(comment: Comment) -> CommentResponse:
    return CommentResponse(
        id=comment.id,
        post_id=comment.post_id,
        user_id=comment.user_id,
        author_name=comment.user.name if comment.user else "Unknown",
        content=comment.content,
        created_at=comment.created_at.isoformat() if comment.created_at else "",
    )


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.get("", response_model=list[PostResponse])
def list_posts(
    category: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return community posts (paginated, optionally filtered by category)."""
    q = db.query(Post)
    if category and category != "all":
        q = q.filter(Post.category == category)
    posts = q.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return [_post_to_response(p) for p in posts]


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Create a new community post."""
    post = Post(
        user_id=current_user.id,
        content=payload.content,
        category=payload.category,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return _post_to_response(post)


@router.post("/{post_id}/like", response_model=PostResponse)
def like_post(
    post_id: int,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Toggle like on a post (simple increment for UAT)."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post.likes_count = (post.likes_count or 0) + 1
    db.commit()
    db.refresh(post)
    return _post_to_response(post)


@router.get("/{post_id}/comments", response_model=list[CommentResponse])
def list_comments(post_id: int, db: Session = Depends(get_db)):
    """Return all comments for a post."""
    comments = (
        db.query(Comment)
        .filter(Comment.post_id == post_id)
        .order_by(Comment.created_at.asc())
        .all()
    )
    return [_comment_to_response(c) for c in comments]


@router.post(
    "/{post_id}/comments",
    response_model=CommentResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_comment(
    post_id: int,
    payload: CommentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Add a comment to a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        content=payload.content,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return _comment_to_response(comment)
