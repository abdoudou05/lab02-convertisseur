import Decimal from 'decimal.js';
import { D, PI } from './constants.js';

/**
 * Évaluateur d'expressions arithmétiques.
 *
 * Permet de saisir « 12*3+4 », « (5+3)/2 » ou « sqrt(2)*10 » directement dans
 * le champ de valeur, au lieu de sortir la calculatrice avant de convertir.
 *
 * Implémentation : découpage en jetons, puis algorithme « shunting-yard » vers
 * une notation postfixée, enfin évaluation en arithmétique décimale. Aucune
 * évaluation de code : ni eval, ni Function, ni interprétation dynamique.
 */

export class ExpressionError extends Error {
  constructor(code, details = {}) {
    super(code);
    this.name = 'ExpressionError';
    this.code = code;
    this.details = details;
  }
}

/** Constantes nommées utilisables dans une expression. */
const CONSTANTS = {
  pi: PI,
  'π': PI,
  e: D('2.718281828459045235360287471352662497757'),
};

/** Fonctions à un argument. Toutes opèrent sur des Decimal. */
const FUNCTIONS = {
  sqrt: (x) => {
    if (x.isNegative()) throw new ExpressionError('MATH_DOMAIN', { fn: 'sqrt' });
    return x.sqrt();
  },
  cbrt: (x) => x.cbrt(),
  abs: (x) => x.abs(),
  ln: (x) => {
    if (x.lessThanOrEqualTo(0)) throw new ExpressionError('MATH_DOMAIN', { fn: 'ln' });
    return x.ln();
  },
  log: (x) => {
    if (x.lessThanOrEqualTo(0)) throw new ExpressionError('MATH_DOMAIN', { fn: 'log' });
    return x.log(10);
  },
  exp: (x) => x.exp(),
  sin: (x) => x.sin(),
  cos: (x) => x.cos(),
  tan: (x) => x.tan(),
  round: (x) => x.round(),
  floor: (x) => x.floor(),
  ceil: (x) => x.ceil(),
};

/**
 * Le signe unaire se place ENTRE la multiplication et la puissance.
 *
 * C'est la convention mathématique usuelle : « -2^2 » vaut -(2^2) = -4, et non
 * (-2)^2 = 4. Lier le signe plus fort que « ^ » donnerait la mauvaise réponse.
 */
const UNARY = { precedence: 3.5, associativity: 'right' };

const OPERATORS = {
  '+': { precedence: 2, associativity: 'left', apply: (a, b) => a.plus(b) },
  '-': { precedence: 2, associativity: 'left', apply: (a, b) => a.minus(b) },
  '*': { precedence: 3, associativity: 'left', apply: (a, b) => a.times(b) },
  '/': {
    precedence: 3,
    associativity: 'left',
    apply: (a, b) => {
      if (b.isZero()) throw new ExpressionError('DIVISION_BY_ZERO');
      return a.div(b);
    },
  },
  '^': {
    precedence: 4,
    associativity: 'right',
    apply: (a, b) => {
      if (a.isNegative() && !b.isInteger()) throw new ExpressionError('MATH_DOMAIN', { fn: '^' });
      return a.pow(b);
    },
  },
};

/** Une expression n'est reconnue comme telle que si elle contient un opérateur ou une fonction. */
const LOOKS_LIKE_EXPRESSION = /[+\-*/^()]|[a-zπ]/i;
/** Un nombre isolé, éventuellement signé et en notation scientifique. */
const PLAIN_NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/;

const MAX_LENGTH = 200;
const MAX_TOKENS = 200;

