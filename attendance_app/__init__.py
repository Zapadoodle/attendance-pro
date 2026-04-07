from flask import Flask
from config import Config
from .models import db, User, LeaveDate, Timetable, AttendanceLog
from flask_login import LoginManager
from flask_apscheduler import APScheduler
import datetime

login_manager = LoginManager()
scheduler = APScheduler()
login_manager.login_view = 'auth.login'
login_manager.login_message_category = 'info'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    app.secret_key = Config.SECRET_KEY
    app.config['SESSION_TYPE'] = 'filesystem'
    
    # Initialize extensions
    db.init_app(app)
    login_manager.init_app(app)
    
    with app.app_context():
        db.create_all()
    
    # Register blueprints/routes
    from attendance_app import routes
    from attendance_app import auth
    app.register_blueprint(routes.bp)
    app.register_blueprint(auth.bp)
    
    # Initialize Scheduler
    scheduler.init_app(app)
    
    # We define the scheduled job here
    @scheduler.task('cron', id='daily_attendance_update', hour=23, minute=50)
    def auto_update_attendance():
        with app.app_context():
            today = datetime.datetime.now().date()
            day_of_week = today.weekday() # 0 is Monday
            
            # Find all users
            users = User.query.all()
            
            for user in users:
                # Find number of classes for this user today
                classes_today = Timetable.query.filter_by(user_id=user.id, day_of_week=day_of_week).count()
                
                if classes_today > 0:
                    # Check if the user already logged manually today
                    already_logged = AttendanceLog.query.filter_by(user_id=user.id, date=today).first()
                    
                    if not already_logged:
                        # Check if the user is on leave today
                        leave = LeaveDate.query.filter_by(user_id=user.id, date=today).first()
                        
                        user.total_classes += classes_today
                        if not leave:
                            user.attended_classes += classes_today
                    
            db.session.commit()
            print(f"[{datetime.datetime.now()}] Background Job: Global attendance updated for users with classes today.")

    scheduler.start()

    return app