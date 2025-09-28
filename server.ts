import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { setupSocketHandlers } from './lib/socket-handlers';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Initialize Prisma
export const prisma = new PrismaClient();

// Validate environment variables
const ADMIN_PIN = process.env.ADMIN_PIN;
if (!ADMIN_PIN) {
  console.error('❌ ADMIN_PIN environment variable is required');
  process.exit(1);
}

console.log('✅ Environment variables validated');

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Setup Socket.IO handlers
  setupSocketHandlers(io);

  // Start server
  server.listen(port, () => {
    console.log(`🚀 Server ready at http://${hostname}:${port}`);
    console.log(`📱 Host Console: http://${hostname}:${port}/host`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Process terminated');
    });
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    server.close(() => {
      console.log('Process terminated');
    });
  });
});
