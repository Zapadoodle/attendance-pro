from flask import Flask
from config import Config
from .models import db, LeaveDate, Timetable, AttendanceLog, get_public_user
from flask_apscheduler import APScheduler
import datetime

scheduler = APScheduler()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.secret_key = Config.SECRET_KEY
    app.config['SESSION_TYPE'] = 'filesystem'
    
    # Initialize extensions
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        get_public_user()
    
    # Register blueprints/routes
    from attendance_app import routes
    app.register_blueprint(routes.bp)
    
    if app.config.get('SCHEDULER_ENABLED', True):
        # Initialize Scheduler
        scheduler.init_app(app)
        
        # We define the scheduled job here
        @scheduler.task('cron', id='daily_attendance_update', hour=23, minute=50)
        def auto_update_attendance():
            with app.app_context():
                user = get_public_user()
                today = datetime.datetime.now().date()
                day_of_week = today.weekday() # 0 is Monday

                classes_today = Timetable.query.filter_by(user_id=user.id, day_of_week=day_of_week).count()

                if classes_today > 0:
                    already_logged = AttendanceLog.query.filter_by(user_id=user.id, date=today).first()

                    if not already_logged:
                        leave = LeaveDate.query.filter_by(user_id=user.id, date=today).first()

                        user.total_classes += classes_today
                        if not leave:
                            user.attended_classes += classes_today
                        
                db.session.commit()
                print(f"[{datetime.datetime.now()}] Background Job: Public attendance updated for today's classes.")

        scheduler.start()

    return app
