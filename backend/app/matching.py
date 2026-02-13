from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from app.models import User, Answer, Match
from app.services.question_service import get_question_by_id
from typing import Optional, Tuple

def calculate_match_score(user1_id: int, user2_id: int, db: Session) -> float:
    """
    Calculate enemy match score based on answer differences.
    Higher score = more incompatible = better enemy match
    Handles different question types: scale, multiple_choice, boolean
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
    max_possible_difference = 0.0
    
    for question_id in common_questions:
        question = get_question_by_id(question_id)
        if not question:
            continue
        
        question_type = question.get('type', 'scale')
        val1 = user1_dict[question_id]
        val2 = user2_dict[question_id]
        
        if question_type == 'scale':
            min_val = question.get('min', 1)
            max_val = question.get('max', 10)
            difference = abs(val1 - val2)
            max_diff = max_val - min_val
            total_difference += difference
            max_possible_difference += max_diff
        elif question_type == 'multiple_choice':
            # For multiple choice, difference is 1 if different, 0 if same
            difference = 1 if val1 != val2 else 0
            total_difference += difference
            max_possible_difference += 1
        elif question_type == 'boolean':
            # For boolean, difference is 1 if different, 0 if same
            difference = 1 if val1 != val2 else 0
            total_difference += difference
            max_possible_difference += 1
    
    if max_possible_difference == 0:
        return 0.0
    
    # Normalize by max possible difference
    normalized_score = (total_difference / max_possible_difference) * 100  # Scale to 0-100
    
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
