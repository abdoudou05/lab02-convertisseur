import Decimal from 'decimal.js';
import { D } from './constants.js';
import { getCategory, getUnit } from './definitions.js';
import { findComposite, defaultComposite, compositesFor } from './composites.js';
import { isExpression, evaluateExpression, ExpressionError } from './expression.js';
import {
  formatDecimal, applyPrecision, renderNotation, toFraction, toComposite,
  normalizePrecision, normalizePrecisionMode, normalizeNotation, normalizeRounding,
  FormatError, DEFAULT_PRECISION, MAX_PRECISION, FRACTION_DENOMINATORS,
} from './format.js';

const ZERO = D(0);

/** Longueur maximale d'une saisie numérique simple. */
const MAX_INPUT_LENGTH = 64;
/** Exposant décimal maximal accepté en entrée. */
const MAX_INPUT_EXPONENT = 300;
/** Nombre maximal d'unités personnalisées acceptées dans une requête. */
const MAX_EXTRA_UNITS = 24;

export { DEFAULT_PRECISION, MAX_PRECISION, FRACTION_DENOMINATORS };

/**
 * Erreur métier portant un code stable. Les messages lisibles sont produits
 * par la couche HTTP, qui connaît la langue demandée.
 */
export class ConversionError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'ConversionError';
    this.code = code;
    this.details = details;
    this.status = code === 'UNKNOWN_CATEGORY' || code === 'UNKNOWN_UNIT' ? 404 : 400;
  }
}

/** Rejoue une erreur de mise en forme ou d'expression comme erreur de conversion. */
function rethrow(error) {
  if (error instanceof FormatError || error instanceof ExpressionError) {
    throw new ConversionError(error.code, error.details);
  }
  throw error;
}

// ---------------------------------------------------------------------------
// Lecture d'une valeur saisie
// ---------------------------------------------------------------------------

/** Espaces utilisés comme séparateurs de milliers, y compris les insécables. */
const GROUPING_WHITESPACE = /[\s   ']/g;
/** Forme canonique acceptée après normalisation. */
const NUMERIC_PATTERN = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Convertit une saisie utilisateur en Decimal.
 *
 * Tolère les conventions des deux langues (« 1 234,56 » et "1,234.56") et
 * accepte une expression arithmétique complète (« 12*3+4 »).
 *
 * @returns {{ decimal: Decimal, expression: string|null }}
 */
export function parseNumericInput(raw) {
  if (raw instanceof Decimal) return { decimal: raw, expression: null };

  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) throw new ConversionError('INVALID_VALUE', { value: String(raw) });
    return { decimal: D(raw), expression: null };
  }

  if (typeof raw !== 'string') {
    throw new ConversionError('INVALID_VALUE', { value: String(raw) });
  }

  const trimmed = raw.trim();
  if (trimmed === '') throw new ConversionError('EMPTY_VALUE');

  // Une expression est reconnue à ses opérateurs ou à ses fonctions.
  if (isExpression(trimmed)) {
    try {
      return { decimal: evaluateExpression(trimmed), expression: trimmed };
    } catch (error) {
      rethrow(error);
    }
  }

  if (trimmed.length > MAX_INPUT_LENGTH) throw new ConversionError('VALUE_TOO_LONG');

  let normalized = trimmed.replace(GROUPING_WHITESPACE, '');
  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  if (hasComma && hasDot) {
    // Le dernier séparateur rencontré est le séparateur décimal.
    normalized = normalized.lastIndexOf(',') > normalized.lastIndexOf('.')
      ? normalized.replace(/\./g, '').replace(',', '.')
      : normalized.replace(/,/g, '');
  } else if (hasComma) {
    normalized = normalized.replace(',', '.');
  }

  if (!NUMERIC_PATTERN.test(normalized)) {
    throw new ConversionError('INVALID_VALUE', { value: trimmed });
  }

  let decimal;
  try {
    decimal = D(normalized);
  } catch {
    throw new ConversionError('INVALID_VALUE', { value: trimmed });
  }

  if (!decimal.isFinite()) throw new ConversionError('INVALID_VALUE', { value: trimmed });
  if (!decimal.isZero() && Math.abs(decimal.e) > MAX_INPUT_EXPONENT) {
    throw new ConversionError('VALUE_OUT_OF_RANGE', { value: trimmed });
  }

  return { decimal, expression: null };
}

// ---------------------------------------------------------------------------
// Unités personnalisées
// ---------------------------------------------------------------------------

