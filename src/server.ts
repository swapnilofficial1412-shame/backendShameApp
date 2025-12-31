import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import promisesRouter from './routes/promises';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for accurate IP detection (important for rate limiting behind reverse proxies)
// Set to true if behind a reverse proxy (e.g., nginx, load balancer)
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? true : 1);

// CORS configuration - allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes
app.use('/api/promises', promisesRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

