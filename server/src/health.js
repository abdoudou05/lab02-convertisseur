import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { CATEGORIES } from './units/definitions.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const startedAt = new Date().toISOString();

/**
 * Révision déployée : variable APP_REVISION, sinon fichier REVISION écrit
 * par le pipeline à la racine de la version, sinon « dev ».
 */
function readRevision() {
  if (process.env.APP_REVISION) return process.env.APP_REVISION;
  try {
    return readFileSync(path.resolve(here, '../../REVISION'), 'utf8').trim() || 'dev';
  } catch {
    return 'dev';
  }
}

const revision = readRevision();

/** Rapport de santé commun à /health et /api/health. */
export function healthReport() {
  return {
    status: 'ok',
    revision,
    startedAt,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    node: process.version,
    memoryMb: Math.round(process.memoryUsage().rss / 1048576),
    categories: CATEGORIES.length,
    units: CATEGORIES.reduce((total, category) => total + category.units.length, 0),
  };
}
