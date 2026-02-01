from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import Match, User, Answer
from app.schemas import MatchResponse
from typing import List
from app.matching import calculate_match_score, find_enemy_match

router = APIRouter()

@router.get("/user/{user_id}", response_model=List[MatchResponse])
def get_user_matches(user_id: int, db: Session = Depends(get_db)):
    # Get all matches for the user
    matches = db.query(Match).filter(Match.user_id == user_id).all()
    
    result = []
    for match in matches:
        enemy = db.query(User).filter(User.id == match.enemy_id).first()
        result.append(MatchResponse(
            id=match.id,
            enemy_id=match.enemy_id,
            enemy_username=enemy.username,
            enemy_email=enemy.email,
            match_score=match.match_score,
            matched_at=match.matched_at
        ))
    
    return result

@router.get("/user/{user_id}/latest", response_model=MatchResponse)
def get_latest_match(user_id: int, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.user_id == user_id).order_by(Match.matched_at.desc()).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No matches found for this user"
        )
    
    enemy = db.query(User).filter(User.id == match.enemy_id).first()
    return MatchResponse(
        id=match.id,
        enemy_id=match.enemy_id,
        enemy_username=enemy.username,
        enemy_email=enemy.email,
        match_score=match.match_score,
        matched_at=match.matched_at
    )

@router.post("/user/{user_id}/find-enemy")
def find_enemy(user_id: int, db: Session = Depends(get_db)):
    """Manually trigger enemy matching for a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    enemy_id, match_score = find_enemy_match(user_id, db)
    if not enemy_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suitable enemy found. Make sure there are other users with answers."
        )
    
    # Create match record
    match = Match(
        user_id=user_id,
        enemy_id=enemy_id,
        match_score=match_score
    )
    db.add(match)
    db.commit()
    db.refresh(match)
    
    enemy = db.query(User).filter(User.id == enemy_id).first()
    return MatchResponse(
        id=match.id,
        enemy_id=enemy_id,
        enemy_username=enemy.username,
        enemy_email=enemy.email,
        match_score=match_score,
        matched_at=match.matched_at
    )
