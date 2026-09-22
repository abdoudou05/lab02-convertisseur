/**
 * Journalisation des requêtes, une ligne par requête terminée.
 *
 * Format pensé pour journalctl : horodatage ISO, méthode, chemin, statut,
 * durée et adresse du client. Les sondes /health réussies ne sont pas
 * journalisées pour ne pas noyer les journaux (une sonde par minute).
 * Désactivée sous node --test (NODE_TEST_CONTEXT) ou avec LOG_REQUESTS=0.
 */
export function requestLogger(req, res, next) {
  if (process.env.LOG_REQUESTS === '0' || process.env.NODE_TEST_CONTEXT) return next();

  const started = process.hrtime.bigint();
  res.on('finish', () => {
    const isProbe = req.path === '/health' || req.path === '/api/health';
    if (isProbe && res.statusCode < 400) return;

    const ms = Number(process.hrtime.bigint() - started) / 1e6;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(
      `${new Date().toISOString()} ${level} ${req.method} ${req.originalUrl} ` +
        `${res.statusCode} ${ms.toFixed(1)}ms ip=${req.ip}`,
    );
  });
  next();
}
