require("dotenv").config();
const fs = require("fs");
const https = require("https");
const http = require("http");
const WebSocket = require("ws");

const { IS_LIVE, WS_PORT, WSS_PORT, KEY_PATH, CERT_PATH } = process.env;

// Load SSL certificates for wss
const serverConfig = IS_LIVE === "1" ? {key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH)} : null;

// Create HTTP and HTTPS servers
const httpServer = http.createServer();
const httpsServer = IS_LIVE === "1" ? https.createServer(serverConfig) : null;

// Create WebSocket servers
const wss = IS_LIVE === "1" ? new WebSocket.Server({ server: httpsServer }) : null;
const wsServer = new WebSocket.Server({ server: httpServer });

// Channel storage
const channels = {}; // { "channel_name": Set(WebSocketClients) }

// Function to handle WebSocket connections
function setupWebSocketServer(wsServer) {
    wsServer.on("connection", (socket, req) => {
        console.log("New WebSocket connection");

        // User subscriptions
        socket.channels = new Set();

        socket.on("message", (message) => {
            try {
                const data = JSON.parse(message);

                if (data.type === "subscribe") {
                    const channel = data.channel;
                    if (!channels[channel]) {
                        channels[channel] = new Set();
                    }
                    channels[channel].add(socket);
                    socket.channels.add(channel);
                    console.log(`Client subscribed to ${channel}`);
                } 

                else if (data.type === "unsubscribe") {
                    const channel = data.channel;
                    if (channels[channel]) {
                        channels[channel].delete(socket);
                        socket.channels.delete(channel);
                        console.log(`Client unsubscribed from ${channel}`);
                    }
                } 

                else if (data.type === "publish") {
                    const channel = data.channel;
                    const msg = data.message;
                    if (channels[channel]) {
                        channels[channel].forEach(client => {
                            if (client.readyState === WebSocket.OPEN) {
                                client.send(JSON.stringify({ channel, message: msg }));
                            }
                        });
                        console.log(`Message sent to channel ${channel}: ${msg}`);
                    }
                }

            } catch (error) {
                console.error("Invalid message format", error);
            }
        });

        socket.on("close", () => {
            console.log("Client disconnected");
            // Remove user from all channels
            socket.channels.forEach(channel => channels[channel]?.delete(socket));
        });
    });
}

if (IS_LIVE === "1") {
  const HTTPS_PORT = 8091;
  setupWebSocketServer(wss);
  httpsServer.listen(HTTPS_PORT, () => console.log(`WebSocket Secure (wss) running on wss://localhost:${HTTPS_PORT}`));
} else {
  const HTTP_PORT = 8091;
  setupWebSocketServer(wsServer);
  httpServer.listen(HTTP_PORT, () => console.log(`WebSocket (ws) running on ws://localhost:${HTTP_PORT}`));
}