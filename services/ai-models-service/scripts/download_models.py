#!/usr/bin/env python3
"""
Download large model files that can't be stored in Git
"""
import requests
import os
import sys
from pathlib import Path

def download_file(url, filepath):
    """Download a file with progress bar"""
    try:
        print(f"Downloading {filepath.name}...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        
        with open(filepath, 'wb') as file:
            downloaded = 0
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    file.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\rProgress: {progress:.1f}% ({downloaded}/{total_size} bytes)", end="")
        
        print(f"\nDownloaded {filepath.name} ({filepath.stat().st_size} bytes)")
        return True
        
    except Exception as e:
        print(f"\nFailed to download {filepath.name}: {e}")
        return False

def main():
    """Download all required model files"""
    models_dir = Path(__file__).parent.parent / "models"
    
    downloads = [
        {
            "url": "https://github.com/WongKinYiu/yolov7/releases/download/v0.1/yolov7-w6-pose.pt",
            "path": models_dir / "fall-detection" / "yolov7-w6-pose.pt",
            "description": "YOLOv7 Pose Estimation Weights (307MB)"
        }
    ]
    
    print("Starting model downloads...")
    print("=" * 60)
    
    success_count = 0
    for download in downloads:
        filepath = download["path"]
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        if filepath.exists():
            print(f"{filepath.name} already exists, skipping...")
            success_count += 1
            continue
        
        print(f"{download['description']}")
        if download_file(download["url"], filepath):
            success_count += 1
        print()
    
    print("=" * 60)
    print(f"Download Summary: {success_count}/{len(downloads)} successful")
    
    if success_count == len(downloads):
        print("All models downloaded successfully!")
        return 0
    else:
        print("Some downloads failed. Please check your internet connection and try again.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
