import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateExpression, isExpression, ExpressionError } from '../src/units/expression.js';
import { formatDecimal } from '../src/units/format.js';

const value = (input) => evaluateExpression(input).toString();
/** Résultat tel que l'interface l'afficherait, à la précision demandée. */
const display = (input, precision) => formatDecimal(evaluateExpression(input), { precision }).text;

// ---------------------------------------------------------------------------
// Reconnaissance
// ---------------------------------------------------------------------------

test('un nombre simple n’est pas traité comme une expression', () => {
  for (const input of ['42', '-3.5', '1e6', '0.001', '1 234,56', '+7', '.5']) {
    assert.equal(isExpression(input), false, `« ${input} » ne devrait pas être une expression`);
  }
});

test('une expression est reconnue à ses opérateurs ou à ses fonctions', () => {
  for (const input of ['1+1', '2*3', '10/4', '2^8', '(1+2)*3', 'sqrt(2)', 'pi', '-(-4)']) {
    assert.equal(isExpression(input), true, `« ${input} » devrait être une expression`);
  }
});

// ---------------------------------------------------------------------------
// Arithmétique
// ---------------------------------------------------------------------------

test('les quatre opérations sont exactes', () => {
  assert.equal(value('1+1'), '2');
  assert.equal(value('10-4'), '6');
  assert.equal(value('6*7'), '42');
  assert.equal(value('10/4'), '2.5');
});

test('les divisions non exactes restent invisibles à l’affichage', () => {
  // Aucun système décimal fini ne représente 1/3 exactement. L'écart se situe
  // au 50e chiffre : la précision d'affichage (20 au maximum) l'absorbe.
  assert.equal(display('1/3*3', 20), '1');
  assert.equal(display('sqrt(2)^2', 20), '2');
  assert.equal(display('10/3', 6), '3.33333');
});

test('l’arithmétique décimale évite les artefacts du binaire', () => {
  // 0,1 + 0,2 vaut 0,30000000000000004 en virgule flottante binaire.
  assert.equal(value('0.1+0.2'), '0.3');
  assert.equal(value('1.1*3'), '3.3');
  assert.equal(value('0.3-0.1'), '0.2');
});

test('les priorités et associativités sont respectées', () => {
  assert.equal(value('2+3*4'), '14');
  assert.equal(value('(2+3)*4'), '20');
  assert.equal(value('10-2-3'), '5');
  assert.equal(value('100/10/2'), '5');
  assert.equal(value('2^3^2'), '512');
  assert.equal(value('-2^2'), '-4');
  assert.equal(value('2*3+4*5'), '26');
});

test('les signes unaires sont gérés à toutes les positions', () => {
  assert.equal(value('-5'), '-5');
  assert.equal(value('-5+3'), '-2');
  assert.equal(value('3*-4'), '-12');
  assert.equal(value('-3*-4'), '12');
  assert.equal(value('-(3+4)'), '-7');
  assert.equal(value('+8'), '8');
  assert.equal(value('10--5'), '15');
});

test('les parenthèses imbriquées sont évaluées correctement', () => {
  assert.equal(value('((1+2)*(3+4))'), '21');
  assert.equal(value('2*(3+(4*(5-3)))'), '22');
});

test('les constantes et fonctions donnent les valeurs attendues', () => {
  assert.equal(value('sqrt(144)'), '12');
  assert.equal(value('abs(-7.5)'), '7.5');
  assert.equal(value('floor(3.9)'), '3');
  assert.equal(value('ceil(3.1)'), '4');
  assert.equal(value('round(3.5)'), '4');
  assert.equal(value('cbrt(27)'), '3');
  assert.equal(value('log(1000)'), '3');
  assert.equal(value('ln(1)'), '0');
  assert.match(value('pi'), /^3\.14159265358979/);
  assert.match(value('e'), /^2\.71828182845904/);
  assert.equal(value('2*pi/pi'), '2');
});

test('les séparateurs des deux langues sont acceptés', () => {
  assert.equal(value('1 234,5+0,5'), '1235');
  assert.equal(value('1,5*2'), '3');
  assert.equal(value('1.5*2'), '3');
  assert.equal(value('1 000*2'), '2000');
  // Symboles de multiplication et de division usuels.
  assert.equal(value('6×7'), '42');
  assert.equal(value('84÷2'), '42');
});

// ---------------------------------------------------------------------------
// Erreurs
// ---------------------------------------------------------------------------

test('les expressions mal formées sont refusées', () => {
  const rejected = ['1+', '*5', '(1+2', '1+2)', '()', '1++', 'sqrt()', '', '  '];
  for (const input of rejected) {
    assert.throws(() => evaluateExpression(input), ExpressionError, `« ${input} » aurait dû être refusé`);
  }
});

test('la division par zéro est signalée', () => {
  assert.throws(() => evaluateExpression('1/0'), (error) => error.code === 'DIVISION_BY_ZERO');
  assert.throws(() => evaluateExpression('5/(3-3)'), (error) => error.code === 'DIVISION_BY_ZERO');
});

test('les domaines mathématiques sont respectés', () => {
  assert.throws(() => evaluateExpression('sqrt(-1)'), (error) => error.code === 'MATH_DOMAIN');
  assert.throws(() => evaluateExpression('ln(0)'), (error) => error.code === 'MATH_DOMAIN');
  assert.throws(() => evaluateExpression('log(-5)'), (error) => error.code === 'MATH_DOMAIN');
});

test('les symboles inconnus sont signalés nommément', () => {
  assert.throws(
    () => evaluateExpression('2*foo'),
    (error) => error.code === 'UNKNOWN_SYMBOL' && error.details.symbol === 'foo',
  );
  assert.throws(() => evaluateExpression('1 & 2'), (error) => error.code === 'UNKNOWN_SYMBOL');
});

test('les parenthèses déséquilibrées sont signalées', () => {
  assert.throws(() => evaluateExpression('(1+2'), (error) => error.code === 'UNBALANCED_PARENTHESES');
  assert.throws(() => evaluateExpression('1+2)'), (error) => error.code === 'UNBALANCED_PARENTHESES');
});

test('les garde-fous de taille sont actifs', () => {
  assert.throws(
    () => evaluateExpression('1+'.repeat(150) + '1'),
    (error) => error.code === 'EXPRESSION_TOO_LONG' || error.code === 'EXPRESSION_TOO_COMPLEX',
  );
  assert.throws(
    () => evaluateExpression('10^400'),
    (error) => error.code === 'EXPRESSION_OUT_OF_RANGE',
  );
});

test('aucune évaluation de code n’a lieu', () => {
  // Ces chaînes seraient dangereuses avec eval ; ici elles sont simplement refusées.
  for (const input of ['process.exit(1)', 'require("fs")', 'globalThis', '1;2', '[].constructor']) {
    assert.throws(() => evaluateExpression(input), ExpressionError, `« ${input} » aurait dû être refusé`);
  }
});
