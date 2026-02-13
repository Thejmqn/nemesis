from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas import QuestionCreate, QuestionResponse
from app.services.question_service import (
    load_questions,
    get_question_by_id,
    get_active_questions,
    add_question,
    update_question,
    deactivate_question
)
from typing import List

router = APIRouter()

@router.post("/", response_model=QuestionResponse, status_code=status.HTTP_201_CREATED)
def create_question(question: QuestionCreate):
    """Create a new question (admin only)"""
    question_dict = question.model_dump()
    created_question = add_question(question_dict)
    return QuestionResponse(**created_question)

@router.get("/", response_model=List[QuestionResponse])
def get_questions(active_only: bool = True):
    """Get all questions, optionally filtered by active status"""
    if active_only:
        questions = get_active_questions()
    else:
        questions = load_questions()
    return [QuestionResponse(**q) for q in questions]

@router.get("/{question_id}", response_model=QuestionResponse)
def get_question(question_id: int):
    """Get a question by ID"""
    question = get_question_by_id(question_id)
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    return QuestionResponse(**question)

@router.patch("/{question_id}/deactivate")
def deactivate_question_endpoint(question_id: int):
    """Deactivate a question (admin only)"""
    if deactivate_question(question_id):
        return {"message": "Question deactivated"}
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Question not found"
    )