const CUSTOM_ID = /^[a-z0-9_-]{1,32}$/i;

/**
 * Identifiants refusés par précaution. Les unités ne servent aujourd'hui que
 * de valeurs dans des tableaux et des Map, donc rien n'est exploitable ; mais
 * le jour où un identifiant deviendrait une clé d'objet ordinaire, ces noms
 * ouvriraient une pollution de prototype. Autant fermer la porte maintenant.
 */
const RESERVED_IDS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Valide les unités définies par l'utilisateur et les fusionne dans la
 * catégorie, le temps d'une requête. Rien n'est écrit côté serveur : ces
 * unités vivent dans le navigateur et voyagent avec chaque appel.
 */
function mergeExtraUnits(category, extraUnits) {
  if (!extraUnits || extraUnits.length === 0) return category;
  if (!Array.isArray(extraUnits)) throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'shape' });
  if (extraUnits.length > MAX_EXTRA_UNITS) throw new ConversionError('TOO_MANY_CUSTOM_UNITS');

  // Une unité personnalisée n'est décrite que par un facteur. Cela suffit sur
  // une échelle purement linéaire, mais pas là où il faut aussi un décalage
  // (température) ou un rapport inverse (consommation) : plutôt que de calculer
  // faux en silence, on refuse.
  const hasOffset = category.units.some((unit) => unit.offset && !unit.offset.isZero());
  if (category.kind !== 'affine' || hasOffset) {
    throw new ConversionError('CUSTOM_UNIT_UNSUPPORTED', { categoryId: category.id });
  }

  const known = new Set(category.units.map((unit) => unit.id));
  const merged = [];

  for (const raw of extraUnits) {
    if (!raw || typeof raw !== 'object') throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'shape' });
    if (raw.category !== undefined && raw.category !== category.id) continue;

    const id = String(raw.id ?? '');
    if (!CUSTOM_ID.test(id) || RESERVED_IDS.has(id.toLowerCase())) {
      throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'id', id });
    }
    if (known.has(id)) throw new ConversionError('CUSTOM_UNIT_CONFLICT', { id });
    known.add(id);

    const symbol = String(raw.symbol ?? '').trim().slice(0, 24) || id;
    const name = String(raw.name ?? '').trim().slice(0, 64) || symbol;

    let factor;
    try {
      factor = D(String(raw.factor));
    } catch {
      throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'factor', id });
    }
    if (!factor.isFinite() || factor.lessThanOrEqualTo(0)) {
      throw new ConversionError('INVALID_CUSTOM_UNIT', { reason: 'factor', id });
    }

    merged.push({ id, symbol, name: { fr: name, en: name }, factor, system: 'custom', custom: true });
  }

  if (merged.length === 0) return category;
  return { ...category, units: [...category.units, ...merged] };
}

// ---------------------------------------------------------------------------
// Cœur du calcul
// ---------------------------------------------------------------------------

/** Valeur exprimée dans une unité → valeur dans l'unité de base. */
export function toBase(unit, value, kind) {
  if (kind === 'reciprocal') {
    if (unit.mode === 'inverse') {
      if (value.isZero()) throw new ConversionError('ZERO_NOT_CONVERTIBLE', { unit: unit.id });
      return unit.constant.div(value);
    }
    return value.times(unit.factor);
  }
  return value.times(unit.factor).plus(unit.offset ?? ZERO);
}

/** Valeur dans l'unité de base → valeur exprimée dans une unité. */
export function fromBase(unit, base, kind) {
  if (kind === 'reciprocal') {
    if (unit.mode === 'inverse') {
      if (base.isZero()) throw new ConversionError('ZERO_NOT_CONVERTIBLE', { unit: unit.id });
      return unit.constant.div(base);
    }
    return base.div(unit.factor);
  }
  return base.minus(unit.offset ?? ZERO).div(unit.factor);
}

// ---------------------------------------------------------------------------
// Options de sortie
// ---------------------------------------------------------------------------

function readOptions(input) {
  try {
    const precisionMode = normalizePrecisionMode(input.precisionMode);
    return {
      precisionMode,
      precision: normalizePrecision(input.precision, precisionMode),
      rounding: normalizeRounding(input.rounding),
      notation: normalizeNotation(input.notation),
    };
  } catch (error) {
    rethrow(error);
    return null;
  }
}

