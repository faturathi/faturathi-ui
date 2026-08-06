import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';

const app = express();
const port = Number(process.env.PORT || 3000);
const backendUrl = (process.env.BACKEND_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

// Keep the browser on one origin while Django remains the sole API/data owner.
app.use('/api', express.raw({ type: '*/*', limit: '25mb' }), async (req, res) => {
  try {
    const target = `${backendUrl}${req.originalUrl}`;
    const headers = new Headers();
    for (const [name, value] of Object.entries(req.headers)) {
      if (value && !['host', 'content-length', 'connection', 'expect'].includes(name.toLowerCase())) {
        headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
    }

    const hasBody = !['GET', 'HEAD'].includes(req.method);
    const response = await fetch(target, {
      method: req.method,
      headers,
      body: hasBody && Buffer.isBuffer(req.body) ? req.body : undefined,
      redirect: 'manual',
    });

    response.headers.forEach((value, name) => {
      if (!['content-encoding', 'transfer-encoding', 'connection'].includes(name.toLowerCase())) {
        res.setHeader(name, value);
      }
    });
    res.status(response.status).send(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('Backend API proxy error:', error);
    res.status(502).json({
      detail: `Django API is unavailable at ${backendUrl}. Start backend/manage.py on port 8000.`,
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Faturathi UI running on http://localhost:${port}`);
    console.log(`Proxying /api requests to ${backendUrl}`);
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
