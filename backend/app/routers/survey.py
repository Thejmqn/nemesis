from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import Answer, User
from app.routers.auth import get_current_user
from app.schemas import AnswerResponse, AnswerUpdate, SurveyQuestionResponse, SurveyQuestionSummary
from app.services.question_service import get_active_questions, get_question_by_id, load_questions


router = APIRouter()


def _validate_answer_value(question: dict, answer_value: int) -> None:
    question_type = question.get("type", "scale")

    if question_type == "scale":
        min_val = question.get("min", 1)
        max_val = question.get("max", 10)
        if answer_value < min_val or answer_value > max_val:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Answer value must be between {min_val} and {max_val}",
            )
        return

    if question_type == "multiple_choice":
        choices = question.get("choices", []) or []
        if answer_value < 0 or answer_value >= len(choices):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Answer value must be between 0 and {max(len(choices) - 1, 0)}",
            )
        return

    if question_type == "boolean":
        if answer_value not in [0, 1]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Answer value must be 0 or 1",
            )
        return


@router.get("/questions", response_model=List[SurveyQuestionSummary])
def list_survey_questions(
    active_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    questions = get_active_questions() if active_only else load_questions()
    answers = db.query(Answer).filter(Answer.user_id == current_user.id).all()
    answer_map = {a.question_id: a.answer_value for a in answers}

    items: List[SurveyQuestionSummary] = []
    for q in questions:
        qid = q.get("id")
        if qid is None:
            continue
        items.append(
            SurveyQuestionSummary(
                id=qid,
                text=q.get("text", ""),
                answered=qid in answer_map,
                answer_value=answer_map.get(qid),
            )
        )
    return items


@router.get("/{question_id}", response_model=SurveyQuestionResponse)
def get_survey_question(
    question_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    answer = (
        db.query(Answer)
        .filter(Answer.user_id == current_user.id, Answer.question_id == question_id)
        .first()
    )

    return SurveyQuestionResponse(
        **question,
        answered=answer is not None,
        answer_value=answer.answer_value if answer else None,
    )


@router.put("/{question_id}", response_model=AnswerResponse)
def upsert_survey_answer(
    question_id: int,
    answer_update: AnswerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    question = get_question_by_id(question_id)
    if not question:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    _validate_answer_value(question, answer_update.answer_value)

    existing_answer = (
        db.query(Answer)
        .filter(Answer.user_id == current_user.id, Answer.question_id == question_id)
        .first()
    )

    if existing_answer:
        existing_answer.answer_value = answer_update.answer_value
        db.commit()
        db.refresh(existing_answer)
        return existing_answer

    db_answer = Answer(user_id=current_user.id, question_id=question_id, answer_value=answer_update.answer_value)
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

