from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from .models import AttendanceCalculator, db, LeaveDate, Timetable, AttendanceLog, get_public_user
from datetime import datetime

bp = Blueprint('attendance', __name__)

@bp.route('/')
def index():
    """Landing page with 3 interface options"""
    return render_template('index.html', user=get_public_user())

# Removed subject routes

@bp.route('/current-attendance', methods=['GET', 'POST'])
def current_attendance():
    """Interface 1: Check and update current global attendance percentage"""
    user = get_public_user()
    if request.method == 'POST':
        total = request.form.get('total_classes')
        attended = request.form.get('attended_classes')
        
        if total is not None and attended is not None:
            try:
                user.total_classes = int(total)
                user.attended_classes = int(attended)
                db.session.commit()
                flash('Attendance updated successfully!', 'success')
            except ValueError:
                flash('Please enter valid numbers.', 'error')
            except Exception as e:
                db.session.rollback()
                flash('An error occurred.', 'error')
        return redirect(url_for('attendance.current_attendance'))
        
    return render_template('current_attendance.html', user=user)

@bp.route('/predict-attendance', methods=['GET', 'POST'])
def predict_attendance():
    """Interface 2: Predict classes needed to reach target percentage globally"""
    user = get_public_user()
    classes_per_day = 6
    
    if request.method == 'POST':
        input_mode = request.form.get('input_mode', 'days')
        future_classes_input = int(request.form.get('future_classes', 0) or 0)
        expected_days = int(request.form.get('expected_days', 0) or 0)
        future_attendance_input = int(request.form.get('future_attendance', 0) or 0)
        target_percentage = float(request.form.get('target_percentage', 75))
        if input_mode == 'days':
            if expected_days == 0:
                result = {"error": "Enter expected days to continue."}
                return render_template(
                    'predict_attendance.html',
                    result=result,
                    calculated=True,
                    user=user,
                    input_mode=input_mode,
                    future_classes_input=future_classes_input,
                    expected_days=expected_days,
                    future_attendance=future_attendance_input,
                    target_percentage=target_percentage,
                    classes_per_day=classes_per_day
                )
            future_classes = expected_days * classes_per_day
            future_attendance = future_attendance_input * classes_per_day
        else:
            input_mode = 'classes'
            if future_classes_input == 0:
                result = {"error": "Enter expected classes to continue."}
                return render_template(
                    'predict_attendance.html',
                    result=result,
                    calculated=True,
                    user=user,
                    input_mode=input_mode,
                    future_classes_input=future_classes_input,
                    expected_days=expected_days,
                    future_attendance=future_attendance_input,
                    target_percentage=target_percentage,
                    classes_per_day=classes_per_day
                )
            future_classes = future_classes_input
            future_attendance = future_attendance_input

        if future_attendance > future_classes:
            result = {"error": f"Expected {'days' if input_mode == 'days' else 'classes'} to attend cannot exceed total expected {'days' if input_mode == 'days' else 'classes'}."}
            return render_template(
                'predict_attendance.html',
                result=result,
                calculated=True,
                user=user,
                input_mode=input_mode,
                future_classes_input=future_classes_input,
                expected_days=expected_days,
                future_attendance=future_attendance_input,
                target_percentage=target_percentage,
                classes_per_day=classes_per_day
            )
            
        result = AttendanceCalculator.calculate_required_classes(
            user.total_classes, 
            user.attended_classes,
            future_classes,
            future_attendance,
            target_percentage
        )
        if not result.get("error"):
            required_classes = result.get("required_classes", 0)
            result["required_days"] = (required_classes + classes_per_day - 1) // classes_per_day
        
        return render_template('predict_attendance.html',
                             result=result,
                             calculated=True,
                             user=user,
                             input_mode=input_mode,
                             future_classes_input=future_classes_input,
                             expected_days=expected_days,
                             future_attendance=future_attendance_input,
                             target_percentage=target_percentage,
                             classes_per_day=classes_per_day)
    
    return render_template(
        'predict_attendance.html',
        calculated=False,
        user=user,
        input_mode='days',
        future_classes_input=0,
        expected_days=0,
        future_attendance=0,
        target_percentage=75,
        classes_per_day=classes_per_day
    )

