"""
Script to seed the database with initial controversial questions.
Run this after setting up the database to populate some starter questions.
"""
from app.database import SessionLocal, engine, Base
from app.models import Question

# Create tables
Base.metadata.create_all(bind=engine)

# Initial controversial questions
questions = [
    "Pineapple belongs on pizza",
    "The Oxford comma is unnecessary",
    "Hot dogs are sandwiches",
    "Cereal is a soup",
    "Ketchup belongs on hot dogs",
    "The toilet paper should hang over, not under",
    "Pineapple on pizza is acceptable",
    "Cilantro tastes like soap",
    "Pineapple is the best pizza topping",
    "Breakfast foods can be eaten at any time of day",
    "Pineapple is a valid pizza topping",
    "The best way to eat a Kit Kat is to break it apart",
    "Pineapple and pizza are a perfect combination",
    "Pineapple on pizza is a crime against food",
    "Pineapple is an acceptable pizza topping",
]

def seed_questions():
    db = SessionLocal()
    try:
        # Check if questions already exist
        existing_count = db.query(Question).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} questions. Skipping seed.")
            return
        
        # Add questions
        for question_text in questions:
            question = Question(text=question_text, is_active=True)
            db.add(question)
        
        db.commit()
        print(f"Successfully seeded {len(questions)} questions!")
    except Exception as e:
        print(f"Error seeding questions: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_questions()
