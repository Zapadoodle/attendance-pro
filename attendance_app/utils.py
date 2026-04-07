from .models import AttendanceCalculator
from flask import session

def calculate_required_classes(total_classes, attended_classes, future_classes=0, future_attendance=0, target_percentage=75):
    calculator = AttendanceCalculator()
    return calculator.calculate_required_classes(
        total_classes, 
        attended_classes, 
        future_classes, 
        future_attendance, 
        target_percentage
    )

def save_leave_dates(dates):
    """Save leave dates to session"""
    session['leave_dates'] = dates

def get_leave_dates():
    """Get leave dates from session"""
    return session.get('leave_dates', [])