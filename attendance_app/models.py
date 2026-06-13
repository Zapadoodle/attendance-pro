from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from datetime import datetime
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    
    # Global Attendance Counters
    total_classes = db.Column(db.Integer, default=0)
    attended_classes = db.Column(db.Integer, default=0)
    
    leaves = db.relationship('LeaveDate', backref='user', lazy=True, cascade='all, delete-orphan')
    timetables = db.relationship('Timetable', backref='user', lazy=True, cascade='all, delete-orphan')

    @property
    def percentage(self):
        if self.total_classes == 0:
            return 0.0
        return (self.attended_classes / self.total_classes) * 100

class LeaveDate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(200))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class Timetable(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    day_of_week = db.Column(db.Integer, nullable=False) # 0=Monday, 6=Sunday
    class_label = db.Column(db.String(100), nullable=True) # Optional label for the class
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

class AttendanceLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False, default=datetime.utcnow().date)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    
    __table_args__ = (db.UniqueConstraint('date', 'user_id', name='_date_user_uc'),)

class AttendanceCalculator:
    @staticmethod
    def calculate_required_classes(total_classes, attended_classes, future_classes, future_attendance, target_percentage):
        """
        Calculate how many more classes need to be attended to reach target percentage
        considering future expected classes
        
        Formula with future expectations:
        Current: attended/total
        After future: (attended + future_attended) / (total + future_total) = interim_percentage
        Final with X additional: (attended + future_attended + X) / (total + future_total + X) >= target/100
        
        Solving: X >= (target*(total+future_total) - 100*(attended+future_attended)) / (100 - target)
        """
        if target_percentage <= 0 or target_percentage >= 100:
            return {"error": "Target percentage must be between 0 and 100"}
        
        if total_classes < attended_classes:
            return {"error": "Attended classes cannot be more than total classes"}
        
        if future_classes < future_attendance:
            return {"error": "Future attendance cannot exceed future classes"}
        
        if total_classes <= 0:
            return {"error": "Total classes must be greater than 0"}
        
        # Current calculations
        current_percentage = (attended_classes / total_classes * 100)
        
        # After future expectations (without extra classes)
        future_total = total_classes + future_classes
        future_attended = attended_classes + future_attendance
        future_percentage = (future_attended / future_total * 100) if future_total > 0 else 0
        
        # Check if already above target after future expectations
        if future_percentage >= target_percentage:
            return {
                "required_classes": 0,
                "message": f"With your planned future attendance, you'll reach {round(future_percentage, 2)}%!",
                "current_total": total_classes,
                "current_attended": attended_classes,
                "current_percentage": round(current_percentage, 2),
                "future_classes": future_classes,
                "future_attendance": future_attendance,
                "future_percentage": round(future_percentage, 2),
                "final_total": future_total,
                "final_attended": future_attended,
                "final_percentage": round(future_percentage, 2),
                "target_percentage": target_percentage
            }
        
        # Calculate additional classes needed on top of future expectations
        numerator = (target_percentage * future_total) - (100 * future_attended)
        denominator = 100 - target_percentage
        
        if denominator <= 0:
            return {"error": "Invalid target percentage"}
        
        required_classes = numerator / denominator
        
        # Round up to nearest whole class
        required_classes = max(0, required_classes)
        required_classes_int = int(required_classes)
        if required_classes > required_classes_int:
            required_classes_int += 1
        
        # Calculate final values
        final_total = future_total + required_classes_int
        final_attended = future_attended + required_classes_int
        final_percentage = (final_attended / final_total * 100)
        
        return {
            "required_classes": required_classes_int,
            "message": f"You need to attend {required_classes_int} more classes beyond your planned {future_attendance} out of {future_classes} future classes",
            "current_total": total_classes,
            "current_attended": attended_classes,
            "current_percentage": round(current_percentage, 2),
            "future_classes": future_classes,
            "future_attendance": future_attendance,
            "future_percentage": round(future_percentage, 2),
            "final_total": final_total,
            "final_attended": final_attended,
            "final_percentage": round(final_percentage, 2),
            "target_percentage": target_percentage
        }


def get_public_user():
    user = User.query.filter_by(username='public').first()
    if user is None:
        user = User(
            username='public',
            password_hash=generate_password_hash('public-access-disabled', method='pbkdf2:sha256')
        )
        db.session.add(user)
        db.session.commit()
    return user