/** Dénominateur de fraction demandé, ou null si l'affichage fractionnaire est éteint. */
function readFraction(raw) {
  if (raw === undefined || raw === null || raw === '' || raw === false || raw === 'none') return null;
  const parsed = Number(raw);
  if (!FRACTION_DENOMINATORS.includes(parsed)) {
    throw new ConversionError('INVALID_DENOMINATOR', { value: String(raw) });
  }
  return parsed;
}

/** Enrobe un Decimal dans la charge utile renvoyée par l'API. */
function describe(decimal, options) {
  const { text, exponential } = formatDecimal(decimal, options);
  return {
    text,
    exponential,
    // Représentation haute précision, utile pour copier une valeur brute.
    raw: decimal.toSignificantDigits(MAX_PRECISION).toString(),
    number: decimal.toNumber(),
  };
}

// ---------------------------------------------------------------------------
// API du module
// ---------------------------------------------------------------------------

function resolve(categoryId, extraUnits) {
  const base = getCategory(categoryId);
  if (!base) throw new ConversionError('UNKNOWN_CATEGORY', { categoryId });
  return mergeExtraUnits(base, extraUnits);
}

function unitOf(category, unitId) {
  const unit = category.units.find((candidate) => candidate.id === unitId);
  if (!unit) throw new ConversionError('UNKNOWN_UNIT', { categoryId: category.id, unitId });
  return unit;
}

/**
 * Convertit une valeur d'une unité vers une autre, à l'intérieur d'une même
 * catégorie, et renvoie tout ce dont l'interface a besoin : le résultat, la
 * valeur dans toutes les autres unités, l'écriture composée, la fraction
 * approchée et les avertissements physiques.
 */
export function convert(input) {
  const category = resolve(input.category, input.extraUnits);
  const fromUnit = unitOf(category, input.from);
  const toUnit = unitOf(category, input.to);

  const options = readOptions(input);
  const fractionDenominator = readFraction(input.fraction);
  const { decimal: value, expression } = parseNumericInput(input.value);

  if (category.positiveOnly && value.lessThanOrEqualTo(0)) {
    throw new ConversionError('POSITIVE_VALUE_REQUIRED', { categoryId: category.id });
  }

  const base = toBase(fromUnit, value, category.kind);
  const output = fromBase(toUnit, base, category.kind);

  const warnings = [];
  if (category.absoluteFloor && base.lessThan(0)) {
    warnings.push({ code: 'BELOW_ABSOLUTE_ZERO' });
  }
  if (expression) {
    warnings.push({ code: 'EXPRESSION_EVALUATED', value: value.toSignificantDigits(MAX_PRECISION).toString() });
  }

  const all = category.units.map((unit) => {
    const converted = unit.id === toUnit.id ? output : fromBase(unit, base, category.kind);
    return { unit: unit.id, ...describe(converted, options) };
  });

  const result = describe(output, options);

  // Fraction approchée : lisible surtout sur les unités impériales.
  if (fractionDenominator) {
    try {
      result.fraction = toFraction(output, fractionDenominator);
    } catch (error) {
      rethrow(error);
    }
  }

  return {
    category: category.id,
    from: fromUnit.id,
    to: toUnit.id,
    ...options,
    fraction: fractionDenominator,
    input: {
      text: value.toString(),
      number: value.toNumber(),
      expression: expression ?? null,
    },
    result,
    composite: buildComposite(category, base, input.composite, options),
    all,
    ratio: ratioOf(category, fromUnit, toUnit, options),
    warnings,
  };
}

/**
 * Écriture composée du résultat, quand la catégorie en propose une.
 * `composite` vaut « none » pour la désactiver, « auto » pour le préréglage
 * par défaut, ou l'identifiant d'un préréglage précis.
 */
function buildComposite(category, base, requested, options) {
  if (requested === 'none' || requested === false) return null;
  if (category.kind !== 'affine') return null;

  const preset = requested && requested !== 'auto'
    ? findComposite(category.id, requested)
    : defaultComposite(category.id);
  if (!preset) return null;

  const steps = preset.units
    .map((unitId) => category.units.find((unit) => unit.id === unitId))
    .filter(Boolean);
  if (steps.length !== preset.units.length) return null;

  // Une échelle avec décalage ne se décompose pas en tranches successives.
  if (steps.some((step) => step.offset && !step.offset.isZero())) return null;

  const decomposed = toComposite(base, steps, {
    precision: Math.min(options.precision, 6),
    precisionMode: 'decimals',
    rounding: options.rounding,
  });
  if (!decomposed) return null;

  return {
    id: preset.id,
    negative: decomposed.negative,
    parts: decomposed.parts.map((part) => ({ unit: part.unit, value: part.value })),
    fraction: preset.fraction ?? null,
  };
}

