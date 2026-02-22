from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.schemas import UserCreate, UserResponse
from passlib.context import CryptContext
from typing import List
import re
import secrets

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def _slugify_username(value: str) -> str:
    value = (value or "").strip().lower()
    value = re.sub(r"[^a-z0-9_\\-]+", "", value)
    return value[:50] or "user"

def _generate_unique_username(email: str, db: Session) -> str:
    base = _slugify_username((email or "").split("@", 1)[0])
    candidate = base
    for _ in range(25):
        exists = db.query(User).filter(User.username == candidate).first()
        if not exists:
            return candidate
        candidate = f"{base}-{secrets.token_hex(2)}"
    return f"{base}-{secrets.token_hex(6)}"

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    first_name = user.first_name.strip()
    last_name = user.last_name.strip()
    if not first_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="First name is required")
    if not last_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Last name is required")

    # Check if email already exists
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    username = (user.username or "").strip()
    if username:
        db_user = db.query(User).filter(User.username == username).first()
        if db_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    else:
        username = _generate_unique_username(user.email, db)
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=username,
        first_name=first_name,
        last_name=last_name,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return db_user

@router.get("/", response_model=List[UserResponse])
def get_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    users = db.query(User).offset(skip).limit(limit).all()
    return users
