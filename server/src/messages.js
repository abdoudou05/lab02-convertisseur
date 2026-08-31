import { DEFAULT_LANGUAGE } from './units/catalogue.js';

/**
 * Messages bilingues. Le moteur de conversion ne connaît que des codes ; la
 * traduction est faite ici, au bord HTTP, où la langue demandée est connue.
 */
const MESSAGES = {
  UNKNOWN_CATEGORY: {
    fr: (d) => `La catégorie « ${d.categoryId} » n’existe pas.`,
    en: (d) => `Unknown category “${d.categoryId}”.`,
  },
  UNKNOWN_UNIT: {
    fr: (d) => `L’unité « ${d.unitId} » n’appartient pas à la catégorie « ${d.categoryId} ».`,
    en: (d) => `Unit “${d.unitId}” does not belong to category “${d.categoryId}”.`,
  },
  EMPTY_VALUE: {
    fr: () => 'Saisissez une valeur à convertir.',
    en: () => 'Enter a value to convert.',
  },
  INVALID_VALUE: {
    fr: (d) => `« ${d.value ?? ''} » n’est pas un nombre valide.`,
    en: (d) => `“${d.value ?? ''}” is not a valid number.`,
  },
  VALUE_TOO_LONG: {
    fr: () => 'La valeur saisie est trop longue (64 caractères maximum).',
    en: () => 'The value is too long (64 characters maximum).',
  },
  VALUE_OUT_OF_RANGE: {
    fr: () => 'La valeur dépasse la plage acceptée (exposant décimal de ±300).',
    en: () => 'The value exceeds the accepted range (decimal exponent of ±300).',
  },
  POSITIVE_VALUE_REQUIRED: {
    fr: () => 'Cette catégorie exige une valeur strictement positive.',
    en: () => 'This category requires a strictly positive value.',
  },
  ZERO_NOT_CONVERTIBLE: {
    fr: () => 'Cette catégorie utilise un rapport inverse : la valeur doit être différente de zéro.',
    en: () => 'This category uses an inverse relationship: the value must not be zero.',
  },

  // Réglages de mise en forme
  INVALID_PRECISION: {
    fr: () => 'La précision doit être un entier compris entre 0 et 20.',
    en: () => 'Precision must be an integer between 0 and 20.',
  },
  INVALID_PRECISION_MODE: {
    fr: () => 'Le mode de précision doit être « significant » ou « decimals ».',
    en: () => 'Precision mode must be “significant” or “decimals”.',
  },
  INVALID_NOTATION: {
    fr: () => 'La notation doit être « auto », « plain », « scientific » ou « engineering ».',
    en: () => 'Notation must be “auto”, “plain”, “scientific” or “engineering”.',
  },
  INVALID_ROUNDING: {
    fr: () => 'Mode d’arrondi inconnu.',
    en: () => 'Unknown rounding mode.',
  },
  INVALID_DENOMINATOR: {
    fr: () => 'Le dénominateur doit valoir 2, 4, 8, 16, 32 ou 64.',
    en: () => 'The denominator must be 2, 4, 8, 16, 32 or 64.',
  },

  // Expressions
  INVALID_EXPRESSION: {
    fr: () => 'Cette expression est incomplète ou mal formée.',
    en: () => 'That expression is incomplete or malformed.',
  },
  UNKNOWN_SYMBOL: {
    fr: (d) => `Symbole inconnu dans l’expression : « ${d.symbol ?? ''} ».`,
    en: (d) => `Unknown symbol in the expression: “${d.symbol ?? ''}”.`,
  },
  UNBALANCED_PARENTHESES: {
    fr: () => 'Les parenthèses ne sont pas équilibrées.',
    en: () => 'The parentheses are not balanced.',
  },
  DIVISION_BY_ZERO: {
    fr: () => 'Division par zéro.',
    en: () => 'Division by zero.',
  },
  MATH_DOMAIN: {
    fr: (d) => `La fonction « ${d.fn ?? ''} » n’est pas définie pour cette valeur.`,
    en: (d) => `The function “${d.fn ?? ''}” is not defined for that value.`,
  },
  NOT_FINITE: {
    fr: () => 'Le résultat de l’expression n’est pas un nombre fini.',
    en: () => 'The expression does not produce a finite number.',
  },
  EXPRESSION_TOO_LONG: {
    fr: () => 'L’expression est trop longue (200 caractères maximum).',
    en: () => 'The expression is too long (200 characters maximum).',
  },
  EXPRESSION_TOO_COMPLEX: {
    fr: () => 'L’expression comporte trop d’éléments.',
    en: () => 'The expression has too many elements.',
  },
  EXPRESSION_OUT_OF_RANGE: {
    fr: () => 'Le résultat de l’expression dépasse la plage acceptée.',
    en: () => 'The expression result exceeds the accepted range.',
  },

  // Unités personnalisées
  INVALID_CUSTOM_UNIT: {
    fr: (d) => `Unité personnalisée invalide (${d.reason ?? 'inconnue'}).`,
    en: (d) => `Invalid custom unit (${d.reason ?? 'unknown'}).`,
  },
  CUSTOM_UNIT_CONFLICT: {
    fr: (d) => `L’identifiant « ${d.id} » est déjà utilisé par une unité existante.`,
    en: (d) => `The identifier “${d.id}” is already used by an existing unit.`,
  },
  CUSTOM_UNIT_UNSUPPORTED: {
    fr: () => 'Cette catégorie n’accepte pas d’unité personnalisée.',
    en: () => 'This category does not accept custom units.',
  },
  TOO_MANY_CUSTOM_UNITS: {
    fr: () => 'Trop d’unités personnalisées (24 au maximum).',
    en: () => 'Too many custom units (24 maximum).',
  },

  // Lots et tables
  EMPTY_BATCH: {
    fr: () => 'Aucune valeur à convertir.',
    en: () => 'No values to convert.',
  },
  BATCH_TOO_LARGE: {
    fr: (d) => `Trop de valeurs (${d.max} au maximum).`,
    en: (d) => `Too many values (${d.max} maximum).`,
  },
  INVALID_COUNT: {
    fr: () => 'Le nombre de lignes doit être un entier compris entre 1 et 200.',
    en: () => 'The row count must be an integer between 1 and 200.',
  },
  INVALID_STEP: {
    fr: () => 'Le pas ne peut pas être nul.',
    en: () => 'The step cannot be zero.',
  },

  // Génériques
  MISSING_FIELD: {
    fr: (d) => `Le champ « ${d.field} » est obligatoire.`,
    en: (d) => `The field “${d.field}” is required.`,
  },
  INVALID_JSON: {
    fr: () => 'Corps JSON invalide.',
    en: () => 'Malformed JSON body.',
  },
  BODY_TOO_LARGE: {
    fr: () => 'La requête dépasse la taille acceptée (16 ko).',
    en: () => 'The request exceeds the accepted size (16 kB).',
  },
  NOT_FOUND: {
    fr: () => 'Ressource introuvable.',
    en: () => 'Resource not found.',
  },
  INTERNAL: {
    fr: () => 'Une erreur interne est survenue.',
    en: () => 'An internal error occurred.',
  },
};

/** Avertissements non bloquants renvoyés avec un résultat valide. */
const WARNINGS = {
  BELOW_ABSOLUTE_ZERO: {
    fr: () => 'Cette température est sous le zéro absolu (0 K) : elle est physiquement impossible.',
    en: () => 'This temperature is below absolute zero (0 K): it is physically impossible.',
  },
  EXPRESSION_EVALUATED: {
    fr: (d) => `Expression évaluée à ${d.value ?? ''}.`,
    en: (d) => `Expression evaluated to ${d.value ?? ''}.`,
  },
};

const resolve = (table, code, details, lang) => {
  const entry = table[code];
  if (!entry) return code;
  const render = entry[lang] ?? entry[DEFAULT_LANGUAGE];
  return render(details ?? {});
};

export const errorMessage = (code, details, lang) => resolve(MESSAGES, code, details, lang);
export const warningMessage = (code, details, lang) => resolve(WARNINGS, code, details, lang);
