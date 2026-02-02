from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import users, questions, answers, matches, auth
from app.scheduler import scheduler

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Nemesis App", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(answers.router, prefix="/api/answers", tags=["answers"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])

# Start scheduler
scheduler.start()

@app.get("/")
def read_root():
    return {"message": "Welcome to Nemesis App - Find Your Enemy!"}

@app.on_event("shutdown")
def shutdown_event():
    scheduler.shutdown()
