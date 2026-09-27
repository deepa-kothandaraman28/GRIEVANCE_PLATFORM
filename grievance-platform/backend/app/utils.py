import os
import uuid

from fastapi import UploadFile, HTTPException

from app.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".mov", ".webm"}


def save_upload(file: UploadFile, subfolder: str) -> str:
    """Persist an uploaded image/video to disk and return a relative path
    that can be served back to the frontend under /uploads/...
    """
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext or 'unknown'}")

    folder = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(folder, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(folder, filename)

    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    size = 0
    with open(full_path, "wb") as out:
        while chunk := file.file.read(1024 * 1024):
            size += len(chunk)
            if size > max_bytes:
                out.close()
                os.remove(full_path)
                raise HTTPException(
                    status_code=413,
                    detail=f"File exceeds the {settings.MAX_UPLOAD_MB}MB upload limit",
                )
            out.write(chunk)

    return f"{subfolder}/{filename}"
