import { CATEGORIES } from './definitions.js';
import { compositesFor } from './composites.js';
import { FRACTION_DENOMINATORS, NOTATIONS, PRECISION_MODES, ROUNDING_MODES } from './format.js';

export const SUPPORTED_LANGUAGES = ['fr', 'en'];
export const DEFAULT_LANGUAGE = 'fr';

/** Retient `fr` ou `en` à partir d'un paramètre libre (`fr-CA`, `EN`, ...). */
export function normalizeLanguage(raw) {
  if (typeof raw !== 'string') return DEFAULT_LANGUAGE;
  const base = raw.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(base) ? base : DEFAULT_LANGUAGE;
}

/** Résout un champ qui peut être une chaîne unique ou un objet { fr, en }. */
const localize = (field, lang) => {
  if (field === undefined || field === null) return null;
  if (typeof field === 'string') return field;
  return field[lang] ?? field[DEFAULT_LANGUAGE] ?? null;
};

function serializeUnit(unit, lang) {
  return {
    id: unit.id,
    symbol: localize(unit.symbol, lang),
    name: localize(unit.name, lang),
    system: unit.system ?? 'other',
    note: localize(unit.note, lang),
    // Utile au client pour expliquer pourquoi certaines unités décroissent.
    mode: unit.mode ?? null,
  };
}

export function serializeCategory(category, lang) {
  return {
    id: category.id,
    icon: category.icon,
    name: localize(category.name, lang),
    blurb: localize(category.blurb, lang),
    base: category.base,
    kind: category.kind,
    defaultPair: category.defaultPair,
    positiveOnly: Boolean(category.positiveOnly),
    absoluteFloor: Boolean(category.absoluteFloor),
    // Les unités personnalisées ne sont possibles que sur une échelle linéaire.
    supportsCustomUnits: category.kind === 'affine'
      && !category.units.some((unit) => unit.offset && !unit.offset.isZero()),
    composites: compositesFor(category.id).map((preset) => ({
      id: preset.id,
      name: localize(preset.name, lang),
      units: preset.units,
      fraction: preset.fraction ?? null,
    })),
    units: category.units.map((unit) => serializeUnit(unit, lang)),
  };
}

/** Catalogue complet, prêt à être envoyé au client. */
export function serializeCatalogue(lang) {
  return CATEGORIES.map((category) => serializeCategory(category, lang));
}

/** Capacités de mise en forme, pour que le client construise ses réglages. */
export const formattingOptions = () => ({
  notations: NOTATIONS,
  precisionModes: PRECISION_MODES,
  roundingModes: Object.keys(ROUNDING_MODES),
  fractionDenominators: FRACTION_DENOMINATORS,
});
