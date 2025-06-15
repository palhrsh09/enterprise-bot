const WebSocket = require('ws');

module.exports = (server) => {
  console.log('WebSocket server initializing...');

  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    console.log(`Client connected from ${ip}`);

    ws.on('message', (message) => {
      console.log('Received message:', message);

      try {
        const data = JSON.parse(message);

        if (data.type === 'appointment:update') {
          console.log('Broadcasting appointment:update:', data.payload);
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'appointment:update', payload: data.payload }));
            }
          });
        }
      } catch (err) {
        console.error('Failed to parse message:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`Client disconnected from ${ip}`);
    });
  });

  wss.on('error', (err) => {
    console.log("error in websocket",err)
    console.error('WebSocket server error:', err.message);
  });

  console.log('WebSocket server ready');
};
