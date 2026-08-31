/**
 * Mise en forme locale d'un nombre reçu de l'API sous forme de CHAÎNE.
 *
 * L'API renvoie volontairement une chaîne canonique (« 1234.5678 ») plutôt
 * qu'un Number : convertir en Number pour appeler Intl.NumberFormat ferait
 * perdre des chiffres sur les grandes valeurs. On applique donc la convention
 * locale directement sur la chaîne, sans jamais repasser par un flottant.
 */

const separatorCache = new Map();

/** Séparateurs décimal et de milliers d'une locale, lus via Intl. */
function separatorsFor(locale) {
  const cached = separatorCache.get(locale);
  if (cached) return cached;

  let separators = { group: ' ', decimal: ',' };
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
    separators = {
      group: parts.find((part) => part.type === 'group')?.value ?? ' ',
      decimal: parts.find((part) => part.type === 'decimal')?.value ?? ',',
    };
  } catch {
    // Locale inconnue du navigateur : les valeurs françaises restent lisibles.
  }

  separatorCache.set(locale, separators);
  return separators;
}

/** Insère un séparateur tous les trois chiffres, en partant de la droite. */
function group(digits, separator) {
  if (digits.length <= 3) return digits;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
}

/**
 * @returns {{ sign, integer, decimal, fraction, exponent, plain }}
 *   Les morceaux permettent d'afficher l'exposant en exposant typographique ;
 *   `plain` est la chaîne complète, pour la copie et les lecteurs d'écran.
 */
export function formatNumberText(text, locale, options = {}) {
  const empty = { sign: '', integer: '', decimal: '', fraction: '', exponent: null, plain: '' };
  if (text === undefined || text === null || text === '') return empty;

  const { grouping = true } = options;
  const { group: groupSeparator, decimal: decimalSeparator } = separatorsFor(locale);

  const raw = String(text).trim();
  const [mantissa, exponentPart] = raw.split(/[eE]/);

  const sign = mantissa.startsWith('-') ? '−' : ''; // signe moins typographique
  const unsigned = mantissa.replace(/^[+-]/, '');
  const [integerDigits = '0', fractionDigits = ''] = unsigned.split('.');

  const integer = grouping ? group(integerDigits, groupSeparator) : integerDigits;
  const hasFraction = fractionDigits.length > 0;

  // L'exposant conserve son signe mais perd le « + » superflu.
  let exponent = null;
  if (exponentPart !== undefined) {
    const normalized = exponentPart.replace('+', '');
    exponent = normalized.startsWith('-') ? `−${normalized.slice(1)}` : normalized;
  }

  const plain = `${sign}${integer}${hasFraction ? decimalSeparator + fractionDigits : ''}`
    + (exponent === null ? '' : ` × 10^${exponent}`);

  return { sign, integer, decimal: hasFraction ? decimalSeparator : '', fraction: fractionDigits, exponent, plain };
}

/** Convertit une saisie locale (« 1 234,5 ») en chaîne canonique pour l'API. */
export function canonicalizeInput(input) {
  return String(input ?? '')
    .replace(/[\s   ']/g, '')
    .replace(',', '.');
}

/** Chaîne compacte destinée au presse-papiers : « 30,48 m ». */
export function clipboardText(numberText, symbol, locale, options) {
  const { plain } = formatNumberText(numberText, locale, options);
  return symbol ? `${plain} ${symbol}` : plain;
}

/** Écriture composée mise en forme : « 5 pi 8,9 po ». */
export function compositeText(composite, units, locale, options) {
  if (!composite?.parts?.length) return '';
  const body = composite.parts
    .map((part) => {
      const unit = units.find((candidate) => candidate.id === part.unit);
      const { plain } = formatNumberText(part.value, locale, options);
      return `${plain} ${unit?.symbol ?? part.unit}`;
    })
    .join(' ');
  return composite.negative ? `−${body}` : body;
}

/** Découpe un texte collé en une liste de valeurs (une par ligne, ou séparées). */
export function splitValues(raw) {
  return String(raw ?? '')
    .split(/[\n;\t]+|,(?=\s)|\s{2,}/)
    .map((entry) => entry.trim())
    .filter((entry) => entry !== '');
}

/** Échappe une cellule pour un fichier CSV. */
const csvCell = (value) => {
  const text = String(value ?? '');
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Construit un document CSV à partir d'en-têtes et de lignes. */
export const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(csvCell).join(';')).join('\r\n');
