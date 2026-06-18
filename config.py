import os
import tempfile
from pathlib import Path

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        SECRET_KEY = 'attendance-pro-default-dev-key-change-in-production'
    if os.environ.get('DATABASE_URL'):
        SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL'].replace(
            'postgres://',
            'postgresql://',
            1
        )
    elif os.environ.get('VERCEL'):
        temp_dir = Path(tempfile.gettempdir())
        temp_dir.mkdir(parents=True, exist_ok=True)
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{(temp_dir / 'attendance.db').as_posix()}"
    else:
        SQLALCHEMY_DATABASE_URI = 'sqlite:///attendance.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = os.environ.get('FLASK_DEBUG') == '1'
    
    # APScheduler Configuration
    SCHEDULER_API_ENABLED = True
    SCHEDULER_ENABLED = os.environ.get('VERCEL') != '1'
    SESSION_FILE_DIR = str(Path('/tmp/flask_session')) if os.environ.get('VERCEL') else 'flask_session'
