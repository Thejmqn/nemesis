import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings
from sqlalchemy.orm import Session
from app.models import User, Match

async def send_match_email(user: User, enemy: User, match_score: float):
    """Send email notification about new enemy match"""
    if not settings.smtp_user or not settings.smtp_password:
        print(f"Email not configured. Would send match notification to {user.email}")
        return
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "🎯 You Have a New Enemy Match!"
    message["From"] = settings.smtp_from_email or settings.smtp_user
    message["To"] = user.email
    
    # Create email body
    text = f"""
    Hello {user.username}!
    
    Your monthly enemy match has been calculated!
    
    Your new enemy is: {enemy.username} ({enemy.email})
    Incompatibility Score: {match_score:.2f}/100
    
    The higher the score, the more incompatible you are - perfect for an enemy match!
    
    Stay tuned for next month's match!
    """
    
    html = f"""
    <html>
      <body>
        <h2>Hello {user.username}!</h2>
        <p>Your monthly enemy match has been calculated!</p>
        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Your New Enemy:</h3>
          <p><strong>{enemy.username}</strong> ({enemy.email})</p>
          <p>Incompatibility Score: <strong>{match_score:.2f}/100</strong></p>
        </div>
        <p>The higher the score, the more incompatible you are - perfect for an enemy match!</p>
        <p>Stay tuned for next month's match!</p>
      </body>
    </html>
    """
    
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    
    message.attach(part1)
    message.attach(part2)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=True,
        )
        print(f"Match email sent to {user.email}")
    except Exception as e:
        print(f"Failed to send email to {user.email}: {str(e)}")

async def match_all_users(db: Session):
    """Match all users with enemies and send emails"""
    users = db.query(User).all()
    
    for user in users:
        from app.matching import find_enemy_match
        
        enemy_id, match_score = find_enemy_match(user.id, db)
        if enemy_id:
            enemy = db.query(User).filter(User.id == enemy_id).first()
            
            # Create match record
            match = Match(
                user_id=user.id,
                enemy_id=enemy_id,
                match_score=match_score
            )
            db.add(match)
            db.commit()
            db.refresh(match)
            
            # Send email
            await send_match_email(user, enemy, match_score)
            
            # Mark email as sent
            match.email_sent = True
            db.commit()
