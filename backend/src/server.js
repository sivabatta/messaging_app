require('dotenv').config();
const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startCleanupJob } = require('./jobs/cleanup');

const PORT = Number(process.env.PORT) || 5000;

(async () => {
  await connectDB();
  const server = http.createServer(app);
  initSocket(server);
  startCleanupJob();
  server.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
})().catch((err) => {
  console.error('[boot] fatal', err);
  process.exit(1);
});
