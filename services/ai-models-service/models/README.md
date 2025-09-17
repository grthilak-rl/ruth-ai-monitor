# AI Models Directory

This directory contains the AI model files for the Ruth-AI Monitor service.

## Model Structure

```
models/
├── work-at-height/
│   └── best.wah.pt          # Work at Height Detection Model
├── fall-detection/
│   └── yolov7-w6-pose.pt    # Fall Detection Model
└── README.md               # This file
```

## Model Files

### Work at Height Detection
- **File**: `work-at-height/best.wah.pt`
- **Type**: YOLOv8 Object Detection
- **Purpose**: Detect workers at dangerous heights without proper safety equipment
- **Classes**: person_at_height, safety_equipment, unsafe_position

### Fall Detection
- **File**: `fall-detection/yolov7-w6-pose.pt`
- **Type**: YOLOv7 Pose Estimation
- **Purpose**: Detect falls using human pose keypoints
- **Keypoints**: 17 COCO pose keypoints

## Adding New Models

1. Place model files in appropriate subdirectories
2. Update `api/app.py` to load new models
3. Add detection endpoints in the API
4. Update model metadata in the database

## Model Loading

Models are automatically loaded on service startup. If model files are missing, the service will log warnings but continue to run with placeholder endpoints.

## Security Note

Model files are read-only mounted volumes in the Docker container for security.
