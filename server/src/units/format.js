import Decimal from 'decimal.js';
import { D } from './constants.js';

/**
 * Mise en forme des résultats : notation, arrondi, précision, écriture
 * composée (5 pi 8 po) et fractions impériales (3/8 po).
 *
 * Toutes les sorties sont des chaînes canoniques, séparateur décimal « . »,
 * sans séparateur de milliers : la localisation est faite côté client, sur la
 * chaîne, pour ne jamais repasser par un flottant.
 */

export const DEFAULT_PRECISION = 6;
export const MIN_PRECISION = 0;
export const MAX_PRECISION = 20;

/** Modes de précision : chiffres significatifs ou décimales fixes. */
export const PRECISION_MODES = ['significant', 'decimals'];

/** Modes de notation. */
export const NOTATIONS = ['auto', 'plain', 'scientific', 'engineering'];

/** Modes d'arrondi, exposés sous des noms parlants. */
export const ROUNDING_MODES = {
  'half-up': Decimal.ROUND_HALF_UP,
  'half-even': Decimal.ROUND_HALF_EVEN,
  'half-down': Decimal.ROUND_HALF_DOWN,
  up: Decimal.ROUND_CEIL,
  down: Decimal.ROUND_FLOOR,
  truncate: Decimal.ROUND_DOWN,
};

export const DEFAULT_ROUNDING = 'half-up';

/** Dénominateurs proposés pour l'écriture fractionnaire. */
export const FRACTION_DENOMINATORS = [2, 4, 8, 16, 32, 64];

export class FormatError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'FormatError';
    this.code = code;
    this.details = details;
  }
}

// ---------------------------------------------------------------------------
// Normalisation des options
// ---------------------------------------------------------------------------

export function normalizePrecision(raw, mode = 'significant') {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_PRECISION;

  // Number(true) vaut 1 et Number([6]) vaut 6 : sans ce filtre, un client qui
  // envoie un booléen ou un tableau par erreur obtiendrait un résultat
  // silencieusement dégradé au lieu d'une erreur.
  if (typeof raw !== 'number' && typeof raw !== 'string') {
    throw new FormatError('INVALID_PRECISION', { value: String(raw) });
  }

  const parsed = Number(raw);
  const floor = mode === 'decimals' ? 0 : 1;
  if (!Number.isInteger(parsed) || parsed < floor || parsed > MAX_PRECISION) {
    throw new FormatError('INVALID_PRECISION', { value: String(raw) });
  }
  return parsed;
}

export function normalizePrecisionMode(raw) {
  if (raw === undefined || raw === null || raw === '') return 'significant';
  if (!PRECISION_MODES.includes(raw)) throw new FormatError('INVALID_PRECISION_MODE', { value: String(raw) });
  return raw;
}

export function normalizeNotation(raw) {
  if (raw === undefined || raw === null || raw === '') return 'auto';
  if (!NOTATIONS.includes(raw)) throw new FormatError('INVALID_NOTATION', { value: String(raw) });
  return raw;
}

export function normalizeRounding(raw) {
  if (raw === undefined || raw === null || raw === '') return DEFAULT_ROUNDING;
  if (!Object.hasOwn(ROUNDING_MODES, raw)) throw new FormatError('INVALID_ROUNDING', { value: String(raw) });
  return raw;
}

// ---------------------------------------------------------------------------
// Arrondi et notation
// ---------------------------------------------------------------------------

/** Applique la précision demandée, dans le mode demandé. */
export function applyPrecision(decimal, { precision, precisionMode, rounding }) {
  const mode = ROUNDING_MODES[rounding];
  return precisionMode === 'decimals'
    ? decimal.toDecimalPlaces(precision, mode)
    : decimal.toSignificantDigits(Math.max(precision, 1), mode);
}

/** Écriture en notation d'ingénieur : exposant multiple de trois. */
function toEngineering(decimal, significantDigits) {
  if (decimal.isZero()) return { text: '0', exponential: false };

  const exponent = Math.floor(decimal.e / 3) * 3;
  const mantissa = decimal.div(D(10).pow(exponent)).toSignificantDigits(significantDigits);
  return { text: `${mantissa.toFixed()}e${exponent >= 0 ? '+' : ''}${exponent}`, exponential: true };
}

/**
 * Rend un Decimal déjà arrondi sous forme de chaîne, selon la notation choisie.
 */
export function renderNotation(decimal, { notation, precision, precisionMode }) {
  if (decimal.isZero()) return { text: '0', exponential: false };

  const significantDigits = precisionMode === 'decimals'
    ? Math.max(decimal.sd(), 1)
    : Math.max(precision, 1);

  if (notation === 'scientific') {
    return { text: decimal.toExponential(), exponential: true };
  }
  if (notation === 'engineering') {
    return toEngineering(decimal, significantDigits);
  }
  if (notation === 'plain') {
    return { text: decimal.toFixed(), exponential: false };
  }

  // « auto » : forme développée tant qu'elle reste lisible. Les seuils
  // reprennent ceux de Number.prototype.toString, déjà familiers.
  const exponent = decimal.e;
  if (exponent >= 21 || exponent <= -7) {
    return { text: decimal.toExponential(), exponential: true };
  }
  return { text: decimal.toFixed(), exponential: false };
}

