import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';

import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
/** Bundle du client, présent seulement après `npm run build`. */
const CLIENT_DIST = path.resolve(here, '../../client/dist');

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '16kb' }));

  app.use('/api', apiRoutes);

  // En développement, le client est servi par Vite sur un autre port et
  // atteint l'API via un proxy. En production, `npm run build` produit
  // client/dist et un seul port suffit pour toute l'application.
  if (existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
      res.sendFile(path.join(CLIENT_DIST, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
