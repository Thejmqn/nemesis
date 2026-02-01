from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import User, Answer, Match
from typing import Optional, Tuple

def calculate_match_score(user1_id: int, user2_id: int, db: Session) -> float:
    """
    Calculate enemy match score based on answer differences.
    Higher score = more incompatible = better enemy match
    """
    # Get all answers for both users
    user1_answers = db.query(Answer).filter(Answer.user_id == user1_id).all()
    user2_answers = db.query(Answer).filter(Answer.user_id == user2_id).all()
    
    # Create dictionaries for quick lookup
    user1_dict = {ans.question_id: ans.answer_value for ans in user1_answers}
    user2_dict = {ans.question_id: ans.answer_value for ans in user2_answers}
    
    # Find common questions
    common_questions = set(user1_dict.keys()) & set(user2_dict.keys())
    
    if not common_questions:
        return 0.0
    
    # Calculate total difference (higher difference = better enemy match)
    total_difference = 0.0
    for question_id in common_questions:
        difference = abs(user1_dict[question_id] - user2_dict[question_id])
        total_difference += difference
    
    # Normalize by number of common questions and scale (max difference per question is 9)
    average_difference = total_difference / len(common_questions)
    normalized_score = (average_difference / 9.0) * 100  # Scale to 0-100
    
    return round(normalized_score, 2)

def find_enemy_match(user_id: int, db: Session) -> Optional[Tuple[int, float]]:
    """
    Find the best enemy match for a user.
    Returns (enemy_id, match_score) or None if no match found.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    
    # Get all other users who have answered questions
    user_answers = db.query(Answer).filter(Answer.user_id == user_id).all()
    if not user_answers:
        return None
    
    user_question_ids = {ans.question_id for ans in user_answers}
    
    # Find users who have answered at least some of the same questions
    other_users = db.query(User).filter(User.id != user_id).all()
    
    best_match = None
    best_score = -1.0
    
    for other_user in other_users:
        other_answers = db.query(Answer).filter(Answer.user_id == other_user.id).all()
        if not other_answers:
            continue
        
        other_question_ids = {ans.question_id for ans in other_answers}
        common_questions = user_question_ids & other_question_ids
        
        # Need at least one common question
        if not common_questions:
            continue
        
        # Calculate match score
        score = calculate_match_score(user_id, other_user.id, db)
        
        if score > best_score:
            best_score = score
            best_match = other_user.id
    
    if best_match:
        return (best_match, best_score)
    return None
