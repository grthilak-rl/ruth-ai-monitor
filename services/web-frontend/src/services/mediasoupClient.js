import { Device } from 'mediasoup-client';

class MediaSoupClient {
  constructor() {
    this.device = null;
    this.socket = null;
    this.producerTransport = null;
    this.consumerTransport = null;
    this.consumer = null;
    this.wsUrl = null;
    this.roomId = null;
    this.callbacks = {
      onTrack: null,
      onError: null,
      onDisconnect: null,
    };
  }

  async connect(wsUrl, roomId) {
    try {
      this.wsUrl = wsUrl;
      this.roomId = roomId;

      this.device = new Device();

      this.socket = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        this.socket.onopen = () => {
          console.log('WebSocket connected to MediaSoup');

          this.socket.send(
            JSON.stringify({
              type: 'join',
              room_id: roomId,
            })
          );

          this.socket.onmessage = async (event) => {
            try {
              const message = JSON.parse(event.data);
              console.log('Received WebSocket message:', message);
              await this.handleMessage(message);
            } catch (error) {
              console.error('Error handling WebSocket message:', error);
              console.error('Raw message data:', event.data);
              if (this.callbacks.onError) {
                this.callbacks.onError(error);
              }
            }
          };

          resolve();
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          if (this.callbacks.onError) {
            this.callbacks.onError(error);
          }
          reject(error);
        };

        this.socket.onclose = () => {
          console.log('WebSocket disconnected');
          if (this.callbacks.onDisconnect) {
            this.callbacks.onDisconnect();
          }
        };
      });
    } catch (error) {
      console.error('Failed to connect to MediaSoup:', error);
      throw error;
    }
  }

  async handleMessage(message) {
    switch (message.type) {
      case 'routerRtpCapabilities':
        await this.loadDevice(message.data);
        await this.createRecvTransport();
        break;

      case 'transportCreated':
        await this.handleTransportCreated(message.data);
        break;

      case 'consumerCreated':
        await this.handleConsumerCreated(message.data);
        break;

      case 'producerAvailable':
        await this.consume(message.data.producerId);
        break;

      case 'error':
        console.error('MediaSoup server error:', message.error);
        if (this.callbacks.onError) {
          this.callbacks.onError(new Error(message.error));
        }
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async loadDevice(routerRtpCapabilities) {
    try {
      await this.device.load({ routerRtpCapabilities });
      console.log('MediaSoup device loaded');
    } catch (error) {
      console.error('Failed to load device:', error);
      throw error;
    }
  }

  async createRecvTransport() {
    try {
      this.socket.send(
        JSON.stringify({
          type: 'createWebRtcTransport',
          direction: 'recv',
        })
      );
    } catch (error) {
      console.error('Failed to create recv transport:', error);
      throw error;
    }
  }

  async handleTransportCreated(transportData) {
    try {
      this.consumerTransport = this.device.createRecvTransport({
        id: transportData.id,
        iceParameters: transportData.iceParameters,
        iceCandidates: transportData.iceCandidates,
        dtlsParameters: transportData.dtlsParameters,
      });

      this.consumerTransport.on('connect', ({ dtlsParameters }, callback, errback) => {
        try {
          this.socket.send(
            JSON.stringify({
              type: 'connectTransport',
              transportId: this.consumerTransport.id,
              dtlsParameters,
            })
          );
          callback();
        } catch (error) {
          errback(error);
        }
      });

      this.consumerTransport.on('connectionstatechange', (state) => {
        console.log('Consumer transport connection state:', state);
        if (state === 'failed' || state === 'closed') {
          if (this.callbacks.onError) {
            this.callbacks.onError(new Error(`Transport state: ${state}`));
          }
        }
      });

      console.log('Consumer transport created');

      this.socket.send(
        JSON.stringify({
          type: 'getProducers',
          room_id: this.roomId,
        })
      );
    } catch (error) {
      console.error('Failed to handle transport created:', error);
      throw error;
    }
  }

  async consume(producerId) {
    try {
      this.socket.send(
        JSON.stringify({
          type: 'consume',
          transportId: this.consumerTransport.id,
          producerId,
          rtpCapabilities: this.device.rtpCapabilities,
        })
      );
    } catch (error) {
      console.error('Failed to consume:', error);
      throw error;
    }
  }

  async handleConsumerCreated(consumerData) {
    try {
      this.consumer = await this.consumerTransport.consume({
        id: consumerData.id,
        producerId: consumerData.producerId,
        kind: consumerData.kind,
        rtpParameters: consumerData.rtpParameters,
      });

      const { track } = this.consumer;

      console.log('Consumer created, track received:', track);

      if (this.callbacks.onTrack) {
        this.callbacks.onTrack(track);
      }

      this.socket.send(
        JSON.stringify({
          type: 'resume',
          consumerId: this.consumer.id,
        })
      );
    } catch (error) {
      console.error('Failed to handle consumer created:', error);
      throw error;
    }
  }

  on(event, callback) {
    if (this.callbacks.hasOwnProperty(`on${event.charAt(0).toUpperCase()}${event.slice(1)}`)) {
      this.callbacks[`on${event.charAt(0).toUpperCase()}${event.slice(1)}`] = callback;
    }
  }

  async disconnect() {
    try {
      if (this.consumer) {
        this.consumer.close();
        this.consumer = null;
      }

      if (this.consumerTransport) {
        this.consumerTransport.close();
        this.consumerTransport = null;
      }

      if (this.socket) {
        this.socket.close();
        this.socket = null;
      }

      this.device = null;

      console.log('MediaSoup client disconnected');
    } catch (error) {
      console.error('Error disconnecting MediaSoup client:', error);
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

export default MediaSoupClient;
