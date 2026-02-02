from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Answer, Question, User
from app.schemas import AnswerCreate, AnswerResponse, AnswerUpdate, SurveyResponse
from app.routers.auth import get_current_user
from typing import List

router = APIRouter()

@router.post("/", response_model=AnswerResponse, status_code=status.HTTP_201_CREATED)
def create_answer(answer: AnswerCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate answer value (1-10)
    if answer.answer_value < 1 or answer.answer_value > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer value must be between 1 and 10"
        )
    
    # Check if question exists
    question = db.query(Question).filter(Question.id == answer.question_id).first()
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Check if answer already exists (update if so)
    existing_answer = db.query(Answer).filter(
        Answer.user_id == current_user.id,
        Answer.question_id == answer.question_id
    ).first()
    
    if existing_answer:
        existing_answer.answer_value = answer.answer_value
        db.commit()
        db.refresh(existing_answer)
        return existing_answer
    
    # Create new answer
    db_answer = Answer(
        user_id=current_user.id,
        question_id=answer.question_id,
        answer_value=answer.answer_value
    )
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

@router.post("/survey", response_model=List[AnswerResponse], status_code=status.HTTP_201_CREATED)
def submit_survey(survey: SurveyResponse, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    answers = []
    for answer_data in survey.answers:
        # Validate answer value
        if answer_data.answer_value < 1 or answer_data.answer_value > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Answer value for question {answer_data.question_id} must be between 1 and 10"
            )
        
        # Check if question exists
        question = db.query(Question).filter(Question.id == answer_data.question_id).first()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Question {answer_data.question_id} not found"
            )
        
        # Update or create answer
        existing_answer = db.query(Answer).filter(
            Answer.user_id == current_user.id,
            Answer.question_id == answer_data.question_id
        ).first()
        
        if existing_answer:
            existing_answer.answer_value = answer_data.answer_value
            answers.append(existing_answer)
        else:
            db_answer = Answer(
                user_id=current_user.id,
                question_id=answer_data.question_id,
                answer_value=answer_data.answer_value
            )
            db.add(db_answer)
            answers.append(db_answer)
    
    db.commit()
    for answer in answers:
        db.refresh(answer)
    return answers

@router.get("/user", response_model=List[AnswerResponse])
def get_user_answers(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    answers = db.query(Answer).filter(Answer.user_id == current_user.id).all()
    return answers

@router.put("/{answer_id}", response_model=AnswerResponse)
def update_answer(answer_id: int, answer_update: AnswerUpdate, db: Session = Depends(get_db)):
    if answer_update.answer_value < 1 or answer_update.answer_value > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Answer value must be between 1 and 10"
        )
    
    db_answer = db.query(Answer).filter(Answer.id == answer_id).first()
    if not db_answer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Answer not found"
        )
    
    db_answer.answer_value = answer_update.answer_value
    db.commit()
    db.refresh(db_answer)
    return db_answer
