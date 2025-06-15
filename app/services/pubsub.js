const WebSocket = require('ws');

class PubSubClient {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectInterval: options.reconnectInterval || 3000,
      autoReconnect: options.autoReconnect !== false,
    };

    this.ws = null;
    this.isConnected = false;
    this.subscriptions = new Map(); 
    this.messageQueue = [];
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log('[PubSubClient] Connected to WebSocket server');
        this._flushQueue();

        for (const channel of this.subscriptions.keys()) {
          this._send({ type: 'subscribe', channel });
        }

        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const { channel, message } = JSON.parse(data);
          const callbacks = this.subscriptions.get(channel) || [];
          for (const cb of callbacks) cb(message);
        } catch (err) {
          console.error('[PubSubClient] Invalid message format', err);
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        console.warn('[PubSubClient] Connection closed');
        if (this.options.autoReconnect) {
          setTimeout(() => this.connect(), this.options.reconnectInterval);
        }
      });

      this.ws.on('error', (err) => {
        console.error('[PubSubClient] Connection error:', err.message);
        reject(err);
      });
    });
  }

  _send(data) {
    const payload = JSON.stringify(data);
    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.messageQueue.push(payload);
    }
  }

  _flushQueue() {
    while (this.messageQueue.length > 0) {
      this.ws.send(this.messageQueue.shift());
    }
  }

  subscribe(channel, callback) {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
      this._send({ type: 'subscribe', channel });
    }
    this.subscriptions.get(channel).push(callback);
  }

  unsubscribe(channel) {
    if (this.subscriptions.has(channel)) {
      this._send({ type: 'unsubscribe', channel });
      this.subscriptions.delete(channel);
    }
  }

  publish(channel, message) {
    this._send({ type: 'publish', channel, message });
  }

  disconnect() {
    this.options.autoReconnect = false;
    this.ws?.close();
  }
}

module.exports = PubSubClient;
