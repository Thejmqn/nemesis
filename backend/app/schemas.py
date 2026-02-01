from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Question schemas
class QuestionBase(BaseModel):
    text: str

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Answer schemas
class AnswerBase(BaseModel):
    question_id: int
    answer_value: int  # 1-10 scale

class AnswerCreate(AnswerBase):
    pass

class AnswerResponse(AnswerBase):
    id: int
    user_id: int
    answered_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class AnswerUpdate(BaseModel):
    answer_value: int

# Match schemas
class MatchResponse(BaseModel):
    id: int
    enemy_id: int
    enemy_username: str
    enemy_email: str
    match_score: float
    matched_at: datetime
    
    class Config:
        from_attributes = True

# Survey response
class SurveyResponse(BaseModel):
    answers: List[AnswerCreate]
