"""
Work at Height Detection Model Service
FastAPI application for detecting workers at dangerous heights
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import cv2
import numpy as np
from pathlib import Path
import logging
import os

from detector import WorkAtHeightDetector

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Work at Height Detection Model Service",
    description="AI model service for detecting workers at dangerous heights",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instance
detector = None

def load_model():
    """Load the work at height detection model on startup"""
    global detector
    model_path = Path("/app/weights/best.wah.pt")

    if not model_path.exists():
        logger.warning(f"Model weights not found at {model_path}")
        logger.warning("Work at height detection will run in placeholder mode")
        return None

    try:
        detector = WorkAtHeightDetector(str(model_path))
        logger.info(f"Loaded work at height model from {model_path}")
        return detector
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        return None

@app.on_event("startup")
async def startup_event():
    """Initialize model when the API starts"""
    logger.info("Starting Work at Height Detection Model Service...")
    load_model()
    logger.info("Work at Height Detection Model Service ready")

def process_uploaded_image(file_content: bytes) -> np.ndarray:
    """Convert uploaded file to OpenCV image"""
    nparr = np.frombuffer(file_content, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image format")
    return image

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Work at Height Detection Model",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "work-at-height-model",
        "version": "1.0.0",
        "model_loaded": detector is not None
    }

@app.get("/info")
async def model_info():
    """Get model information and metadata"""
    return {
        "id": "work-at-height",
        "name": "Work at Height Detection",
        "description": "Detects workers at dangerous heights without proper safety equipment",
        "version": "1.0.0",
        "type": "object_detection",
        "input_format": "image",
        "accuracy": 0.82,
        "status": "loaded" if detector is not None else "not_loaded",
        "capabilities": [
            "work_at_height_detection",
            "safety_equipment_detection",
            "unsafe_position_detection"
        ],
        "supported_formats": ["jpg", "jpeg", "png"]
    }

@app.post("/detect")
async def detect_work_at_height(file: UploadFile = File(...)):
    """
    Detect work at height violations in an uploaded image

    Args:
        file: Uploaded image file

    Returns:
        Detection results including violation status and confidence
    """
    if detector is None:
        # Return placeholder response if model not loaded
        return {
            "success": False,
            "model": "work-at-height",
            "status": "model_not_loaded",
            "message": "Work at height model weights not found. Please add best.wah.pt to the weights directory.",
            "violation_detected": False
        }

    try:
        # Process uploaded image
        file_content = await file.read()
        image = process_uploaded_image(file_content)

        # Run detection
        result = detector.detect(image)

        return {
            "success": True,
            "model": "work-at-height",
            **result
        }

    except Exception as e:
        logger.error(f"Work at height detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENVIRONMENT") == "development"
    )