@bp.route('/leave-calendar')
def leave_calendar():
    user = get_public_user()
    leaves = LeaveDate.query.filter_by(user_id=user.id).all()
    leave_dates = [leave.date.isoformat() for leave in leaves]
    return render_template('leave_calendar.html', 
                             leave_dates=leave_dates,
                             today_date=datetime.now().date().isoformat(),
                             user=user)

@bp.route('/api/save-leave-dates', methods=['POST'])
def save_leave_dates():
    user = get_public_user()
    data = request.get_json()
    if not data or 'dates' not in data:
        return jsonify({'status': 'error', 'message': 'No dates provided'}), 400
        
    dates = data['dates']
    
    try:
        # Clear existing leaves for this user
        LeaveDate.query.filter_by(user_id=user.id).delete()
        
        # Add new leaves
        today = datetime.now().date()
        for date_str in dates:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
            if date_obj < today:
                continue
            new_leave = LeaveDate(date=date_obj, user_id=user.id)
            db.session.add(new_leave)
            
        db.session.commit()
        return jsonify({'status': 'success'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/api/save-attendance', methods=['POST'])
def save_attendance():
    """Save manually adjusted global attendance from the calendar"""
    user = get_public_user()
    data = request.get_json()
    if data:
        user.total_classes = int(data.get('total', user.total_classes))
        user.attended_classes = int(data.get('attended', user.attended_classes))
        db.session.commit()
    return jsonify({'status': 'success', 'message': 'Attendance tracked in DB'})

@bp.route('/daily-log', methods=['GET', 'POST'])
def daily_log():
    """Interface to manage weekly schedule and log daily attendance"""
    user = get_public_user()
    if request.method == 'POST':
        class_label = request.form.get('class_label', 'Class')
        day_of_week = request.form.get('day_of_week')
        
        if day_of_week is not None:
            new_entry = Timetable(class_label=class_label, day_of_week=int(day_of_week), user_id=user.id)
            db.session.add(new_entry)
            try:
                db.session.commit()
                flash('Schedule entry added!', 'success')
            except Exception as e:
                db.session.rollback()
                flash('An error occurred.', 'error')
        return redirect(url_for('attendance.daily_log'))
        
    # Today's status
    today = datetime.now().date()
    day_of_week = today.weekday()
    today_classes = Timetable.query.filter_by(user_id=user.id, day_of_week=day_of_week).all()
    
    # Check if already logged today
    already_logged = AttendanceLog.query.filter_by(user_id=user.id, date=today).first() is not None
    
    # Weekly Data
    timetable_entries = Timetable.query.filter_by(user_id=user.id).order_by(Timetable.day_of_week).all()
    days = {0: 'Monday', 1: 'Tuesday', 2: 'Wednesday', 3: 'Thursday', 4: 'Friday', 5: 'Saturday', 6: 'Sunday'}
    schedule = {day: [] for day in range(7)}
    for entry in timetable_entries:
        schedule[entry.day_of_week].append(entry)
        
    return render_template('daily_log.html', 
                             schedule=schedule, 
                             days=days, 
                             today_classes=today_classes,
                             already_logged=already_logged,
                             today_name=days[day_of_week])

@bp.route('/api/log-attendance', methods=['POST'])
def log_attendance():
    """Manually check-in for today's classes"""
    user = get_public_user()
    today = datetime.now().date()
    day_of_week = today.weekday()
    
    # Check if already logged
    if AttendanceLog.query.filter_by(user_id=user.id, date=today).first():
        return jsonify({'status': 'error', 'message': 'Already logged today!'}), 400
        
    classes_today = Timetable.query.filter_by(user_id=user.id, day_of_week=day_of_week).count()
    
    if classes_today == 0:
        return jsonify({'status': 'error', 'message': 'No classes scheduled for today!'}), 400
        
    # Log it
    new_log = AttendanceLog(user_id=user.id, date=today)
    db.session.add(new_log)
    
    # Update counters
    user.total_classes += classes_today
    user.attended_classes += classes_today
    
    try:
        db.session.commit()
        return jsonify({'status': 'success', 'message': f'Successfully logged {classes_today} classes!'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': str(e)}), 500

@bp.route('/timetable/<int:entry_id>/delete', methods=['POST'])
def delete_timetable_entry(entry_id):
    user = get_public_user()
    entry = Timetable.query.get_or_404(entry_id)
    if entry.user_id == user.id:
        db.session.delete(entry)
        db.session.commit()
        flash('Entry deleted.', 'success')
    return redirect(url_for('attendance.daily_log'))
