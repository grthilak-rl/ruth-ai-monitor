"""
Work at Height Safety Detection Model
Production inference code for detecting workers at dangerous heights
"""

import torch
import cv2
import numpy as np
from ultralytics import YOLO
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

class WorkAtHeightDetector:
    """
    Detects workers at dangerous heights without proper safety equipment
    """
    
    def __init__(self, model_path: str, confidence_threshold: float = 0.5):
        """
        Initialize the work at height detector
        
        Args:
            model_path: Path to the trained YOLOv8 model weights
            confidence_threshold: Minimum confidence for detections
        """
        self.model_path = Path(model_path)
        self.confidence_threshold = confidence_threshold
        self.model = None
        self.class_names = {
            0: "person_at_height",
            1: "safety_equipment",
            2: "unsafe_position"
        }
        
        self._load_model()
    
    def _load_model(self):
        """Load the YOLO model"""
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            self.model = YOLO(str(self.model_path))
            logger.info(f"Loaded work at height model from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> Dict:
        """
        Detect work at height violations in an image
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Dictionary containing detection results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        try:
            # Run inference
            results = self.model(image, conf=self.confidence_threshold)
            
            # Process results
            detections = []
            violation_detected = False
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract box information
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = box.conf[0].cpu().numpy()
                        class_id = int(box.cls[0].cpu().numpy())
                        class_name = self.class_names.get(class_id, "unknown")
                        
                        detection = {
                            "bbox": [int(x1), int(y1), int(x2), int(y2)],
                            "confidence": float(confidence),
                            "class_id": class_id,
                            "class_name": class_name
                        }
                        detections.append(detection)
                        
                        # Check for violations
                        if class_name in ["person_at_height", "unsafe_position"]:
                            violation_detected = True
            
            # Determine violation type and severity
            violation_type = None
            severity = "low"
            
            if violation_detected:
                person_at_height = any(d["class_name"] == "person_at_height" for d in detections)
                unsafe_position = any(d["class_name"] == "unsafe_position" for d in detections)
                safety_equipment = any(d["class_name"] == "safety_equipment" for d in detections)
                
                if person_at_height and not safety_equipment:
                    violation_type = "work_at_height_no_safety_equipment"
                    severity = "high"
                elif unsafe_position:
                    violation_type = "unsafe_work_position"
                    severity = "medium"
                elif person_at_height:
                    violation_type = "work_at_height_detected"
                    severity = "low"
            
            return {
                "violation_detected": violation_detected,
                "violation_type": violation_type,
                "severity": severity,
                "confidence": max([d["confidence"] for d in detections]) if detections else 0.0,
                "detections": detections,
                "detection_count": len(detections),
                "model_name": "work_at_height_detector",
                "model_version": "1.0.0"
            }
            
        except Exception as e:
            logger.error(f"Detection failed: {e}")
            return {
                "violation_detected": False,
                "error": str(e),
                "model_name": "work_at_height_detector"
            }
    
    def annotate_image(self, image: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw bounding boxes and labels on the image
        
        Args:
            image: Input image
            detections: List of detection dictionaries
            
        Returns:
            Annotated image
        """
        annotated_image = image.copy()
        
        for detection in detections:
            x1, y1, x2, y2 = detection["bbox"]
            confidence = detection["confidence"]
            class_name = detection["class_name"]
            
            # Choose color based on class
            color = {
                "person_at_height": (0, 0, 255),      # Red
                "safety_equipment": (0, 255, 0),      # Green
                "unsafe_position": (0, 165, 255)      # Orange
            }.get(class_name, (255, 255, 255))        # White default
            
            # Draw bounding box
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{class_name}: {confidence:.2f}"
            label_size = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)[0]
            cv2.rectangle(annotated_image, (x1, y1 - label_size[1] - 10), 
                         (x1 + label_size[0], y1), color, -1)
            cv2.putText(annotated_image, label, (x1, y1 - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        return annotated_image
