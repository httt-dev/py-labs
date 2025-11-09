import json
import os

config_path = 'config.json'
config = {}


def load_config():
    if os.path.exists(config_path):
        try:
            with open(config_path, 'r') as f:
                global config
                config = json.load(f)
        except:
            pass


def save_config():
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=4)
