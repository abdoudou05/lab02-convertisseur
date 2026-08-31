import { Router } from 'express';
import { convert, convertBatch, buildTable, ratio, ConversionError } from '../units/convert.js';
import { CATEGORIES, getCategory } from '../units/definitions.js';
import {
  serializeCatalogue, serializeCategory, normalizeLanguage, formattingOptions,
} from '../units/catalogue.js';
import { warningMessage } from '../messages.js';

const router = Router();

/** La langue peut venir de la query (`?lang=en`) ou de l'en-tête Accept-Language. */
const languageOf = (req) => normalizeLanguage(req.query.lang ?? req.get('accept-language') ?? '');

/** Traduit les avertissements portés par une charge utile. */
const localizeWarnings = (payload, lang) => ({
  ...payload,
  warnings: (payload.warnings ?? []).map((warning) => ({
    ...warning,
    message: warningMessage(warning.code, warning, lang),
  })),
});

/** Vérifie la présence des champs indispensables. */
function requireFields(input, fields) {
  for (const field of fields) {
    const provided = input[field];
    if (provided === undefined || provided === null || provided === '') {
      throw new ConversionError('MISSING_FIELD', { field });
    }
  }
}

/**
 * Les unités personnalisées voyagent en JSON dans le corps d'une requête POST,
 * et sous forme de chaîne JSON dans l'URL d'une requête GET.
 */
function readExtraUnits(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'shape' });
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('not an array');
    return parsed;
  } catch {
    throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'shape' });
  }
}

// ---------------------------------------------------------------------------
// Sonde de santé, utilisée par le client pour signaler une API hors service.
// ---------------------------------------------------------------------------
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    categories: CATEGORIES.length,
    units: CATEGORIES.reduce((total, category) => total + category.units.length, 0),
  });
});

// ---------------------------------------------------------------------------
// Catalogue des catégories et de leurs unités.
// ---------------------------------------------------------------------------
router.get('/categories', (req, res) => {
  const lang = languageOf(req);
  res.json({
    lang,
    categories: serializeCatalogue(lang),
    formatting: formattingOptions(),
  });
});

router.get('/categories/:categoryId', (req, res, next) => {
  const lang = languageOf(req);
  const category = getCategory(req.params.categoryId);
  if (!category) {
    return next(new ConversionError('UNKNOWN_CATEGORY', { categoryId: req.params.categoryId }));
  }
  res.json({ lang, category: serializeCategory(category, lang) });
});

// ---------------------------------------------------------------------------
// Conversion.
// ---------------------------------------------------------------------------
const CONVERT_FIELDS = ['category', 'from', 'to', 'value'];

function runConversion(input, lang) {
  requireFields(input, CONVERT_FIELDS);
  return localizeWarnings(
    convert({ ...input, extraUnits: readExtraUnits(input.extraUnits) }),
    lang,
  );
}

router.post('/convert', (req, res, next) => {
  try {
    res.json(runConversion(req.body ?? {}, languageOf(req)));
  } catch (error) {
    next(error);
  }
});

// Variante GET : rend une conversion partageable par simple URL.
router.get('/convert', (req, res, next) => {
  try {
    res.json(runConversion(req.query ?? {}, languageOf(req)));
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Conversion par lot : une liste de valeurs, les mêmes réglages pour toutes.
// ---------------------------------------------------------------------------
router.post('/convert/batch', (req, res, next) => {
  try {
    const input = req.body ?? {};
    requireFields(input, ['category', 'from', 'to', 'values']);
    res.json(convertBatch({ ...input, extraUnits: readExtraUnits(input.extraUnits) }));
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Table de référence imprimable.
// ---------------------------------------------------------------------------
router.get('/table', (req, res, next) => {
  try {
    const input = req.query ?? {};
    requireFields(input, ['category', 'from', 'to']);
    res.json(buildTable({ ...input, extraUnits: readExtraUnits(input.extraUnits) }));
  } catch (error) {
    next(error);
  }
});

// ---------------------------------------------------------------------------
// Facteur seul, pour les intégrations légères.
// ---------------------------------------------------------------------------
router.get('/ratio', (req, res, next) => {
  try {
    const input = req.query ?? {};
    requireFields(input, ['category', 'from', 'to']);
    res.json({
      category: input.category,
      from: input.from,
      to: input.to,
      ratio: ratio({ ...input, extraUnits: readExtraUnits(input.extraUnits) }),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
