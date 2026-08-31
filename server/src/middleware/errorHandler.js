import { ConversionError } from '../units/convert.js';
import { errorMessage } from '../messages.js';
import { normalizeLanguage } from '../units/catalogue.js';

/** Route inconnue → 404 JSON cohérent avec le reste de l'API. */
export function notFound(req, res) {
  const lang = normalizeLanguage(req.query?.lang ?? req.get('accept-language') ?? '');
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: errorMessage('NOT_FOUND', {}, lang) },
  });
}

/**
 * Gestionnaire d'erreurs unique. Les erreurs métier (ConversionError) sont
 * traduites ; tout le reste devient un 500 générique, sans fuite de pile.
 */
// eslint-disable-next-line no-unused-vars -- Express identifie ce middleware par son arité.
export function errorHandler(error, req, res, next) {
  const lang = normalizeLanguage(req.query?.lang ?? req.get('accept-language') ?? '');

  if (error instanceof ConversionError) {
    return res.status(error.status).json({
      error: {
        code: error.code,
        message: errorMessage(error.code, error.details, lang),
        details: error.details,
      },
    });
  }

  // JSON malformé intercepté par express.json().
  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return res.status(400).json({
      error: { code: 'INVALID_JSON', message: errorMessage('INVALID_JSON', {}, lang) },
    });
  }

  // Corps au-delà de la limite : c'est un 413, pas une panne du serveur.
  if (error?.type === 'entity.too.large' || error?.status === 413) {
    return res.status(413).json({
      error: { code: 'BODY_TOO_LARGE', message: errorMessage('BODY_TOO_LARGE', {}, lang) },
    });
  }

  console.error('[convertisseur] erreur non gérée :', error);
  return res.status(500).json({
    error: { code: 'INTERNAL', message: errorMessage('INTERNAL', {}, lang) },
  });
}
