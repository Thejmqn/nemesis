from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.database import get_db
from app.models import Match, User, Answer
from app.schemas import MatchResponse
from app.routers.auth import get_current_user
from typing import List
from app.matching import calculate_match_score, find_enemy_match

router = APIRouter()

@router.get("/user", response_model=List[MatchResponse])
def get_user_matches(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Get all matches for the user
    matches = db.query(Match).filter(Match.user_id == current_user.id).all()
    
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

@router.get("/user/latest", response_model=MatchResponse)
def get_latest_match(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.user_id == current_user.id).order_by(Match.matched_at.desc()).first()
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

@router.post("/user/find-enemy")
def find_enemy(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Manually trigger enemy matching for a user"""
    enemy_id, match_score = find_enemy_match(current_user.id, db)
    if not enemy_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No suitable enemy found. Make sure there are other users with answers."
        )
    
    # Create match record
    match = Match(
        user_id=current_user.id,
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
