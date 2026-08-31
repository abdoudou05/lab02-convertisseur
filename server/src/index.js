import { createApp } from './app.js';
import { CATEGORIES } from './units/definitions.js';

const PORT = Number(process.env.PORT ?? 4000);
const HOST = process.env.HOST ?? '127.0.0.1';

const app = createApp();

const server = app.listen(PORT, HOST, () => {
  const unitCount = CATEGORIES.reduce((total, category) => total + category.units.length, 0);
  console.log(`\n  Convertisseur, API`);
  console.log(`  http://${HOST}:${PORT}/api`);
  console.log(`  ${CATEGORIES.length} catégories, ${unitCount} unités\n`);
});

const shutdown = (signal) => {
  console.log(`\n  ${signal} reçu, arrêt du serveur.`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