/** Retire les séparateurs de milliers et unifie le séparateur décimal. */
function normalize(raw) {
  let text = String(raw).trim().replace(/[\s   ']/g, '');

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  if (hasComma && hasDot) {
    text = text.lastIndexOf(',') > text.lastIndexOf('.')
      ? text.replace(/\./g, '').replace(/,/g, '.')
      : text.replace(/,/g, '');
  } else if (hasComma) {
    // Une virgule isolée est toujours un séparateur décimal ici : la fonction
    // ne prend qu'un seul argument, donc aucune ambiguïté avec une liste.
    text = text.replace(/,/g, '.');
  }

  // Les symboles de multiplication et de division usuels sont acceptés.
  return text.replace(/[×⋅∙]/g, '*').replace(/[÷∕]/g, '/');
}

/** Découpe l'expression en jetons. */
function tokenize(text) {
  const tokens = [];
  let index = 0;

  while (index < text.length) {
    const character = text[index];

    if (/\d|\./.test(character)) {
      const match = /^(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?/.exec(text.slice(index));
      if (!match) throw new ExpressionError('INVALID_EXPRESSION', { at: index });
      tokens.push({ type: 'number', value: D(match[0]) });
      index += match[0].length;
      continue;
    }

    if (/[a-zπ]/i.test(character)) {
      const match = /^[a-zπ]+/i.exec(text.slice(index));
      const name = match[0].toLowerCase();
      if (Object.hasOwn(FUNCTIONS, name)) tokens.push({ type: 'function', value: name });
      else if (Object.hasOwn(CONSTANTS, name)) tokens.push({ type: 'number', value: CONSTANTS[name] });
      else throw new ExpressionError('UNKNOWN_SYMBOL', { symbol: match[0] });
      index += match[0].length;
      continue;
    }

    if (Object.hasOwn(OPERATORS, character)) {
      // Un « + » ou « - » en tête, ou juste après un opérateur ou une parenthèse
      // ouvrante, est un signe et non une opération binaire.
      const previous = tokens[tokens.length - 1];
      const isSign = (character === '-' || character === '+')
        && (!previous
          || previous.type === 'operator'
          || previous.type === 'sign'
          || previous.type === 'function'
          || previous.value === '(');

      tokens.push(isSign ? { type: 'sign', value: character } : { type: 'operator', value: character });
      index += 1;
      continue;
    }

    if (character === '(' || character === ')') {
      tokens.push({ type: 'paren', value: character });
      index += 1;
      continue;
    }

    throw new ExpressionError('UNKNOWN_SYMBOL', { symbol: character });
  }

  if (tokens.length > MAX_TOKENS) throw new ExpressionError('EXPRESSION_TOO_COMPLEX');
  return tokens;
}

/** Convertit la suite de jetons en notation postfixée (shunting-yard). */
function toPostfix(tokens) {
  const output = [];
  const stack = [];

  for (const token of tokens) {
    if (token.type === 'number') {
      output.push(token);
    } else if (token.type === 'function') {
      stack.push(token);
    } else if (token.type === 'sign') {
      stack.push({ type: 'unary', value: token.value });
    } else if (token.type === 'operator') {
      const current = OPERATORS[token.value];
      while (stack.length) {
        const top = stack[stack.length - 1];
        if (top.type === 'function') { output.push(stack.pop()); continue; }

        const other = top.type === 'unary' ? UNARY : OPERATORS[top.value];
        if (!other) break; // parenthèse ouvrante

        const shouldPop = current.associativity === 'left'
          ? other.precedence >= current.precedence
          : other.precedence > current.precedence;
        if (!shouldPop) break;
        output.push(stack.pop());
      }
      stack.push(token);
    } else if (token.value === '(') {
      stack.push(token);
    } else {
      let matched = false;
      while (stack.length) {
        const top = stack.pop();
        if (top.type === 'paren' && top.value === '(') { matched = true; break; }
        output.push(top);
      }
      if (!matched) throw new ExpressionError('UNBALANCED_PARENTHESES');
      const top = stack[stack.length - 1];
      if (top && (top.type === 'function' || top.type === 'unary')) output.push(stack.pop());
    }
  }

  while (stack.length) {
    const top = stack.pop();
    if (top.type === 'paren') throw new ExpressionError('UNBALANCED_PARENTHESES');
    output.push(top);
  }

  return output;
}

/** Évalue la forme postfixée. */
function evaluate(postfix) {
  const stack = [];

  for (const token of postfix) {
    if (token.type === 'number') {
      stack.push(token.value);
    } else if (token.type === 'unary') {
      const operand = stack.pop();
      if (operand === undefined) throw new ExpressionError('INVALID_EXPRESSION');
      stack.push(token.value === '-' ? operand.negated() : operand);
    } else if (token.type === 'function') {
      const operand = stack.pop();
      if (operand === undefined) throw new ExpressionError('INVALID_EXPRESSION');
      stack.push(FUNCTIONS[token.value](operand));
    } else {
      const right = stack.pop();
      const left = stack.pop();
      if (left === undefined || right === undefined) throw new ExpressionError('INVALID_EXPRESSION');
      stack.push(OPERATORS[token.value].apply(left, right));
    }
  }

  if (stack.length !== 1) throw new ExpressionError('INVALID_EXPRESSION');

  const result = stack[0];
  if (!result.isFinite()) throw new ExpressionError('NOT_FINITE');
  return result;
}

/** Une saisie mérite-t-elle de passer par l'évaluateur ? */
export function isExpression(raw) {
  const text = normalize(raw ?? '');
  if (text === '') return false;
  if (PLAIN_NUMBER.test(text)) return false;
  return LOOKS_LIKE_EXPRESSION.test(text);
}

/**
 * Évalue une expression et renvoie un Decimal.
 * @throws {ExpressionError}
 */
export function evaluateExpression(raw) {
  const text = normalize(raw ?? '');
  if (text === '') throw new ExpressionError('INVALID_EXPRESSION');
  if (text.length > MAX_LENGTH) throw new ExpressionError('EXPRESSION_TOO_LONG');

  const value = evaluate(toPostfix(tokenize(text)));

  // Une expression qui explose en taille reste refusée, comme une saisie simple.
  if (!value.isZero() && Math.abs(value.e) > 300) throw new ExpressionError('EXPRESSION_OUT_OF_RANGE');
  return value;
}

export { Decimal };
