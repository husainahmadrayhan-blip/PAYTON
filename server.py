
import os
import json
import uuid
import logging
from pathlib import Path
from datetime import datetime, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# --------------------------------------------------
# Configuration
# --------------------------------------------------

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 25 MB

CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hostless-backend")

# Hostless-এর writable storage path environment variable দিয়ে
# পরিবর্তন করা যাবে। /app/projects ব্যবহার করা হচ্ছে না।
DATA_DIR = Path(os.environ.get("DATA_DIR", "/tmp/editor-data"))
PROJECTS_DIR = DATA_DIR / "projects"
UPLOADS_DIR = DATA_DIR / "uploads"

PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".webp", ".bmp"
}


def utc_now():
    return datetime.now(timezone.utc).isoformat()


def safe_project_path(project_id):
    """Project ID থেকে নিরাপদ ফাইলের পথ তৈরি করে।"""
    project_id = str(project_id or "").strip()

    if not project_id or len(project_id) > 100:
        return None

    if not all(c.isalnum() or c in "-_" for c in project_id):
        return None

    return PROJECTS_DIR / f"{project_id}.json"


def error_response(message, status=400):
    return jsonify({"ok": False, "error": message}), status


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.get("/")
def index():
    return jsonify({
        "ok": True,
        "service": "Playwright Editor Backend",
        "health": "/api/health"
    })


@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "status": "running",
        "service": "playwright-editor-backend",
        "time": utc_now(),
        "storage_writable": os.access(DATA_DIR, os.W_OK),
    })


# --------------------------------------------------
# Project APIs
# --------------------------------------------------

@app.get("/api/projects")
def list_projects():
    projects = []

    for file in PROJECTS_DIR.glob("*.json"):
        try:
            with file.open("r", encoding="utf-8") as f:
                data = json.load(f)

            projects.append({
                "id": file.stem,
                "name": data.get("name", file.stem),
                "updatedAt": data.get("updatedAt"),
            })
        except (OSError, json.JSONDecodeError):
            logger.warning("Could not read project: %s", file.name)

    return jsonify({"ok": True, "projects": projects})


@app.post("/api/projects/save")
def save_project():
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        return error_response("JSON object required")

    project_id = body.get("id") or str(uuid.uuid4())
    path = safe_project_path(project_id)

    if path is None:
        return error_response("Invalid project ID")

    data = dict(body)
    data["id"] = project_id
    data["updatedAt"] = utc_now()

    temp_path = path.with_suffix(".tmp")

    try:
        with temp_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(temp_path, path)
    except OSError:
        logger.exception("Project save failed")
        return error_response("Project storage write failed", 500)

    return jsonify({
        "ok": True,
        "message": "Project saved",
        "id": project_id,
        "updatedAt": data["updatedAt"],
    })


@app.get("/api/projects/open/<project_id>")
def open_project(project_id):
    path = safe_project_path(project_id)

    if path is None:
        return error_response("Invalid project ID")

    if not path.is_file():
        return error_response("Project not found", 404)

    try:
        with path.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify({"ok": True, "project": data})
    except (OSError, json.JSONDecodeError):
        logger.exception("Project open failed")
        return error_response("Could not read project", 500)


@app.post("/api/projects/open")
def open_project_post():
    body = request.get_json(silent=True) or {}
    project_id = body.get("id")

    if not project_id:
        return error_response("Project id required")

    path = safe_project_path(project_id)

    if path is None:
        return error_response("Invalid project ID")

    if not path.is_file():
        return error_response("Project not found", 404)

    try:
        with path.open("r", encoding="utf-8") as f:
            return jsonify({"ok": True, "project": json.load(f)})
    except (OSError, json.JSONDecodeError):
        logger.exception("Project open failed")
        return error_response("Could not read project", 500)


@app.delete("/api/projects/<project_id>")
def delete_project(project_id):
    path = safe_project_path(project_id)

    if path is None:
        return error_response("Invalid project ID")

    if not path.is_file():
        return error_response("Project not found", 404)

    try:
        path.unlink()
        return jsonify({"ok": True, "message": "Project deleted"})
    except OSError:
        logger.exception("Project delete failed")
        return error_response("Could not delete project", 500)


# --------------------------------------------------
# Image upload API
# --------------------------------------------------

@app.post("/api/upload-image")
def upload_image():
    image = request.files.get("image") or request.files.get("file")

    if image is None:
        return error_response(
            "Image file required (field name: image or file)"
        )

    original_name = secure_filename(image.filename or "")

    if not original_name:
        return error_response("Invalid filename")

    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return error_response("Unsupported image format")

    stored_name = f"{uuid.uuid4().hex}{extension}"
    destination = UPLOADS_DIR / stored_name

    try:
        image.save(destination)
    except OSError:
        logger.exception("Image upload failed")
        return error_response("Image storage failed", 500)

    return jsonify({
        "ok": True,
        "filename": stored_name,
        "message": "Image uploaded",
    })


# --------------------------------------------------
# Face detection API
# Requires opencv-python-headless in requirements.txt
# --------------------------------------------------

@app.post("/api/face")
def detect_face():
    image_file = request.files.get("image") or request.files.get("file")

    if image_file is None:
        return error_response("Image file required")

    try:
        import cv2
        import numpy as np
    except ImportError:
        return error_response(
            "Face detection dependencies are not installed",
            503,
        )

    try:
        raw = image_file.read()

        if not raw:
            return error_response("Empty image")

        image_array = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

        if image is None:
            return error_response("Invalid image")

        cascade_path = (
            Path(cv2.data.haarcascades)
            / "haarcascade_frontalface_default.xml"
        )

        detector = cv2.CascadeClassifier(str(cascade_path))

        if detector.empty():
            return error_response("Face detector unavailable", 503)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = detector.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30),
        )

        return jsonify({
            "ok": True,
            "count": len(faces),
            "faces": [
                {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h),
                }
                for x, y, w, h in faces
            ],
        })

    except Exception:
        logger.exception("Face detection failed")
        return error_response("Image processing failed", 500)


# --------------------------------------------------
# Error handling
# --------------------------------------------------

@app.errorhandler(413)
def file_too_large(_error):
    return error_response("File too large; maximum size is 25 MB", 413)


@app.errorhandler(404)
def not_found(_error):
    return error_response("API route not found", 404)


@app.errorhandler(500)
def internal_error(_error):
    return error_response("Internal server error", 500)


# --------------------------------------------------
# Start server
# --------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    app.run(host="0.0.0.0", port=port)
