from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.database import SessionLocal
from app.email_service import match_all_users
import asyncio

scheduler = AsyncIOScheduler()

async def monthly_matching_job():
    """Job to run monthly enemy matching"""
    print("Running monthly enemy matching...")
    db = SessionLocal()
    try:
        await match_all_users(db)
    except Exception as e:
        print(f"Error in monthly matching job: {str(e)}")
    finally:
        db.close()

# Schedule job to run on the 1st of every month at 9:00 AM
scheduler.add_job(
    monthly_matching_job,
    trigger=CronTrigger(day=1, hour=9, minute=0),
    id="monthly_enemy_matching",
    name="Monthly Enemy Matching",
    replace_existing=True
)
