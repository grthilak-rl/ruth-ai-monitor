// Minimal Janus Mock for Testing VAS Streaming
console.log('🎭 Janus Mock Library Loaded');

// Janus Constructor Function
function Janus(options) {
    console.log('🎭 Janus constructor called');
    
    // Store the session reference
    this.session = null;
    
    // Add attach method to the Janus instance
    this.attach = (options) => {
        console.log('🎭 Mock janus.attach() called');
        
        // If session is not ready yet, wait for it
        if (!this.session) {
            console.log('🎭 Session not ready, waiting...');
            setTimeout(() => this.attach(options), 100);
            return;
        }
        
        // Call the session's attach method
        this.session.attach(options);
    };
    
    // Simulate successful session creation
    setTimeout(() => {
        if (options && options.success) {
            this.session = {
                id: Math.random().toString(36).substr(2, 9),
                attach: (options) => {
                    console.log('🎭 Mock session.attach() called');
                    
                    // Simulate successful plugin attachment
                    setTimeout(() => {
                        if (options.success) {
                            options.success({
                                id: Math.random().toString(36).substr(2, 9),
                                send: function(message) {
                                    console.log('🎭 Mock plugin.send() called:', message);
                                    // Simulate successful message sending
                                    if (message.success) {
                                        setTimeout(() => {
                                            message.success({ result: 'success' });
                                        }, 100);
                                    }
                                },
                                createAnswer: function(options) {
                                    console.log('🎭 Mock plugin.createAnswer() called');
                                    // Simulate SDP answer creation
                                    setTimeout(() => {
                                        if (options.success) {
                                            options.success({
                                                type: 'answer',
                                                sdp: 'mock-sdp-answer'
                                            });
                                        }
                                    }, 100);
                                },
                                detach: function() {
                                    console.log('🎭 Mock plugin.detach() called');
                                },
                                webrtcStuff: {
                                    pc: {
                                        ontrack: null,
                                        addEventListener: function(event, handler) {
                                            console.log('🎭 Mock PC event listener added:', event);
                                            if (event === 'track') {
                                                this.ontrack = handler;
                                                
                                                // Simulate video track after a delay
                                                setTimeout(() => {
                                                    console.log('🎭 Simulating video track...');
                                                    
                                                    // Create a canvas-based video stream
                                                    const canvas = document.createElement('canvas');
                                                    canvas.width = 640;
                                                    canvas.height = 480;
                                                    const ctx = canvas.getContext('2d');
                                                    
                                                    // Draw a simple test pattern
                                                    ctx.fillStyle = '#2D3748';
                                                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                    ctx.fillStyle = '#4A5568';
                                                    ctx.fillRect(20, 20, canvas.width - 40, canvas.height - 40);
                                                    ctx.fillStyle = '#68D391';
                                                    ctx.font = '24px Arial';
                                                    ctx.textAlign = 'center';
                                                    ctx.fillText('MOCK VIDEO STREAM', canvas.width / 2, canvas.height / 2 - 20);
                                                    ctx.fillText('Camera 1 - Office', canvas.width / 2, canvas.height / 2 + 20);
                                                    ctx.fillText('🎭 Janus Mock Active', canvas.width / 2, canvas.height / 2 + 50);
                                                    
                                                    // Create a real MediaStream from canvas
                                                    const realStream = canvas.captureStream(30); // 30 FPS
                                                    const videoTrack = realStream.getVideoTracks()[0];
                                                    
                                                    const mockTrack = {
                                                        kind: 'video',
                                                        id: 'mock-video-track',
                                                        enabled: true,
                                                        muted: false
                                                    };
                                                    
                                                    const mockStream = {
                                                        id: 'mock-stream',
                                                        getTracks: () => [mockTrack],
                                                        getVideoTracks: () => [mockTrack],
                                                        getAudioTracks: () => []
                                                    };
                                                    
                                                    const mockEvent = {
                                                        track: mockTrack,
                                                        streams: [mockStream]
                                                    };
                                                    
                                                    console.log('🎭 Calling ontrack handler with mock data');
                                                    if (handler) {
                                                        handler(mockEvent);
                                                    }
                                                    
                                                    // Also directly set the video element for testing
                                                    setTimeout(() => {
                                                        const videoElement = document.getElementById('video');
                                                        if (videoElement) {
                                                            console.log('🎭 Setting video element srcObject with mock stream');
                                                            videoElement.srcObject = realStream;
                                                            console.log('🎭 Mock video stream set successfully');
                                                            
                                                            // Try to play the video
                                                            videoElement.play().then(() => {
                                                                console.log('🎭 Mock video playing successfully!');
                                                            }).catch((error) => {
                                                                console.log('🎭 Mock video play failed:', error.message);
                                                            });
                                                        } else {
                                                            console.log('🎭 Video element not found!');
                                                        }
                                                    }, 100);
                                                }, 500);
                                            }
                                        }
                                    }
                                }
                            });
                        }
                    }, 200);
                },
                destroy: function() {
                    console.log('🎭 Mock session.destroy() called');
                }
            };
            
            // Call the success callback with the session
            options.success(this.session);
        }
    }, 100);
}

// Add static methods to the constructor
Janus.init = function(options) {
    console.log('🎭 Janus.init() called');
    if (options && options.callback) {
        // Simulate successful initialization
        setTimeout(() => {
            options.callback();
        }, 100);
    }
    return true;
};

Janus.isWebRTCSupported = function() {
    console.log('🎭 Janus.isWebRTCSupported() called - returning true');
    return true;
};

Janus.debug = function(level, message) {
    console.log(`🎭 Janus Debug [${level}]:`, message);
};

// Make Janus available globally
window.Janus = Janus;

// Add a test function to directly test video display
window.testVideoDisplay = function() {
    console.log('🎭 Testing video display...');
    const videoElement = document.getElementById('video');
    if (videoElement) {
        console.log('🎭 Video element found:', videoElement);
        
        // Create a simple test stream
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        
        // Draw test pattern
        ctx.fillStyle = '#FF0000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('TEST VIDEO', canvas.width / 2, canvas.height / 2);
        
        const stream = canvas.captureStream(30);
        videoElement.srcObject = stream;
        
        videoElement.play().then(() => {
            console.log('🎭 Test video playing!');
        }).catch((error) => {
            console.log('🎭 Test video failed:', error);
        });
    } else {
        console.log('🎭 Video element not found!');
    }
};

console.log('🎭 Janus Mock Library Ready');
console.log('🎭 Call testVideoDisplay() to test video display directly');
