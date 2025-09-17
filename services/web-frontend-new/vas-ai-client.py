#!/usr/bin/env python3
"""
VAS AI Client Library
Simplified client for VAS AI integration endpoints
"""

import requests
import json
import logging
from typing import List, Dict, Optional, Union
from urllib.parse import urljoin

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VASAIClient:
    """Simplified VAS AI client for easy integration with AI/ML tools"""
    
    def __init__(self, base_url: str = 'http://10.30.250.245:8000'):
        """
        Initialize VAS AI client
        
        Args:
            base_url: VAS server base URL (default: http://10.30.250.245:8000)
        """
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.token = None
        
        # Set default headers
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'VAS-AI-Client/1.0'
        })
    
    def authenticate(self, username: str = 'admin', password: str = 'admin123') -> bool:
        """
        Authenticate with VAS server
        
        Args:
            username: VAS username (default: admin)
            password: VAS password (default: admin123)
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        try:
            url = urljoin(self.base_url, '/api/auth/login-json')
            response = self.session.post(url, json={
                'username': username,
                'password': password
            })
            
            if response.status_code == 200:
                auth_data = response.json()
                self.token = auth_data.get('access_token')
                
                if self.token:
                    self.session.headers['Authorization'] = f'Bearer {self.token}'
                    logger.info("Authentication successful")
                    return True
                else:
                    logger.error("No access token in response")
                    return False
            else:
                logger.error(f"Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"Authentication error: {e}")
            return False
    
    def check_health(self) -> Dict:
        """
        Check VAS AI integration health
        
        Returns:
            dict: Health status information
        """
        try:
            url = urljoin(self.base_url, '/api/ai/health')
            response = self.session.get(url)
            
            if response.status_code == 200:
                return response.json()
            else:
                return {
                    'status': 'unhealthy',
                    'error': f'HTTP {response.status_code}',
                    'message': 'Health check failed'
                }
                
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'message': 'Health check error'
            }
    
    def get_cameras(self, status_filter: Optional[str] = None, include_rtsp: bool = True) -> List[Dict]:
        """
        Get all cameras with optional filtering
        
        Args:
            status_filter: Filter by status ('ONLINE', 'OFFLINE', etc.)
            include_rtsp: Include RTSP URLs in response
            
        Returns:
            list: List of camera dictionaries
        """
        try:
            url = urljoin(self.base_url, '/api/ai/cameras')
            params = {}
            
            if include_rtsp:
                params['include_rtsp'] = 'true'
            
            if status_filter:
                params['status_filter'] = status_filter
            
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                cameras = response.json()
                logger.info(f"Retrieved {len(cameras)} cameras")
                return cameras
            else:
                logger.error(f"Failed to get cameras: {response.status_code}")
                return []
                
        except Exception as e:
            logger.error(f"Error getting cameras: {e}")
            return []
    
    def get_online_cameras(self) -> List[Dict]:
        """
        Get only online cameras
        
        Returns:
            list: List of online camera dictionaries
        """
        return self.get_cameras(status_filter='ONLINE', include_rtsp=True)
    
    def get_camera_rtsp_url(self, camera_id: str) -> Optional[str]:
        """
        Get RTSP URL for a specific camera
        
        Args:
            camera_id: Camera ID
            
        Returns:
            str: RTSP URL if available, None otherwise
        """
        try:
            url = urljoin(self.base_url, f'/api/ai/camera/{camera_id}/stream-urls')
            response = self.session.get(url)
            
            if response.status_code == 200:
                stream_urls = response.json()
                rtsp_info = stream_urls.get('rtsp', {})
                return rtsp_info.get('url')
            else:
                logger.error(f"Failed to get RTSP URL for camera {camera_id}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting RTSP URL for camera {camera_id}: {e}")
            return None
    
    def get_stream_urls(self, camera_id: str) -> Dict:
        """
        Get all stream URLs for a camera
        
        Args:
            camera_id: Camera ID
            
        Returns:
            dict: Stream URLs dictionary
        """
        try:
            url = urljoin(self.base_url, f'/api/ai/camera/{camera_id}/stream-urls')
            response = self.session.get(url)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get stream URLs for camera {camera_id}: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting stream URLs for camera {camera_id}: {e}")
            return {}
    
    def get_camera_snapshot(self, camera_id: str, width: int = 640, height: int = 480) -> Optional[bytes]:
        """
        Get camera snapshot
        
        Args:
            camera_id: Camera ID
            width: Snapshot width (default: 640)
            height: Snapshot height (default: 480)
            
        Returns:
            bytes: Snapshot image data if successful, None otherwise
        """
        try:
            url = urljoin(self.base_url, f'/api/ai/camera/{camera_id}/snapshot')
            params = {'width': width, 'height': height}
            response = self.session.get(url, params=params)
            
            if response.status_code == 200:
                logger.info(f"Snapshot captured for camera {camera_id}")
                return response.content
            else:
                logger.error(f"Failed to get snapshot for camera {camera_id}: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting snapshot for camera {camera_id}: {e}")
            return None
    
    def save_snapshot(self, camera_id: str, filename: str, width: int = 640, height: int = 480) -> bool:
        """
        Save camera snapshot to file
        
        Args:
            camera_id: Camera ID
            filename: Output filename
            width: Snapshot width (default: 640)
            height: Snapshot height (default: 480)
            
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            snapshot_data = self.get_camera_snapshot(camera_id, width, height)
            if snapshot_data:
                with open(filename, 'wb') as f:
                    f.write(snapshot_data)
                logger.info(f"Snapshot saved to {filename}")
                return True
            else:
                logger.error("Failed to get snapshot data")
                return False
                
        except Exception as e:
            logger.error(f"Error saving snapshot: {e}")
            return False
    
    def get_integration_guide(self) -> Dict:
        """
        Get integration guide information
        
        Returns:
            dict: Integration guide data
        """
        try:
            url = urljoin(self.base_url, '/api/ai/integration-guide')
            response = self.session.get(url)
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get integration guide: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"Error getting integration guide: {e}")
            return {}


