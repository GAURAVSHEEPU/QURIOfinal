"""
Quantum AI Tutor Backend Server
SIH Problem Statement ID: 26140

Entrypoint for starting the AI Tutor, Learner Intelligence, and Recommendation API.
Can be started via:
    python components/tutor/backend/main.py
or:
    cd components/tutor/backend
    python main.py
or:
    uvicorn src.api.main:app --reload --port 8000
"""

import os
import sys

# Ensure backend root is in sys.path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from src.api.main import app

if __name__ == "__main__":
    import uvicorn
    print(f"Starting Quantum AI Tutor Backend from: {BACKEND_DIR}")
    uvicorn.run("src.api.main:app", host="127.0.0.1", port=8000, reload=True, app_dir=BACKEND_DIR)
