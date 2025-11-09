import logging.config
import os

import sys

LOG_DIR = os.path.join(os.path.expandvars('%userprofile%\\ora2pg'), 'logs')
os.makedirs(LOG_DIR, exist_ok=True)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    # format in which logs will be written
    'formatters': {
        'simple': {
            'format': '[%(asctime)s] %(levelname)s [%(filename)s.%(funcName)s:%(lineno)d] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
        'verbose': {
            'format': '[%(asctime)s] %(levelname)s [%(filename)s.%(funcName)s:%(lineno)d] %(message)s',
            'datefmt': '%Y-%m-%d %H:%M:%S'
        },
    },
    # handlers define the file to be written, which level to write in that file,
    # which format to use and which filter applies to that logger
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
            'stream': sys.stdout,
        },
        'debug_logfile': {
            'level': 'DEBUG',
            'class': 'logging.handlers.RotatingFileHandler',
            'maxBytes': 10485760,
            'filename': os.path.join(LOG_DIR, 'debug.log'),
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
        'error_logfile': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'maxBytes': 10485760,
            'filename': os.path.join(LOG_DIR, 'error.log'),
            'formatter': 'verbose',
            'encoding': 'utf-8',
        },
    },
    # here the handlers for the loggers and the level of each logger is defined
    'loggers': {
        'console_logger': {
            'handlers': ['console'],
            'level': 'INFO'
        },
        'debug_logger': {
            'handlers': ['debug_logfile'],
            'level': 'DEBUG'
        },
        'error_logger': {
            'handlers': ['error_logfile'],
            'level': 'ERROR'
        },
    },
    'root': {
        "level": "INFO",
        "handlers": ["console"
                     , "debug_logfile"
                    ]
    }
}


def get_logger():
    logging.config.dictConfig(LOGGING)
    return logging.getLogger()