/**
 * Facteur de conversion « 1 unité source = n unités cible ».
 * Renvoie `null` là où ce raccourci n'a pas de sens : une échelle affine
 * (température) ou un rapport inverse (consommation) n'a pas de facteur unique.
 */
function ratioOf(category, fromUnit, toUnit, options) {
  if (category.kind !== 'affine') return null;
  const hasOffset = category.units.some((unit) => unit.offset && !unit.offset.isZero());
  if (hasOffset) return null;

  const one = fromBase(toUnit, toBase(fromUnit, D(1), category.kind), category.kind);
  return describe(one, options);
}

/** Version autonome du facteur, utilisée par les tests et par la route dédiée. */
export function ratio(input) {
  const category = resolve(input.category, input.extraUnits);
  const fromUnit = unitOf(category, input.from);
  const toUnit = unitOf(category, input.to);
  return ratioOf(category, fromUnit, toUnit, readOptions(input));
}

/**
 * Convertit une liste de valeurs en une seule passe. Le catalogue et les
 * options ne sont résolus qu'une fois : c'est nettement plus rapide qu'autant
 * d'appels séparés, et cela garantit des réglages identiques sur toute la liste.
 */
export function convertBatch(input) {
  const category = resolve(input.category, input.extraUnits);
  const fromUnit = unitOf(category, input.from);
  const toUnit = unitOf(category, input.to);
  const options = readOptions(input);

  const values = Array.isArray(input.values) ? input.values : [];
  if (values.length === 0) throw new ConversionError('EMPTY_BATCH');
  if (values.length > 500) throw new ConversionError('BATCH_TOO_LARGE', { max: 500 });

  const rows = values.map((raw, index) => {
    try {
      const { decimal, expression } = parseNumericInput(raw);
      if (category.positiveOnly && decimal.lessThanOrEqualTo(0)) {
        throw new ConversionError('POSITIVE_VALUE_REQUIRED', { categoryId: category.id });
      }
      const converted = fromBase(toUnit, toBase(fromUnit, decimal, category.kind), category.kind);
      return {
        index,
        source: String(raw),
        input: decimal.toString(),
        expression: expression ?? null,
        ...describe(converted, options),
      };
    } catch (error) {
      return {
        index,
        source: String(raw),
        error: error instanceof ConversionError ? error.code : 'INVALID_VALUE',
      };
    }
  });

  return {
    category: category.id,
    from: fromUnit.id,
    to: toUnit.id,
    ...options,
    count: rows.length,
    converted: rows.filter((row) => !row.error).length,
    rows,
  };
}

/**
 * Table de référence : une suite régulière de valeurs et leur conversion.
 * Sert à produire l'aide-mémoire imprimable (« 1 à 20 pieds en mètres »).
 */
export function buildTable(input) {
  const category = resolve(input.category, input.extraUnits);
  const fromUnit = unitOf(category, input.from);
  const toUnit = unitOf(category, input.to);
  const options = readOptions(input);

  const start = parseNumericInput(input.start ?? 1).decimal;
  const step = parseNumericInput(input.step ?? 1).decimal;

  const count = Number(input.count ?? 20);
  if (!Number.isInteger(count) || count < 1 || count > 200) {
    throw new ConversionError('INVALID_COUNT', { value: String(input.count) });
  }
  if (step.isZero()) throw new ConversionError('INVALID_STEP');

  const rows = [];
  for (let index = 0; index < count; index += 1) {
    const value = start.plus(step.times(index));
    if (category.positiveOnly && value.lessThanOrEqualTo(0)) continue;

    const converted = fromBase(toUnit, toBase(fromUnit, value, category.kind), category.kind);
    rows.push({
      input: value.toString(),
      inputFormatted: renderNotation(
        applyPrecision(value, options),
        options,
      ).text,
      ...describe(converted, options),
    });
  }

  return {
    category: category.id,
    from: fromUnit.id,
    to: toUnit.id,
    ...options,
    start: start.toString(),
    step: step.toString(),
    count: rows.length,
    rows,
  };
}

/** Préréglages d'écriture composée exposés au client. */
export const compositePresets = (categoryId) => compositesFor(categoryId);
