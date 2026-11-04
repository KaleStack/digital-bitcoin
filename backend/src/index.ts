import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabaseConnection } from './db/index.js';
import authRoutes from './routes/authRoutes.js';
import postRoutes from './routes/postRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { getPublicTags } from './controllers/postController.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;
const rawFrontendUrls = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : [];
const defaultOrigins = [
  'https://digitalbit.co.in',
  'https://www.digitalbit.co.in',
  'http://digitalbit.co.in',
  'http://www.digitalbit.co.in',
  'https://crypto-17b.pages.dev',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];
const allowedOrigins = Array.from(new Set([...rawFrontendUrls, ...defaultOrigins]));

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow non-browser tools, curl, mobile apps, or same-origin requests
    if (!origin) return callback(null, true);

    const isAllowed =
      allowedOrigins.includes(origin) ||
      origin.endsWith('.pages.dev') ||
      origin.endsWith('digitalbit.co.in') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      process.env.NODE_ENV !== 'production';

    if (isAllowed) {
      return callback(null, true);
    }

    console.warn(`[CORS Blocked]: Origin "${origin}" is not in allowed list.`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static uploads serving
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({
    status: 'ok',
    database: 'postgresql',
    engine: 'PostgreSQL Database',
    timestamp: new Date().toISOString()
  });
});

// Live Network Stats (Bitcoin Block Height & Ethereum Consensus Epoch)
let cachedBtcHeight = 974541;
let lastBtcFetch = 0;

app.get('/api/network/stats', async (_req: express.Request, res: express.Response) => {
  const now = Math.floor(Date.now() / 1000);
  
  // Calculate exact Ethereum Beacon Chain Epoch (Genesis: Dec 1, 2020 12:00:23 UTC = 1606824023, 384s/epoch)
  const ethGenesis = 1606824023;
  const ethEpoch = Math.max(0, Math.floor((now - ethGenesis) / 384));

  // Refresh BTC block height every 60s
  if (Date.now() - lastBtcFetch > 60 * 1000) {
    try {
      const btcRes = await fetch('https://mempool.space/api/blocks/tip/height', { signal: AbortSignal.timeout(3000) });
      if (btcRes.ok) {
        const text = await btcRes.text();
        const height = parseInt(text.trim(), 10);
        if (!isNaN(height) && height > 900000) {
          cachedBtcHeight = height;
          lastBtcFetch = Date.now();
        }
      }
    } catch {}
  }

  res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=30');
  res.json({
    success: true,
    data: {
      btc: {
        blockHeight: cachedBtcHeight,
        status: 'Sync'
      },
      eth: {
        epoch: ethEpoch,
        epochFormatted: `PoS Epoch ${(ethEpoch / 1000).toFixed(0)}k`,
        status: 'Finalized'
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.get('/api/tags', getPublicTags);
app.use('/api/categories', categoryRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler
app.use(errorHandler);

// Render Free-Tier Keep-Alive service to prevent cold-start spin down
function setupKeepAlive() {
  const targetUrl =
    process.env.RENDER_EXTERNAL_URL ||
    process.env.KEEP_ALIVE_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://digital-bitcoin.onrender.com' : null);

  if (!targetUrl) return;

  const PING_INTERVAL_MS = 13 * 60 * 1000; // 13 minutes (Render sleeps after 15 minutes)
  console.log(`[Keep-Alive] Initialized self-ping service targeting ${targetUrl}/api/health every 13 minutes`);

  setInterval(async () => {
    try {
      const pingUrl = `${targetUrl.replace(/\/$/, '')}/api/health`;
      const res = await fetch(pingUrl);
      if (res.ok) {
        console.log(`[Keep-Alive] Self-ping successful at ${new Date().toISOString()}`);
      }
    } catch (err: any) {
      console.warn(`[Keep-Alive] Self-ping warning:`, err?.message || err);
    }
  }, PING_INTERVAL_MS);
}

// Start Server
async function startServer() {
  await initDatabaseConnection();

  app.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Crypto Education API Server running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🗄️ Database mode: PostgreSQL`);
    console.log(`=================================================\n`);

    setupKeepAlive();
  });
}

startServer();
