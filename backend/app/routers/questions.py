from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Question
from app.schemas import QuestionCreate, QuestionResponse
from typing import List

router = APIRouter()

@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(question: QuestionCreate, db: Session = Depends(get_db)):
    db_question = Question(text=question.text, is_active=True)
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

@router.get("/", response_model=List[QuestionResponse])
def get_questions(active_only: bool = True, db: Session = Depends(get_db)):
    query = db.query(Question)
    if active_only:
        query = query.filter(Question.is_active == True)
    questions = query.all()
    return questions

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return db_question

@router.patch("/{question_id}/deactivate")
def deactivate_question(question_id: int, db: Session = Depends(get_db)):
    db_question = db.query(Question).filter(Question.id == question_id).first()
    if not db_question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    db_question.is_active = False
    db.commit()
    return {"message": "Question deactivated"}
