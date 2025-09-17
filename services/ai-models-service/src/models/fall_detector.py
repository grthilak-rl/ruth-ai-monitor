"""
Fall Detection Model using Pose Estimation
Production inference code for detecting falls using human pose keypoints
"""

import torch
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Tuple, Optional
import logging
import math

logger = logging.getLogger(__name__)

class FallDetector:
    """
    Detects falls using human pose estimation and keypoint analysis
    """
    
    def __init__(self, model_path: str, confidence_threshold: float = 0.6):
        """
        Initialize the fall detector
        
        Args:
            model_path: Path to the YOLOv7 pose model weights
            confidence_threshold: Minimum confidence for detections
        """
        self.model_path = Path(model_path)
        self.confidence_threshold = confidence_threshold
        self.model = None
        
        # COCO pose keypoint indices
        self.keypoint_names = [
            'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
            'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
            'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
            'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
        ]
        
        # Keypoint connections for skeleton drawing
        self.skeleton = [
            [16, 14], [14, 12], [17, 15], [15, 13], [12, 13],
            [6, 12], [7, 13], [6, 7], [6, 8], [7, 9],
            [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
            [2, 4], [3, 5], [4, 6], [5, 7]
        ]
        
        self._load_model()
    
    def _load_model(self):
        """Load the YOLOv7 pose model"""
        try:
            if not self.model_path.exists():
                raise FileNotFoundError(f"Model file not found: {self.model_path}")
            
            # Load YOLOv7 pose model
            self.model = torch.load(str(self.model_path), map_location='cpu')
            if hasattr(self.model, 'float'):
                self.model.float()
            self.model.eval()
            
            logger.info(f"Loaded fall detection model from {self.model_path}")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise
    
    def detect(self, image: np.ndarray) -> Dict:
        """
        Detect falls in an image using pose estimation
        
        Args:
            image: Input image as numpy array (BGR format)
            
        Returns:
            Dictionary containing detection results
        """
        if self.model is None:
            raise RuntimeError("Model not loaded")
        
        try:
            # Preprocess image
            img_tensor = self._preprocess_image(image)
            
            # Run inference
            with torch.no_grad():
                predictions = self.model(img_tensor)[0]
            
            # Post-process results
            detections = self._postprocess_predictions(predictions, image.shape)
            
            # Analyze poses for fall detection
            fall_detected = False
            fall_confidence = 0.0
            fall_type = None
            
            for detection in detections:
                is_fall, confidence, f_type = self._analyze_pose_for_fall(detection["keypoints"])
                if is_fall and confidence > fall_confidence:
                    fall_detected = True
                    fall_confidence = confidence
                    fall_type = f_type
            
            return {
                "violation_detected": fall_detected,
                "violation_type": fall_type,
                "severity": "critical" if fall_detected else "low",
                "confidence": fall_confidence,
                "detections": detections,
                "detection_count": len(detections),
                "model_name": "fall_detector",
                "model_version": "1.0.0"
            }
            
        except Exception as e:
            logger.error(f"Fall detection failed: {e}")
            return {
                "violation_detected": False,
                "error": str(e),
                "model_name": "fall_detector"
            }
    
    def _preprocess_image(self, image: np.ndarray) -> torch.Tensor:
        """Preprocess image for YOLOv7 pose model"""
        # Resize image to model input size (typically 640x640)
        img = cv2.resize(image, (640, 640))
        img = img[:, :, ::-1].transpose(2, 0, 1)  # BGR to RGB, HWC to CHW
        img = np.ascontiguousarray(img)
        img = torch.from_numpy(img).float()
        img /= 255.0  # Normalize to 0-1
        if img.ndimension() == 3:
            img = img.unsqueeze(0)
        return img
    
    def _postprocess_predictions(self, predictions: torch.Tensor, orig_shape: Tuple[int, int, int]) -> List[Dict]:
        """Post-process model predictions to extract pose keypoints"""
        detections = []
        
        # Apply NMS and filter by confidence
        # This is a simplified version - you might need to adapt based on your model's output format
        for pred in predictions:
            if len(pred) == 0:
                continue
            
            # Extract bounding boxes and keypoints
            for detection in pred:
                if detection[4] > self.confidence_threshold:  # confidence
                    x1, y1, x2, y2 = detection[:4]
                    conf = detection[4]
                    
                    # Extract keypoints (assuming they start from index 5)
                    keypoints = []
                    for i in range(17):  # 17 COCO keypoints
                        kpt_x = detection[5 + i * 3]
                        kpt_y = detection[5 + i * 3 + 1]
                        kpt_conf = detection[5 + i * 3 + 2]
                        keypoints.append([float(kpt_x), float(kpt_y), float(kpt_conf)])
                    
                    detections.append({
                        "bbox": [float(x1), float(y1), float(x2), float(y2)],
                        "confidence": float(conf),
                        "keypoints": keypoints
                    })
        
        return detections
    
    def _analyze_pose_for_fall(self, keypoints: List[List[float]]) -> Tuple[bool, float, Optional[str]]:
        """
        Analyze pose keypoints to detect falls
        
        Args:
            keypoints: List of keypoints [x, y, confidence]
            
        Returns:
            Tuple of (is_fall, confidence, fall_type)
        """
        try:
            # Extract key body parts
            nose = keypoints[0]
            left_shoulder = keypoints[5]
            right_shoulder = keypoints[6]
            left_hip = keypoints[11]
            right_hip = keypoints[12]
            left_knee = keypoints[13]
            right_knee = keypoints[14]
            left_ankle = keypoints[15]
            right_ankle = keypoints[16]
            
            # Check if key points are visible
            key_points_visible = [
                nose[2] > 0.3, left_shoulder[2] > 0.3, right_shoulder[2] > 0.3,
                left_hip[2] > 0.3, right_hip[2] > 0.3
            ]
            
            if not any(key_points_visible):
                return False, 0.0, None
            
            # Calculate body orientation
            if left_shoulder[2] > 0.3 and right_shoulder[2] > 0.3:
                shoulder_center_y = (left_shoulder[1] + right_shoulder[1]) / 2
            else:
                shoulder_center_y = nose[1] if nose[2] > 0.3 else 0
            
            if left_hip[2] > 0.3 and right_hip[2] > 0.3:
                hip_center_y = (left_hip[1] + right_hip[1]) / 2
            else:
                hip_center_y = shoulder_center_y + 100  # Estimate
            
            # Fall detection logic
            fall_indicators = []
            
            # 1. Check if person is horizontal (body orientation)
            if abs(shoulder_center_y - hip_center_y) < 50:  # Nearly same height
                fall_indicators.append(("horizontal_body", 0.8))
            
            # 2. Check if head is lower than hips
            if nose[2] > 0.3 and hip_center_y > 0:
                if nose[1] > hip_center_y + 20:  # Head below hips
                    fall_indicators.append(("head_below_hips", 0.7))
            
            # 3. Check limb positions
            limb_spread = 0
            if left_ankle[2] > 0.3 and right_ankle[2] > 0.3:
                ankle_distance = abs(left_ankle[0] - right_ankle[0])
                if ankle_distance > 100:  # Legs spread wide
                    limb_spread += 0.5
                    fall_indicators.append(("legs_spread", 0.6))
            
            # 4. Overall body compactness (person might be on ground)
            if len([kp for kp in keypoints if kp[2] > 0.3]) > 10:  # Many keypoints visible
                y_coords = [kp[1] for kp in keypoints if kp[2] > 0.3]
                if y_coords:
                    y_range = max(y_coords) - min(y_coords)
                    if y_range < 150:  # Very compact vertically
                        fall_indicators.append(("compact_body", 0.7))
            
            # Determine fall status
            if fall_indicators:
                max_confidence = max(indicator[1] for indicator in fall_indicators)
                fall_types = [indicator[0] for indicator in fall_indicators]
                
                if max_confidence > 0.7:
                    return True, max_confidence, "fall_detected"
                elif max_confidence > 0.5:
                    return True, max_confidence, "possible_fall"
            
            return False, 0.0, None
            
        except Exception as e:
            logger.error(f"Pose analysis failed: {e}")
            return False, 0.0, None
    
    def annotate_image(self, image: np.ndarray, detections: List[Dict]) -> np.ndarray:
        """
        Draw pose keypoints and skeleton on the image
        
        Args:
            image: Input image
            detections: List of detection dictionaries with keypoints
            
        Returns:
            Annotated image
        """
        annotated_image = image.copy()
        
        for detection in detections:
            keypoints = detection["keypoints"]
            
            # Draw skeleton
            for connection in self.skeleton:
                kpt_a, kpt_b = connection
                if (kpt_a - 1 < len(keypoints) and kpt_b - 1 < len(keypoints) and
                    keypoints[kpt_a - 1][2] > 0.3 and keypoints[kpt_b - 1][2] > 0.3):
                    
                    x1, y1 = int(keypoints[kpt_a - 1][0]), int(keypoints[kpt_a - 1][1])
                    x2, y2 = int(keypoints[kpt_b - 1][0]), int(keypoints[kpt_b - 1][1])
                    cv2.line(annotated_image, (x1, y1), (x2, y2), (0, 255, 0), 2)
            
            # Draw keypoints
            for i, (x, y, conf) in enumerate(keypoints):
                if conf > 0.3:
                    cv2.circle(annotated_image, (int(x), int(y)), 5, (0, 0, 255), -1)
            
            # Draw bounding box
            x1, y1, x2, y2 = [int(coord) for coord in detection["bbox"]]
            cv2.rectangle(annotated_image, (x1, y1), (x2, y2), (255, 0, 0), 2)
        
        return annotated_image
