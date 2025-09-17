"""
AI Models API Service
FastAPI application for serving AI model predictions
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, Any
import logging

# Import our model classes
from src.models.work_at_height_detector import WorkAtHeightDetector
from src.models.fall_detector import FallDetector

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Ruth AI - Models Service",
    description="AI Models API for Industrial Safety Monitoring",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model instances
models = {}

def load_models():
    """Load all AI models on startup"""
    models_dir = Path(__file__).parent.parent / "models"
    
    try:
        # Load Work at Height detector
        wah_model_path = models_dir / "work-at-height" / "best.wah.pt"
        if wah_model_path.exists():
            models["work_at_height"] = WorkAtHeightDetector(str(wah_model_path))
            logger.info("Loaded Work at Height detector")
        else:
            logger.warning(f"Work at Height model not found: {wah_model_path}")
        
        # Load Fall detector
        fall_model_path = models_dir / "fall-detection" / "yolov7-w6-pose.pt"
        if fall_model_path.exists():
            models["fall_detection"] = FallDetector(str(fall_model_path))
            logger.info("Loaded Fall detector")
        else:
            logger.warning(f"Fall detection model not found: {fall_model_path}")
        
    except Exception as e:
        logger.error(f"Error loading models: {e}")

@app.on_event("startup")
async def startup_event():
    """Load models when the API starts"""
    logger.info("Starting Ruth AI Models Service...")
    load_models()
    logger.info(f"Loaded {len(models)} models")

def process_uploaded_image(file_content: bytes) -> np.ndarray:
    """Convert uploaded file to OpenCV image"""
    nparr = np.frombuffer(file_content, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise HTTPException(status_code=400, detail="Invalid image format")
    return image

@app.get("/")
async def root():
    return {"message": "Ruth AI Models Service", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ai-models",
        "version": "1.0.0",
        "models_loaded": len(models),
        "available_models": list(models.keys())
    }

@app.get("/models")
async def list_models():
    """List all available models"""
    model_list = []
    for model_name, model_instance in models.items():
        model_list.append({
            "name": model_name,
            "version": "1.0.0",
            "status": "loaded",
            "type": "object_detection" if model_name == "work_at_height" else "pose_estimation"
        })
    
    return {"models": model_list}

@app.post("/detect/work-at-height")
async def detect_work_at_height(file: UploadFile = File(...)):
    """Work at height detection endpoint"""
    if "work_at_height" not in models:
        raise HTTPException(status_code=503, detail="Work at height model not loaded")
    
    try:
        # Process uploaded image
        file_content = await file.read()
        image = process_uploaded_image(file_content)
        
        # Run detection
        result = models["work_at_height"].detect(image)
        
        return {
            "success": True,
            "model": "work_at_height",
            **result
        }
        
    except Exception as e:
        logger.error(f"Work at height detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/fall")
async def detect_fall(file: UploadFile = File(...)):
    """Fall detection endpoint"""
    if "fall_detection" not in models:
        raise HTTPException(status_code=503, detail="Fall detection model not loaded")
    
    try:
        # Process uploaded image
        file_content = await file.read()
        image = process_uploaded_image(file_content)
        
        # Run detection
        result = models["fall_detection"].detect(image)
        
        return {
            "success": True,
            "model": "fall_detection",
            **result
        }
        
    except Exception as e:
        logger.error(f"Fall detection failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/fire")
async def detect_fire(file: UploadFile = File(...)):
    """Fire/smoke detection endpoint - placeholder"""
    return {
        "model": "fire-detection",
        "status": "placeholder",
        "message": "This is a placeholder endpoint. Actual model integration pending."
    }

@app.post("/detect/restricted-area")
async def detect_restricted_area(file: UploadFile = File(...)):
    """Restricted area detection endpoint - placeholder"""
    return {
        "model": "restricted-area",
        "status": "placeholder",
        "message": "This is a placeholder endpoint. Actual model integration pending."
    }

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=os.getenv("ENVIRONMENT") == "development"
    )
