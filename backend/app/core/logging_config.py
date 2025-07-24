import logging
import sys
from logging.handlers import TimedRotatingFileHandler

# --- Constants ---
LOG_FORMAT = "%(asctime)s - %(levelname)s - %(name)s - %(message)s (%(filename)s:%(lineno)d)"
LOG_FILE = "logs/backend.log"

# --- Configuration ---
def setup_logging():
    """Configure logging for the entire application."""
    # Get root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove any existing handlers to avoid duplicates
    if root_logger.hasHandlers():
        root_logger.handlers.clear()

    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT)

    # --- Handlers ---
    # 1. Console Handler (for development)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)

    # 2. File Handler (for persistent logs)
    # This will rotate the log file every day, keeping the last 7 days of logs.
    # It also creates the 'logs' directory if it doesn't exist.
    try:
        file_handler = TimedRotatingFileHandler(
            LOG_FILE, 
            when="midnight", 
            interval=1, 
            backupCount=7, 
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)
    except FileNotFoundError:
        import os
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        file_handler = TimedRotatingFileHandler(
            LOG_FILE, 
            when="midnight", 
            interval=1, 
            backupCount=7, 
            encoding='utf-8'
        )
        file_handler.setFormatter(formatter)
        root_logger.addHandler(file_handler)

    logging.info("Logging configured successfully.")
