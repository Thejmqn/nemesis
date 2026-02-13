import json
import os
from typing import List, Dict, Optional
from pathlib import Path

# Get the path to questions.json
BASE_DIR = Path(__file__).resolve().parent.parent.parent
QUESTIONS_FILE = BASE_DIR / "data" / "questions.json"

def load_questions() -> List[Dict]:
    """Load questions from JSON file"""
    if not QUESTIONS_FILE.exists():
        return []
    
    try:
        with open(QUESTIONS_FILE, 'r', encoding='utf-8') as f:
            questions = json.load(f)
        return questions
    except (json.JSONDecodeError, IOError) as e:
        print(f"Error loading questions: {e}")
        return []

def save_questions(questions: List[Dict]) -> bool:
    """Save questions to JSON file"""
    try:
        # Ensure directory exists
        QUESTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
        
        with open(QUESTIONS_FILE, 'w', encoding='utf-8') as f:
            json.dump(questions, f, indent=2, ensure_ascii=False)
        return True
    except IOError as e:
        print(f"Error saving questions: {e}")
        return False

def get_question_by_id(question_id: int) -> Optional[Dict]:
    """Get a question by its ID"""
    questions = load_questions()
    for question in questions:
        if question.get('id') == question_id:
            return question
    return None

def get_active_questions() -> List[Dict]:
    """Get all active questions"""
    questions = load_questions()
    return [q for q in questions if q.get('is_active', True)]

def add_question(question: Dict) -> Dict:
    """Add a new question to the JSON file"""
    questions = load_questions()
    
    # Generate new ID if not provided
    if 'id' not in question:
        max_id = max([q.get('id', 0) for q in questions], default=0)
        question['id'] = max_id + 1
    
    # Set defaults
    if 'type' not in question:
        question['type'] = 'scale'
    if 'is_active' not in question:
        question['is_active'] = True
    if question['type'] == 'scale':
        question.setdefault('min', 1)
        question.setdefault('max', 10)
    
    questions.append(question)
    save_questions(questions)
    return question

def update_question(question_id: int, updates: Dict) -> Optional[Dict]:
    """Update a question in the JSON file"""
    questions = load_questions()
    
    for i, question in enumerate(questions):
        if question.get('id') == question_id:
            questions[i].update(updates)
            save_questions(questions)
            return questions[i]
    
    return None

def deactivate_question(question_id: int) -> bool:
    """Deactivate a question"""
    return update_question(question_id, {'is_active': False}) is not None