# Example usage
if __name__ == "__main__":
    # Initialize client
    client = VASAIClient('http://10.30.250.245:8000')
    
    # Authenticate
    if client.authenticate('admin', 'admin123'):
        print("✅ Authentication successful")
        
        # Check health
        health = client.check_health()
        print(f"🏥 Health status: {health}")
        
        # Get cameras
        cameras = client.get_cameras()
        print(f"📱 Found {len(cameras)} cameras")
        
        # Get online cameras
        online_cameras = client.get_online_cameras()
        print(f"🟢 Online cameras: {len(online_cameras)}")
        
        # Example: Get RTSP URL for first camera
        if cameras:
            first_camera = cameras[0]
            camera_id = first_camera['id']
            camera_name = first_camera.get('name', 'Unnamed')
            
            print(f"\n🎥 Camera: {camera_name}")
            print(f"📋 ID: {camera_id}")
            print(f"📊 Status: {first_camera.get('status', 'UNKNOWN')}")
            
            # Get RTSP URL
            rtsp_url = client.get_camera_rtsp_url(camera_id)
            if rtsp_url:
                print(f"🔗 RTSP URL: {rtsp_url}")
                
                # Example usage with OpenCV
                print("\n💡 Example usage with OpenCV:")
                print("```python")
                print("import cv2")
                print(f"cap = cv2.VideoCapture('{rtsp_url}')")
                print("while True:")
                print("    ret, frame = cap.read()")
                print("    if ret:")
                print("        # Your AI processing here")
                print("        cv2.imshow('AI Analysis', frame)")
                print("        if cv2.waitKey(1) & 0xFF == ord('q'):")
                print("            break")
                print("cap.release()")
                print("cv2.destroyAllWindows()")
                print("```")
            else:
                print("❌ No RTSP URL available")
            
            # Get snapshot
            snapshot_data = client.get_camera_snapshot(camera_id)
            if snapshot_data:
                print(f"📸 Snapshot captured ({len(snapshot_data)} bytes)")
                
                # Save snapshot
                filename = f"snapshot_{camera_id}.jpg"
                if client.save_snapshot(camera_id, filename):
                    print(f"💾 Snapshot saved to {filename}")
            
            # Get all stream URLs
            stream_urls = client.get_stream_urls(camera_id)
            if stream_urls:
                print(f"\n🎬 Stream URLs for {camera_name}:")
                for stream_type, stream_info in stream_urls.items():
                    if isinstance(stream_info, dict):
                        for key, value in stream_info.items():
                            print(f"  {stream_type}.{key}: {value}")
                    else:
                        print(f"  {stream_type}: {stream_info}")
        else:
            print("❌ No cameras found")
    else:
        print("❌ Authentication failed")
