# Attendance Pro Project Report

## 1. Project Overview

**Project Title:** Attendance Pro & Detention Prevention  
**Project Type:** Web-based attendance management system  
**Framework:** Flask (Python)  
**Database:** SQLite with SQLAlchemy ORM

Attendance Pro is a Flask-based web application designed to help students manage attendance records, predict future attendance percentage, maintain a weekly class schedule, and mark leave dates. The project combines attendance tracking with a simple prediction engine so users can understand how many classes they need to attend to stay above a target percentage such as 75%.

The application supports individual user accounts, persistent attendance storage, leave planning, daily attendance logging, and a scheduled background process for automatic updates.

## 2. Problem Statement

Students often struggle to manually calculate attendance percentage, estimate how absences will affect eligibility, and keep track of classes they have attended or missed. Traditional attendance tracking is usually fragmented and reactive.

This project addresses that problem by providing:

- A centralized personal attendance dashboard
- A prediction tool for target attendance planning
- A leave calendar for planned absences
- A daily schedule and attendance logging feature
- Automatic attendance updates based on timetable and leave data

## 3. Objectives

The main objectives of the project are:

- To provide a simple web interface for attendance tracking
- To help users monitor current attendance percentage
- To allow prediction of future attendance outcomes
- To support leave planning and schedule-based daily logging
- To maintain user-specific records securely through authentication

## 4. Technology Stack

- **Backend:** Python, Flask
- **Database Layer:** Flask-SQLAlchemy
- **Authentication:** Flask-Login
- **Scheduling:** Flask-APScheduler
- **Frontend:** HTML, Jinja2 templates, Bootstrap, JavaScript
- **Session Handling:** Flask-Session
- **Database:** SQLite (`attendance.db`)

## 5. System Architecture

The project follows a modular Flask application structure.

- `app.py` starts the application by calling the app factory.
- `attendance_app/__init__.py` initializes Flask, SQLAlchemy, login management, and APScheduler.
- `attendance_app/models.py` defines database models and attendance calculation logic.
- `attendance_app/auth.py` contains registration, login, and logout routes.
- `attendance_app/routes.py` contains the main attendance, leave, prediction, and timetable routes.
- `attendance_app/templates/` contains the HTML pages rendered to users.
- `attendance_app/static/` stores CSS, JavaScript, manifest, and service worker files.
- `config.py` stores core configuration such as secret key, database URI, and debug settings.

## 6. Core Features Implemented

### 6.1 User Authentication

The system allows users to:

- Register a new account
- Log in using username and password
- Log out securely

Passwords are stored as hashes using Werkzeug security utilities.

### 6.2 Current Attendance Management

Users can:

- View total classes
- View attended classes
- See their current attendance percentage
- Manually update attendance values

This acts as the base attendance record for all prediction features.

### 6.3 Attendance Prediction

The project includes an attendance calculator that estimates how many additional classes must be attended to reach a chosen target percentage.

The prediction considers:

- Current total classes
- Current attended classes
- Expected future classes
- Expected future attended classes
- Target attendance percentage

This makes the application useful not only for record keeping but also for planning.

### 6.4 Leave Calendar

Users can mark leave dates using a calendar-based interface. The selected dates are stored in the database and can be used during attendance planning.

The leave section also allows users to:

- View saved leave dates
- Recalculate attendance impact
- Save or clear leave selections

### 6.5 Daily Schedule and Attendance Logging

The system supports a weekly timetable where users can add class entries by day. Based on the current day, the system shows scheduled classes and allows one-click daily attendance logging.

This feature includes:

- Adding timetable entries
- Viewing the weekly schedule
- Removing timetable entries
- Logging attendance for the current day only once

### 6.6 Automated Attendance Update

The app uses APScheduler to run a daily background job at **11:50 PM**. This job:

- Checks each user's timetable for that day
- Determines the number of scheduled classes
- Checks whether attendance was already logged manually
- Checks whether the user marked leave
- Updates global attendance counters automatically

This reduces the need for manual daily entry.

### 6.7 Progressive Web App Support

The project includes:

- `manifest.json`
- `sw.js` service worker

This shows an attempt to support installable and cached web usage, although the PWA setup is only partial in the current version.

## 7. Database Design

The main database entities are:

### 7.1 User

- `id`
- `username`
- `password_hash`
- `total_classes`
- `attended_classes`

### 7.2 LeaveDate

- `id`
- `date`
- `reason`
- `user_id`

### 7.3 Timetable

- `id`
- `day_of_week`
- `class_label`
- `user_id`

### 7.4 AttendanceLog

- `id`
- `date`
- `user_id`

`AttendanceLog` uses a uniqueness constraint on `(date, user_id)` to prevent duplicate daily logging.

## 8. Functional Workflow

The typical user flow is:

1. Register or log in
2. Set or update current attendance
3. Add weekly timetable entries
4. Mark leave dates if planned
5. Log attendance for the current day when classes are attended
6. Use the prediction tool to estimate future attendance requirements
7. Let the scheduler perform automatic end-of-day updates

## 9. Strengths of the Project

- Clear separation of authentication, routes, models, and templates
- Useful combination of tracking and prediction
- Persistent user-specific data storage
- Simple and practical UI structure
- Automatic attendance update concept reduces manual work
- Includes timetable-based and leave-based planning

## 10. Current Limitations

Based on the present codebase, the following limitations exist:

- The README is minimal and does not yet document setup or usage.
- There are no automated tests in the repository.
- Input validation is limited in several form handlers.
- `DEBUG = True` is enabled in configuration, which is not suitable for production.
- The service worker references static icon assets that are not present in the repository.
- The scheduler currently increases `total_classes` for timetable days and increases `attended_classes` whenever leave is **not** marked, which may not correctly represent absence handling in all scenarios.
- Attendance is stored as a global total rather than subject-wise attendance, so detailed per-subject reporting is not available.

## 11. Possible Enhancements

The project can be improved further with:

- Subject-wise attendance tracking
- Faculty/admin dashboard
- Better leave reason management and approval workflow
- Stronger validation and error handling
- Charts and analytics for trends over time
- Export of attendance reports to PDF or Excel
- Email or notification reminders for low attendance
- Unit and integration test coverage
- Production-ready deployment configuration

## 12. Conclusion

Attendance Pro is a practical academic utility project that demonstrates full-stack web development using Flask. It combines authentication, database management, scheduling, prediction logic, and UI integration into a single usable system.

The project already provides meaningful value for student attendance monitoring and planning. With stronger validation, testing, and some refinements in attendance automation logic, it can be developed into a more robust and production-ready solution.

## 13. Files Reviewed for This Report

- `app.py`
- `config.py`
- `requirements.txt`
- `attendance_app/__init__.py`
- `attendance_app/models.py`
- `attendance_app/auth.py`
- `attendance_app/routes.py`
- `attendance_app/templates/`
- `attendance_app/static/manifest.json`
- `attendance_app/static/sw.js`
