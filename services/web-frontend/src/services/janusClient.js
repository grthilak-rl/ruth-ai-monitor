// Janus WebRTC Client Service for Ruth-AI (adapted from VAS)
// Handles connection to Janus Gateway service for live video streaming

import config from '../config/environment';

export class JanusClient {
  constructor(onStatusChange) {
    this.janus = null;
    this.handle = null;
    this.remoteVideo = null;
    this.isConnected = false;
    this.onStatusChange = onStatusChange;
  }

  // Initialize Janus and connect to server
  async initialize() {
    return new Promise((resolve, reject) => {
      if (!window.Janus) {
        reject(new Error('Janus library not loaded'));
        return;
      }

      if (this.onStatusChange) this.onStatusChange('connecting');

      window.Janus.init({
        debug: true,
        callback: () => {
          this.janus = new window.Janus({
            server: config.JANUS_WS_URL,
            success: () => {
              console.log('Janus connected successfully');
              this.isConnected = true;
              if (this.onStatusChange) this.onStatusChange('connected');
              resolve(true);
            },
            error: (error) => {
              console.error('Janus connection error:', error);
              if (this.onStatusChange) this.onStatusChange('error');
              reject(new Error(`Janus connection failed: ${error}`));
            },
            destroyed: () => {
              console.log('Janus connection destroyed');
              this.isConnected = false;
              if (this.onStatusChange) this.onStatusChange('disconnected');
            }
          });
        }
      });
    });
  }

  // Start streaming from a specific camera/mountpoint
  async startStream(streamId, videoElement) {
    if (!this.isConnected || !this.janus) {
      throw new Error('Janus not connected. Call initialize() first.');
    }

    this.remoteVideo = videoElement;

    return new Promise((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.streaming",
        success: (pluginHandle) => {
          console.log('Attached to streaming plugin');
          this.handle = pluginHandle;
          
          // Watch the specific stream
          const body = { request: "watch", id: streamId };
          this.handle.send({ 
            message: body,
            success: (result) => {
              console.log('Watch request successful:', result);
              if (result?.status === 'preparing') {
                console.log('Stream is preparing...');
              }
            },
            error: (error) => {
              console.error('Watch request failed:', error);
              reject(new Error(`Failed to watch stream: ${error}`));
            }
          });
        },
        error: (error) => {
          console.error('Failed to attach to streaming plugin:', error);
          reject(new Error(`Plugin attach failed: ${error}`));
        },
        onmessage: (msg, jsep) => {
          console.log('Received message:', msg);
          
          if (jsep) {
            console.log('Handling SDP:', jsep);
            this.handle.createAnswer({
              jsep: jsep,
              media: { audioSend: false, videoSend: false },
              success: (jsep) => {
                console.log('Created answer:', jsep);
                const body = { request: "start" };
                this.handle.send({ message: body, jsep: jsep });
              },
              error: (error) => {
                console.error('Create answer error:', error);
                reject(new Error(`Failed to create answer: ${error}`));
              }
            });
          }
        },
        onremotetrack: (track, mid, added) => {
          console.log('Remote track event:', { track, mid, added });
          
          if (added && track.kind === 'video' && this.remoteVideo) {
            console.log('Adding video track to element');
            const stream = new MediaStream([track]);
            this.remoteVideo.srcObject = stream;
            this.remoteVideo.play().then(() => {
              console.log('Video started playing');
              resolve();
            }).catch((error) => {
              console.error('Video play error:', error);
              reject(new Error(`Video play failed: ${error}`));
            });
          }
        },
        oncleanup: () => {
          console.log('Cleanup called');
          if (this.remoteVideo) {
            this.remoteVideo.srcObject = null;
          }
        }
      });
    });
  }

  // Stop current stream
  stopStream() {
    if (this.handle) {
      console.log('Stopping stream');
      this.handle.send({ message: { request: "stop" } });
      this.handle.detach();
      this.handle = null;
    }
    
    if (this.remoteVideo) {
      this.remoteVideo.srcObject = null;
    }
  }

  // Cleanup and disconnect
  destroy() {
    this.stopStream();
    
    if (this.janus) {
      this.janus.destroy();
      this.janus = null;
      this.isConnected = false;
    }
  }

  // Get list of available streams from Janus
  async getAvailableStreams() {
    if (!this.isConnected || !this.janus) {
      throw new Error('Janus not connected');
    }

    return new Promise((resolve, reject) => {
      this.janus.attach({
        plugin: "janus.plugin.streaming",
        success: (pluginHandle) => {
          pluginHandle.send({
            message: { request: "list" },
            success: (result) => {
              console.log('Available streams:', result);
              const streams = result.list?.map((stream) => ({
                streamId: stream.id,
                description: stream.description || `Stream ${stream.id}`,
                status: stream.enabled ? 'active' : 'inactive'
              })) || [];
              
              pluginHandle.detach();
              resolve(streams);
            },
            error: (error) => {
              console.error('List request failed:', error);
              pluginHandle.detach();
              reject(new Error(`Failed to list streams: ${error}`));
            }
          });
        },
        error: (error) => {
          console.error('Failed to attach for listing:', error);
          reject(new Error(`Plugin attach failed: ${error}`));
        }
      });
    });
  }

  get connected() {
    return this.isConnected;
  }
}
