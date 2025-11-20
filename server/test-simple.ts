import express from 'express';
import { createServer } from 'http';

const app = express();

app.get('/health', (req, res) => {
  console.log('[GET /health] request received');
  res.json({ status: 'ok' });
});

const server = createServer(app);
const port = 3001;

console.log('[SERVER] About to call server.listen()');

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Server listening on 0.0.0.0:${port}`);
});

console.log('[SERVER] Called server.listen(), callback should fire when ready');

// Log any unhandled errors
server.on('error', (err) => {
  console.error('[SERVER ERROR]', err);
});

// Keep alive
setInterval(() => {
  process.stdout.write('.');
}, 5000);