/** Arrondit puis met en forme, en une étape. */
export function formatDecimal(decimal, options = {}) {
  const settings = {
    precision: options.precision ?? DEFAULT_PRECISION,
    precisionMode: options.precisionMode ?? 'significant',
    rounding: options.rounding ?? DEFAULT_ROUNDING,
    notation: options.notation ?? 'auto',
  };

  const rounded = applyPrecision(decimal, settings);
  return renderNotation(rounded, settings);
}

// ---------------------------------------------------------------------------
// Fractions
// ---------------------------------------------------------------------------

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/**
 * Approche un nombre par la fraction la plus proche de dénominateur donné.
 * Utilisé pour les unités impériales, où « 8 3/8 po » se lit bien mieux que
 * « 8,375 po ».
 *
 * @returns {{ whole: string, numerator: number, denominator: number,
 *             negative: boolean, text: string, exact: boolean } | null}
 */
export function toFraction(decimal, denominator = 16) {
  if (!Number.isInteger(denominator) || denominator < 2 || denominator > 4096) {
    throw new FormatError('INVALID_DENOMINATOR', { value: String(denominator) });
  }
  if (!decimal.isFinite()) return null;
  // Au-delà, la partie entière écrase la fraction : l'écriture n'apporte rien.
  if (decimal.abs().greaterThan('1e15')) return null;

  const negative = decimal.isNegative();
  const absolute = decimal.abs();

  const whole = absolute.floor();
  const remainder = absolute.minus(whole);

  let numerator = Number(remainder.times(denominator).toFixed(0, Decimal.ROUND_HALF_UP));
  let finalDenominator = denominator;
  let carry = D(0);

  if (numerator >= denominator) {
    carry = D(1);
    numerator = 0;
  }

  const wholePart = whole.plus(carry);

  if (numerator === 0) {
    return {
      whole: wholePart.toFixed(),
      numerator: 0,
      denominator: 1,
      negative,
      text: `${negative ? '-' : ''}${wholePart.toFixed()}`,
      exact: remainder.isZero(),
    };
  }

  const divisor = gcd(numerator, finalDenominator);
  numerator /= divisor;
  finalDenominator /= divisor;

  const wholeText = wholePart.isZero() ? '' : `${wholePart.toFixed()} `;
  const exact = remainder.times(denominator).isInteger();

  return {
    whole: wholePart.toFixed(),
    numerator,
    denominator: finalDenominator,
    negative,
    text: `${negative ? '-' : ''}${wholeText}${numerator}/${finalDenominator}`,
    exact,
  };
}

// ---------------------------------------------------------------------------
// Écriture composée
// ---------------------------------------------------------------------------

/**
 * Décompose une valeur de base sur une suite d'unités décroissantes.
 *
 * Exemple : 1,75 m sur [pi, po] donne « 5 pi 8,9 po ».
 * La dernière unité porte la partie fractionnaire ; les précédentes sont
 * entières. Le signe est appliqué une seule fois, en tête.
 *
 * @param {Decimal} baseValue valeur exprimée dans l'unité de base
 * @param {Array<{ id, factor, symbol }>} steps unités, de la plus grande à la plus petite
 */
export function toComposite(baseValue, steps, options = {}) {
  if (!steps || steps.length === 0) return null;
  if (!baseValue.isFinite()) return null;
  if (baseValue.abs().greaterThan('1e18')) return null;

  const negative = baseValue.isNegative();
  let remainder = baseValue.abs();
  const parts = [];

  steps.forEach((step, index) => {
    const isLast = index === steps.length - 1;
    const inUnit = remainder.div(step.factor);

    if (isLast) {
      const rounded = applyPrecision(inUnit, {
        precision: options.precision ?? 3,
        precisionMode: options.precisionMode ?? 'decimals',
        rounding: options.rounding ?? DEFAULT_ROUNDING,
      });
      parts.push({ unit: step.id, value: rounded.toFixed(), decimal: rounded });
    } else {
      const whole = inUnit.floor();
      parts.push({ unit: step.id, value: whole.toFixed(), decimal: whole });
      remainder = remainder.minus(whole.times(step.factor));
    }
  });

  // Les zéros de tête n'apportent rien (« 8,9 po » plutôt que « 0 pi 8,9 po »),
  // ni les zéros de queue (« 5 pi » plutôt que « 5 pi 0 po »). On garde toujours
  // au moins une partie, pour que zéro reste affichable.
  let first = parts.findIndex((part) => !part.decimal.isZero());
  let last = parts.findLastIndex((part) => !part.decimal.isZero());

  if (first === -1) {
    first = parts.length - 1;
    last = parts.length - 1;
  }

  return { negative, parts: parts.slice(first, last + 1) };
}
