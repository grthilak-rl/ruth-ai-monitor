import { Device } from 'mediasoup-client';

/**
 * VAS V2 MediaSoup Client - WebSocket-based Implementation
 * Uses proper MediaSoup SFU architecture with WebSocket signaling
 * Based on VAS_V2_CLARIFICATION.md
 */
class VASV2MediaSoupClient {
  constructor() {
    this.device = null;
    this.socket = null;
    this.recvTransport = null;
    this.consumer = null;
    this.roomId = null;
    this.producerId = null;
    this.pendingRequests = new Map(); // Maps request type to {resolve, reject}
    this.requestId = 0;
  }

  /**
   * Send a request via WebSocket and wait for response
   * VAS v2 responds with messages that match by type, not by id
   */
  async sendRequest(requestType, payload = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.requestId;

      // Map expected response type to resolve/reject functions
      const responseTypeMap = {
        'getRouterRtpCapabilities': 'routerRtpCapabilities',
        'createWebRtcTransport': 'webRtcTransportCreated',
        'connectWebRtcTransport': 'webRtcTransportConnected',
        'consume': 'consumerCreated',
        'resume': 'consumerResumed'
      };

      const expectedResponseType = responseTypeMap[requestType] || requestType;
      this.pendingRequests.set(expectedResponseType, { resolve, reject });

      // VAS v2 expects: {id, type, payload: {...}}
      this.socket.send(JSON.stringify({
        id,
        type: requestType,
        payload
      }));

      console.log(`Sent WebSocket request: ${requestType}, expecting response: ${expectedResponseType}`);

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(expectedResponseType)) {
          this.pendingRequests.delete(expectedResponseType);
          reject(new Error(`Request ${requestType} timed out`));
        }
      }, 30000);
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('Received WebSocket message:', message);

      // Handle error messages
      if (message.type === 'error') {
        console.error('MediaSoup server error:', message.error);
        // Reject all pending requests
        this.pendingRequests.forEach(({ reject }) => {
          reject(new Error(message.error));
        });
        this.pendingRequests.clear();
        return;
      }

      // Handle response to a pending request (match by response type)
      if (message.type && this.pendingRequests.has(message.type)) {
        const { resolve } = this.pendingRequests.get(message.type);
        this.pendingRequests.delete(message.type);
        resolve(message);
        return;
      }

      // Unhandled message
      console.log('Unhandled message type:', message.type);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Connect to VAS v2 MediaSoup via WebSocket
   */
  async connect(websocketUrl, streamData) {
    try {
      this.roomId = streamData.room_id;
      this.producerId = streamData.producers?.video;

      console.log('Connecting to VAS V2 MediaSoup via WebSocket...');
      console.log('WebSocket URL:', websocketUrl);
      console.log('Room ID:', this.roomId);
      console.log('Producer ID:', this.producerId);

      if (!this.producerId) {
        throw new Error('No video producer found in stream data');
      }

      // ═══════════════════════════════════════════════════════════════
      // STEP 1: Connect to WebSocket
      // ═══════════════════════════════════════════════════════════════
      this.socket = new WebSocket(websocketUrl);

      await new Promise((resolve, reject) => {
        this.socket.onopen = () => {
          console.log('WebSocket connected to MediaSoup');
          resolve();
        };
        this.socket.onerror = (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        };
        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
        };
      });

      // Set up message handler
      this.socket.onmessage = this.handleMessage.bind(this);

      // ═══════════════════════════════════════════════════════════════
      // STEP 2: Get router RTP capabilities
      // ═══════════════════════════════════════════════════════════════
      console.log('Requesting router RTP capabilities...');
      const capabilitiesResponse = await this.sendRequest('getRouterRtpCapabilities', {
        roomId: this.roomId
      });

      const routerRtpCapabilities = capabilitiesResponse.rtpCapabilities ||
                                     capabilitiesResponse.routerRtpCapabilities ||
                                     capabilitiesResponse.capabilities ||
                                     capabilitiesResponse.data;

      if (!routerRtpCapabilities) {
        throw new Error('Router RTP capabilities not found in response');
      }

      console.log('Router RTP capabilities received');

      // ═══════════════════════════════════════════════════════════════
      // STEP 3: Load device with router RTP capabilities
      // ═══════════════════════════════════════════════════════════════
      this.device = new Device();
      await this.device.load({ routerRtpCapabilities });
      console.log('MediaSoup device loaded');

      // ═══════════════════════════════════════════════════════════════
      // STEP 4: Create WebRTC recv transport (THIS provides DTLS/ICE!)
      // ═══════════════════════════════════════════════════════════════
      console.log('Creating WebRTC recv transport...');
      const transportResponse = await this.sendRequest('createWebRtcTransport', {
        roomId: this.roomId,
        direction: 'recv'
      });

      const transportInfo = transportResponse.transportInfo ||
                             transportResponse.transport ||
                             transportResponse.data;

      if (!transportInfo) {
        throw new Error('Transport info not found in response');
      }

      console.log('WebRTC transport created:', transportInfo);
      console.log('DTLS fingerprints:', transportInfo.dtlsParameters?.fingerprints);
      console.log('ICE candidates:', transportInfo.iceCandidates);

      // ═══════════════════════════════════════════════════════════════
      // STEP 5: Create local recv transport
      // ═══════════════════════════════════════════════════════════════
      this.recvTransport = this.device.createRecvTransport({
        id: transportInfo.id,
        iceParameters: transportInfo.iceParameters,
        iceCandidates: transportInfo.iceCandidates,
        dtlsParameters: transportInfo.dtlsParameters
      });

      console.log('Local recv transport created');

      // ═══════════════════════════════════════════════════════════════
      // STEP 6: Handle transport connect event
      // ═══════════════════════════════════════════════════════════════
      this.recvTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
        try {
          console.log('Connecting WebRTC transport...');
          await this.sendRequest('connectWebRtcTransport', {
            transportId: this.recvTransport.id,
            dtlsParameters
          });
          console.log('WebRTC transport connected');
          callback();
        } catch (error) {
          console.error('Error connecting transport:', error);
          errback(error);
        }
      });

      // ═══════════════════════════════════════════════════════════════
      // STEP 7: Create consumer to receive video
      // ═══════════════════════════════════════════════════════════════
      console.log('Creating consumer for producer:', this.producerId);
      const consumerResponse = await this.sendRequest('consume', {
        transportId: this.recvTransport.id,
        producerId: this.producerId,
        rtpCapabilities: this.device.rtpCapabilities
      });

      const consumerInfo = consumerResponse.consumerInfo ||
                            consumerResponse.consumer ||
                            consumerResponse.data;

      if (!consumerInfo) {
        throw new Error('Consumer info not found in response');
      }

      console.log('Consumer info received:', consumerInfo);

      // ═══════════════════════════════════════════════════════════════
      // STEP 8: Consume the track
      // ═══════════════════════════════════════════════════════════════
      this.consumer = await this.recvTransport.consume({
        id: consumerInfo.id,
        producerId: consumerInfo.producerId,
        kind: consumerInfo.kind,
        rtpParameters: consumerInfo.rtpParameters
      });

      console.log('Consumer created, track received:', this.consumer.track);

      // ═══════════════════════════════════════════════════════════════
      // STEP 9: Resume consumer (if paused)
      // ═══════════════════════════════════════════════════════════════
      if (this.consumer.paused) {
        console.log('Resuming consumer...');
        await this.sendRequest('resume', {
          consumerId: this.consumer.id
        });
      }

      return this.consumer.track;

    } catch (error) {
      console.error('Failed to connect VAS V2 MediaSoup:', error);
      this.disconnect();
      throw error;
    }
  }

  /**
   * Disconnect and clean up
   */
  disconnect() {
    try {
      if (this.consumer) {
        this.consumer.close();
        this.consumer = null;
      }

      if (this.recvTransport) {
        this.recvTransport.close();
        this.recvTransport = null;
      }

      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;

      this.device = null;
      this.pendingRequests.clear();

      console.log('VAS V2 MediaSoup client disconnected');
    } catch (error) {
      console.error('Error disconnecting VAS V2 MediaSoup client:', error);
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.consumer &&
           !this.consumer.closed &&
           this.recvTransport &&
           this.recvTransport.connectionState === 'connected' &&
           this.socket &&
           this.socket.readyState === WebSocket.OPEN;
  }
}

export default VASV2MediaSoupClient;
