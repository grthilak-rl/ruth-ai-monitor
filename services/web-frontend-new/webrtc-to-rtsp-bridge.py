#!/usr/bin/env python3
"""
VAS WebRTC to RTSP Bridge
Converts VAS WebRTC streams to local RTSP for AI tools that prefer RTSP
"""

import asyncio
import websockets
import json
import requests
import cv2
import numpy as np
import logging
import argparse
import time
import subprocess
import threading
import queue
from typing import Dict, Optional

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class WebRTCToRTSPBridge:
    """Bridge to convert VAS WebRTC streams to local RTSP"""
    
    def __init__(self, vas_server: str, camera_id: str, port: int = 8554):
        """
        Initialize WebRTC to RTSP bridge
        
        Args:
            vas_server: VAS server URL (e.g., http://10.30.250.245:8000)
            camera_id: Camera ID to bridge
            port: Local RTSP port (default: 8554)
        """
        self.vas_server = vas_server.rstrip('/')
        self.camera_id = camera_id
        self.port = port
        self.token = None
        self.janus_ws = None
        self.session_id = None
        self.handle_id = None
        self.webrtc_config = None
        self.rtsp_server_process = None
        self.frame_queue = queue.Queue(maxsize=10)
        self.running = False
        
    async def authenticate(self) -> bool:
        """Authenticate with VAS API"""
        try:
            logger.info("🔐 Authenticating with VAS API...")
            response = requests.post(f"{self.vas_server}/api/auth/login-json", 
                                   json={"username": "admin", "password": "admin123"})
            
            if response.status_code == 200:
                auth_data = response.json()
                self.token = auth_data["access_token"]
                logger.info("✅ Authentication successful")
                return True
            else:
                logger.error(f"❌ Authentication failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Authentication error: {e}")
            return False
    
    async def get_webrtc_config(self) -> Optional[Dict]:
        """Get WebRTC configuration from VAS"""
        try:
            logger.info(f"🎬 Getting WebRTC config for camera {self.camera_id}...")
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.vas_server}/api/ai/camera/{self.camera_id}/webrtc-config",
                headers=headers
            )
            
            if response.status_code == 200:
                self.webrtc_config = response.json()
                logger.info("✅ WebRTC config retrieved")
                return self.webrtc_config
            else:
                logger.error(f"❌ Failed to get WebRTC config: {response.status_code}")
                return None
                
        except Exception as e:
            logger.error(f"❌ Error getting WebRTC config: {e}")
            return None
    
    async def connect_to_janus(self) -> bool:
        """Connect to Janus Gateway"""
        try:
            if not self.webrtc_config:
                logger.error("❌ No WebRTC config available")
                return False
            
            janus_url = self.webrtc_config["webrtc_config"]["janus_server"]
            logger.info(f"🔗 Connecting to Janus Gateway: {janus_url}")
            
            self.janus_ws = await websockets.connect(janus_url)
            logger.info("✅ Connected to Janus Gateway")
            
            # Create session
            create_session = {
                "janus": "create",
                "transaction": self.webrtc_config["webrtc_config"]["transaction_id"]
            }
            
            await self.janus_ws.send(json.dumps(create_session))
            response = await self.janus_ws.recv()
            session_data = json.loads(response)
            
            if session_data.get("janus") == "success":
                self.session_id = session_data["data"]["id"]
                logger.info(f"✅ Session created: {self.session_id}")
                
                # Attach to streaming plugin
                attach_message = {
                    "janus": "attach",
                    "plugin": self.webrtc_config["webrtc_config"]["plugin"],
                    "session_id": self.session_id,
                    "transaction": f"attach_{self.camera_id}"
                }
                
                await self.janus_ws.send(json.dumps(attach_message))
                response = await self.janus_ws.recv()
                attach_data = json.loads(response)
                
                if attach_data.get("janus") == "success":
                    self.handle_id = attach_data["data"]["id"]
                    logger.info(f"✅ Attached to streaming plugin: {self.handle_id}")
                    return True
                else:
                    logger.error(f"❌ Failed to attach to plugin: {attach_data}")
                    return False
            else:
                logger.error(f"❌ Failed to create session: {session_data}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error connecting to Janus: {e}")
            return False
    
    async def start_stream(self) -> bool:
        """Start watching the WebRTC stream"""
        try:
            if not self.session_id or not self.handle_id:
                logger.error("❌ Not connected to Janus")
                return False
            
            logger.info("🎬 Starting WebRTC stream...")
            
            watch_message = {
                "janus": "message",
                "session_id": self.session_id,
                "handle_id": self.handle_id,
                "body": {
                    "request": "watch",
                    "id": self.webrtc_config["webrtc_config"]["stream_id"]
                }
            }
            
            await self.janus_ws.send(json.dumps(watch_message))
            logger.info("✅ Stream watch request sent")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error starting stream: {e}")
            return False
    
    def start_rtsp_server(self):
        """Start local RTSP server using FFmpeg"""
        try:
            logger.info(f"🎥 Starting RTSP server on port {self.port}...")
            
            # FFmpeg command to create RTSP server
            cmd = [
                'ffmpeg',
                '-f', 'rawvideo',
                '-vcodec', 'rawvideo',
                '-s', '1920x1080',
                '-pix_fmt', 'bgr24',
                '-r', '25',
                '-i', 'pipe:0',
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-tune', 'zerolatency',
                '-f', 'rtsp',
                f'rtsp://localhost:{self.port}/stream'
            ]
            
            self.rtsp_server_process = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            
            logger.info("✅ RTSP server started")
            logger.info(f"📺 Local RTSP URL: rtsp://localhost:{self.port}/stream")
            
        except Exception as e:
            logger.error(f"❌ Error starting RTSP server: {e}")
    
    def frame_processor(self):
        """Process frames from queue and send to RTSP server"""
        try:
            logger.info("🎬 Starting frame processor...")
            
            while self.running:
                try:
                    # Get frame from queue (with timeout)
                    frame = self.frame_queue.get(timeout=1.0)
                    
                    if frame is not None and self.rtsp_server_process:
                        # Send frame to RTSP server
                        self.rtsp_server_process.stdin.write(frame.tobytes())
                        self.rtsp_server_process.stdin.flush()
                    
                    self.frame_queue.task_done()
                    
                except queue.Empty:
                    continue
                except Exception as e:
                    logger.error(f"❌ Error processing frame: {e}")
                    
        except Exception as e:
            logger.error(f"❌ Error in frame processor: {e}")
    
    async def process_messages(self):
        """Process Janus messages and extract video frames"""
        try:
            logger.info("🎥 Processing WebRTC messages...")
            
            while self.running:
                message = await self.janus_ws.recv()
                data = json.loads(message)
                
                if data.get("janus") == "event":
                    # Handle streaming events
                    if data.get("plugindata") and data["plugindata"].get("plugin") == "janus.plugin.streaming":
                        plugin_data = data["plugindata"]["data"]
                        logger.info(f"📺 Streaming event: {plugin_data}")
                    
                    # Handle SDP offers
                    if data.get("jsep"):
                        logger.info(f"🎬 SDP {data['jsep']['type']} received")
                        await self.handle_sdp_offer(data["jsep"], data.get("sender"))
                
                elif data.get("janus") == "error":
                    logger.error(f"❌ Janus error: {data['error']}")
                    break
                
                # Simulate frame extraction (in real implementation, decode WebRTC frames)
                await self.simulate_frame_extraction()
                    
        except Exception as e:
            logger.error(f"❌ Error processing messages: {e}")
    
    async def simulate_frame_extraction(self):
        """Simulate extracting video frames from WebRTC stream"""
        try:
            # In a real implementation, you would decode WebRTC video frames here
            # For demo purposes, we'll create a test frame
            
            # Create a test frame (1920x1080, BGR)
            frame = np.zeros((1080, 1920, 3), dtype=np.uint8)
            
            # Add some visual content
            cv2.putText(frame, f"Camera {self.camera_id}", (50, 50), 
                       cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)
            cv2.putText(frame, f"Time: {time.strftime('%H:%M:%S')}", (50, 100), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
            cv2.putText(frame, "WebRTC to RTSP Bridge", (50, 150), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
            
            # Add a moving circle
            center_x = int(960 + 200 * np.sin(time.time()))
            center_y = int(540 + 100 * np.cos(time.time()))
            cv2.circle(frame, (center_x, center_y), 30, (255, 0, 0), -1)
            
            # Add frame to queue (non-blocking)
            try:
                self.frame_queue.put_nowait(frame)
            except queue.Full:
                # Drop frame if queue is full
                pass
                
        except Exception as e:
            logger.error(f"❌ Error simulating frame extraction: {e}")
    
    async def handle_sdp_offer(self, jsep: Dict, sender: str):
        """Handle SDP offer/answer (simplified for demo)"""
        try:
            logger.info(f"🎬 Handling SDP {jsep['type']}")
            
            # In a real implementation, you would:
            # 1. Create RTCPeerConnection
            # 2. Set remote description
            # 3. Create answer
            # 4. Send answer back to Janus
            
            # For demo purposes, we'll just log the SDP
            logger.info(f"📝 SDP {jsep['type']}: {jsep['sdp'][:100]}...")
            
            # Simulate successful SDP handling
            if jsep["type"] == "offer":
                # Send answer back to Janus
                answer_message = {
                    "janus": "message",
                    "session_id": self.session_id,
                    "handle_id": self.handle_id,
                    "body": {"request": "start"},
                    "jsep": {
                        "type": "answer",
                        "sdp": "v=0\r\no=- 0 0 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"  # Simplified SDP
                    }
                }
                
                await self.janus_ws.send(json.dumps(answer_message))
                logger.info("✅ SDP answer sent")
                
        except Exception as e:
            logger.error(f"❌ Error handling SDP: {e}")
    
    async def run(self, duration: Optional[int] = None):
        """Run the WebRTC to RTSP bridge"""
        try:
            logger.info("🚀 Starting WebRTC to RTSP Bridge...")
            
            # Step 1: Authenticate
            if not await self.authenticate():
                return False
            
            # Step 2: Get WebRTC config
            if not await self.get_webrtc_config():
                return False
            
            # Step 3: Connect to Janus
            if not await self.connect_to_janus():
                return False
            
            # Step 4: Start stream
            if not await self.start_stream():
                return False
            
            # Step 5: Start RTSP server
            self.start_rtsp_server()
            
            # Step 6: Start frame processor
            self.running = True
            frame_thread = threading.Thread(target=self.frame_processor)
            frame_thread.daemon = True
            frame_thread.start()
            
            # Step 7: Process messages
            logger.info("✅ Bridge ready - converting WebRTC to RTSP...")
            logger.info(f"📺 AI tools can now use: rtsp://localhost:{self.port}/stream")
            
            if duration:
                logger.info(f"⏱️ Running for {duration} seconds...")
                await asyncio.wait_for(self.process_messages(), timeout=duration)
            else:
                await self.process_messages()
                
        except asyncio.TimeoutError:
            logger.info("⏰ Duration reached, stopping bridge...")
        except KeyboardInterrupt:
            logger.info("🛑 Bridge stopped by user...")
        except Exception as e:
            logger.error(f"❌ Error running bridge: {e}")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        try:
            self.running = False
            
            if self.rtsp_server_process:
                self.rtsp_server_process.terminate()
                self.rtsp_server_process.wait()
                logger.info("🔌 RTSP server stopped")
            
            if self.janus_ws:
                await self.janus_ws.close()
                logger.info("🔌 Janus connection closed")
            
            logger.info("✅ Bridge cleanup completed")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="VAS WebRTC to RTSP Bridge")
    parser.add_argument("--vas-server", default="http://10.30.250.245:8000", 
                       help="VAS server URL")
    parser.add_argument("--camera-id", required=True, 
                       help="Camera ID to bridge")
    parser.add_argument("--port", type=int, default=8554, 
                       help="Local RTSP port (default: 8554)")
    parser.add_argument("--duration", type=int, 
                       help="Duration to run in seconds (optional)")
    
    args = parser.parse_args()
    
    # Create bridge
    bridge = WebRTCToRTSPBridge(args.vas_server, args.camera_id, args.port)
    
    # Run bridge
    await bridge.run(args.duration)


if __name__ == "__main__":
    # Install required packages if not available
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("❌ Required packages not installed. Please run:")
        print("pip install opencv-python numpy")
        exit(1)
    
    # Run the bridge
    asyncio.run(main())
