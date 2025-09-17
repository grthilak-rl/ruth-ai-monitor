#!/usr/bin/env python3
"""
VAS WebRTC Consumer for Real-Time AI Monitoring
Consumes WebRTC streams from VAS for real-time violation detection
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
from typing import Dict, Optional, Callable

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class VASWebRTCConsumer:
    """VAS WebRTC Consumer for real-time AI monitoring"""
    
    def __init__(self, vas_server: str, camera_id: str):
        """
        Initialize VAS WebRTC consumer
        
        Args:
            vas_server: VAS server URL (e.g., http://10.30.250.245:8000)
            camera_id: Camera ID to monitor
        """
        self.vas_server = vas_server.rstrip('/')
        self.camera_id = camera_id
        self.token = None
        self.janus_ws = None
        self.session_id = None
        self.handle_id = None
        self.webrtc_config = None
        self.frame_count = 0
        self.violation_count = 0
        self.start_time = time.time()
        
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
                logger.info("✅ WebRTC config retrieved", self.webrtc_config)
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
    
    async def process_messages(self, ai_callback: Optional[Callable] = None):
        """Process Janus messages and handle WebRTC streams"""
        try:
            logger.info("🎥 Processing WebRTC messages...")
            
            while True:
                message = await self.janus_ws.recv()
                data = json.loads(message)
                
                if data.get("janus") == "event":
                    # Handle streaming events
                    if data.get("plugindata") and data["plugindata"].get("plugin") == "janus.plugin.streaming":
                        plugin_data = data["plugindata"]["data"]
                        logger.info(f"📺 Streaming event: {plugin_data}")
                        
                        if plugin_data.get("streaming") == "event" and plugin_data.get("result"):
                            result = plugin_data["result"]
                            logger.info(f"📊 Stream result: {result}")
                    
                    # Handle SDP offers
                    if data.get("jsep"):
                        logger.info(f"🎬 SDP {data['jsep']['type']} received")
                        await self.handle_sdp_offer(data["jsep"], data.get("sender"))
                
                elif data.get("janus") == "error":
                    logger.error(f"❌ Janus error: {data['error']}")
                    break
                
                # Simulate AI processing
                if ai_callback:
                    await ai_callback(data)
                    
        except Exception as e:
            logger.error(f"❌ Error processing messages: {e}")
    
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
    
    async def simulate_ai_processing(self, message_data: Dict):
        """Simulate AI processing for violation detection"""
        try:
            # Simulate frame processing
            self.frame_count += 1
            
            # Simulate violation detection (10% chance)
            if np.random.random() < 0.1:
                self.violation_count += 1
                violation_types = ['ppe_missing', 'fall_risk', 'unauthorized_access']
                violation_type = np.random.choice(violation_types)
                confidence = np.random.randint(70, 100)
                
                logger.warning(f"🚨 VIOLATION DETECTED: {violation_type} (confidence: {confidence}%)")
                
                # Trigger alarm
                await self.trigger_alarm(violation_type, confidence)
            
            # Log performance metrics every 30 frames
            if self.frame_count % 30 == 0:
                elapsed_time = time.time() - self.start_time
                fps = self.frame_count / elapsed_time if elapsed_time > 0 else 0
                logger.info(f"📊 Performance: {fps:.1f} FPS, {self.violation_count} violations")
                
        except Exception as e:
            logger.error(f"❌ Error in AI processing: {e}")
    
    async def trigger_alarm(self, violation_type: str, confidence: int):
        """Trigger alarm for violation detection"""
        try:
            alarm_data = {
                "camera_id": self.camera_id,
                "violation_type": violation_type,
                "confidence": confidence,
                "timestamp": time.time(),
                "frame_number": self.frame_count
            }
            
            logger.warning(f"🚨 ALARM TRIGGERED: {alarm_data}")
            
            # In a real implementation, you would:
            # 1. Send alarm to notification service
            # 2. Log to database
            # 3. Trigger visual/audio alerts
            # 4. Send to external systems
            
        except Exception as e:
            logger.error(f"❌ Error triggering alarm: {e}")
    
    async def run(self, duration: Optional[int] = None):
        """Run the WebRTC consumer"""
        try:
            logger.info("🚀 Starting VAS WebRTC Consumer...")
            
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
            
            # Step 5: Process messages
            logger.info("✅ WebRTC consumer ready - processing streams...")
            
            if duration:
                logger.info(f"⏱️ Running for {duration} seconds...")
                await asyncio.wait_for(
                    self.process_messages(self.simulate_ai_processing),
                    timeout=duration
                )
            else:
                await self.process_messages(self.simulate_ai_processing)
                
        except asyncio.TimeoutError:
            logger.info("⏰ Duration reached, stopping consumer...")
        except KeyboardInterrupt:
            logger.info("🛑 Consumer stopped by user...")
        except Exception as e:
            logger.error(f"❌ Error running consumer: {e}")
        finally:
            await self.cleanup()
    
    async def cleanup(self):
        """Clean up resources"""
        try:
            if self.janus_ws:
                await self.janus_ws.close()
                logger.info("🔌 Janus connection closed")
            
            # Log final statistics
            elapsed_time = time.time() - self.start_time
            fps = self.frame_count / elapsed_time if elapsed_time > 0 else 0
            logger.info(f"📊 Final stats: {self.frame_count} frames, {fps:.1f} FPS, {self.violation_count} violations")
            
        except Exception as e:
            logger.error(f"❌ Error during cleanup: {e}")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="VAS WebRTC Consumer for Real-Time AI Monitoring")
    parser.add_argument("--vas-server", default="http://10.30.250.245:8000", 
                       help="VAS server URL")
    parser.add_argument("--camera-id", required=True, 
                       help="Camera ID to monitor")
    parser.add_argument("--duration", type=int, 
                       help="Duration to run in seconds (optional)")
    
    args = parser.parse_args()
    
    # Create consumer
    consumer = VASWebRTCConsumer(args.vas_server, args.camera_id)
    
    # Run consumer
    await consumer.run(args.duration)


if __name__ == "__main__":
    # Install required packages if not available
    try:
        import cv2
        import numpy as np
    except ImportError:
        print("❌ Required packages not installed. Please run:")
        print("pip install opencv-python numpy")
        exit(1)
    
    # Run the consumer
    asyncio.run(main())
