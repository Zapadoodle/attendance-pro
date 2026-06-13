# Attendance Pro & Detention Prevention

A Flask web app for tracking student attendance, planning leave days, and calculating how many classes must be attended to reach a target attendance percentage.

The app currently runs as a shared single-user tracker through an automatically created `public` user. An authentication module exists in `attendance_app/auth.py`, but it is not registered by the app factory, so login and registration routes are not active in the current running application.

## Features

- View and update current total and attended classes.
- Calculate current attendance percentage.
- Predict how many additional classes are needed to reach a target percentage.
- Enter future attendance expectations by days or by classes.
- Manage a weekly timetable.
- Log today's scheduled classes once per day.
- Mark leave dates on a calendar.
- Automatically update attendance at 11:50 PM based on the timetable and saved leave dates.
- Use a mobile-friendly Bootstrap interface with a dark/light theme toggle.
- Register a service worker and web app manifest for basic PWA support.

## Tech Stack

- Python
- Flask
- Flask-SQLAlchemy
- SQLite
- Flask-APScheduler
- Flask-Session
- Bootstrap
- FullCalendar
- Font Awesome

## Project Structure

```text
attendance_pro/
|-- app.py
|-- config.py
|-- requirements.txt
|-- vercel.json
|-- attendance_app/
|   |-- __init__.py
|   |-- auth.py
|   |-- models.py
|   |-- routes.py
|   |-- utils.py
|   |-- static/
|   |   |-- css/
|   |   |-- js/
|   |   |-- manifest.json
|   |   `-- sw.js
|   `-- templates/
|       |-- auth/
|       |-- base.html
|       |-- current_attendance.html
|       |-- daily_log.html
|       |-- index.html
|       |-- leave_calendar.html
|       |-- predict_attendance.html
|       `-- result.html
`-- instance/
    `-- attendance.db
```

## Requirements

- Python 3.12 or newer
- `pip`

This project has been tested locally with a virtual environment using the dependencies in `requirements.txt`.

## Setup

Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

Run the app:

```powershell
python app.py
```

Open the app in your browser:

```text
http://127.0.0.1:5000
```

The SQLite database is created automatically on first run.

## Main Routes

| Route | Purpose |
| --- | --- |
| `/` | Home dashboard and attendance summary |
| `/current-attendance` | Update total and attended class counts |
| `/predict-attendance` | Calculate required classes for a target percentage |
| `/daily-log` | Manage weekly timetable and log today's attendance |
| `/leave-calendar` | Mark and save leave dates |
| `/api/save-leave-dates` | Save leave calendar selections |
| `/api/save-attendance` | Save adjusted attendance totals |
| `/api/log-attendance` | Log today's scheduled classes |
| `/timetable/<entry_id>/delete` | Delete a timetable entry |

## Database Models

- `User`: stores the shared public user's attendance counters.
- `LeaveDate`: stores planned leave dates.
- `Timetable`: stores weekly class entries by weekday.
- `AttendanceLog`: prevents duplicate daily attendance logs for the same date.

## Configuration

Configuration is defined in `config.py`.

Important environment variables:

| Variable | Description |
| --- | --- |
| `SECRET_KEY` | Flask secret key. If unset, a random key is generated on startup. |
| `DATABASE_URL` | Optional database URL. `postgres://` is normalized to `postgresql://`. |
| `FLASK_DEBUG` | Set to `1` to enable Flask debug configuration. |
| `VERCEL` | When set to `1`, scheduler is disabled and SQLite/session paths use `/tmp`. |

Local development uses:

```text
sqlite:///attendance.db
```

With Flask's instance path, this resolves to `instance/attendance.db`.

## Deployment Notes

The included `vercel.json` routes all requests to `app.py` using `@vercel/python`.

For deployment:

- Set a stable `SECRET_KEY`.
- Prefer an external persistent database through `DATABASE_URL`.
- Do not rely on local SQLite persistence in serverless environments.
- The APScheduler daily job is disabled when `VERCEL=1`.

## Development Notes

- The app factory is `create_app()` in `attendance_app/__init__.py`.
- The main attendance blueprint is defined in `attendance_app/routes.py`.
- Attendance calculation logic lives in `AttendanceCalculator` in `attendance_app/models.py`.
- `attendance_app/auth.py` contains login/register/logout routes, but the blueprint is not currently registered.

## License

No license file is currently included in this repository.
