import test from 'node:test';
import assert from 'node:assert/strict';

import {
  stepValue, formatNumberText, canonicalizeInput, splitValues, toCsv, compositeText,
} from '../src/utils/number.js';

// ---------------------------------------------------------------------------
// Réglage de la valeur au clavier
// ---------------------------------------------------------------------------

test('les flèches ajoutent et retranchent le pas demandé', () => {
  assert.equal(stepValue('5', 1), '6');
  assert.equal(stepValue('5', -1), '4');
  assert.equal(stepValue('0', -1), '-1');
  assert.equal(stepValue('-3', -1), '-4');
  assert.equal(stepValue('100', 10), '110');
});

test('le pas décimal reste exact', () => {
  // En virgule flottante, 0,3 - 0,1 donne 0,19999999999999998.
  assert.equal(stepValue('0.3', -0.1), '0.2');
  assert.equal(stepValue('0.1', 0.1), '0.2');
  assert.equal(stepValue('0.7', 0.1), '0.8');
  assert.equal(stepValue('1.1', 0.1), '1.2');

  // Dix pas de 0,1 depuis zéro doivent retomber exactement sur 1.
  let value = '0';
  for (let index = 0; index < 10; index += 1) value = stepValue(value, 0.1);
  assert.equal(value, '1.0');
});

test('le séparateur décimal de l’utilisateur est conservé', () => {
  assert.equal(stepValue('1,5', 0.1), '1,6');
  assert.equal(stepValue('1,5', -0.1), '1,4');
  assert.equal(stepValue('1.5', 0.1), '1.6');
  assert.equal(stepValue('2', 0.1), '2.1');
});

test('le nombre de décimales affichées reste stable', () => {
  // Utile quand la touche reste enfoncée : l'écriture ne doit pas sauter.
  assert.equal(stepValue('1.50', 0.1), '1.60');
  assert.equal(stepValue('5', 1), '6');
  assert.equal(stepValue('5.0', 1), '6.0');
});

test('un champ vide démarre à zéro', () => {
  assert.equal(stepValue('', 1), '1');
  assert.equal(stepValue('   ', -1), '-1');
  assert.equal(stepValue(null, 1), '1');
});

test('les séparateurs de milliers sont acceptés', () => {
  assert.equal(stepValue('1 234', 1), '1235');
  assert.equal(stepValue('1 234', 1), '1235'); // espace insécable
});

test('ce qui n’est pas un nombre simple ne s’incrémente pas', () => {
  // Une expression garde sa forme : l'incrémenter n'aurait pas de sens.
  for (const input of ['2*3', '(1+2)', 'sqrt(4)', 'abc', '1.2.3', '1e5', '--5']) {
    assert.equal(stepValue(input, 1), null, `« ${input} » ne devrait pas s’incrémenter`);
  }
});

test('les magnitudes non représentables sont refusées plutôt que faussées', () => {
  assert.equal(stepValue('9007199254740993', 1), null);
  assert.equal(stepValue('0.00000000000000001', 0.1), null);
});

// ---------------------------------------------------------------------------
// Mise en forme locale
// ---------------------------------------------------------------------------

test('la mise en forme suit la convention de la locale', () => {
  const fr = formatNumberText('1234567.89', 'fr-CA');
  assert.equal(fr.decimal, ',');
  assert.equal(fr.fraction, '89');
  // Le francais groupe par espace insecable, dont la nature exacte depend de
  // la version d'ICU : on verifie donc la structure, pas le caractere precis.
  assert.equal(fr.integer.replace(/\s| | /gu, ''), '1234567');
  assert.notEqual(fr.integer, '1234567');

  const en = formatNumberText('1234567.89', 'en-CA');
  assert.equal(en.decimal, '.');
  assert.equal(en.integer, '1,234,567');
});

test('les séparateurs de milliers peuvent être désactivés', () => {
  const grouped = formatNumberText('1234567', 'en-CA', { grouping: true });
  const plain = formatNumberText('1234567', 'en-CA', { grouping: false });
  assert.equal(grouped.integer, '1,234,567');
  assert.equal(plain.integer, '1234567');
});

test('le signe négatif est typographique et l’exposant est séparé', () => {
  const negative = formatNumberText('-42', 'fr-CA');
  assert.equal(negative.sign, '−'); // U+2212, pas le trait d'union

  const scientific = formatNumberText('1.5e-9', 'fr-CA');
  assert.equal(scientific.exponent, '−9');
  assert.equal(scientific.integer, '1');

  const positiveExponent = formatNumberText('1.5e+21', 'fr-CA');
  assert.equal(positiveExponent.exponent, '21');
});

test('une valeur absente ne produit pas de texte', () => {
  for (const empty of [null, undefined, '']) {
    assert.equal(formatNumberText(empty, 'fr-CA').plain, '');
  }
});

// ---------------------------------------------------------------------------
// Utilitaires de saisie et d'export
// ---------------------------------------------------------------------------

test('la saisie locale est ramenée à une forme canonique', () => {
  assert.equal(canonicalizeInput('1 234,56'), '1234.56');
  assert.equal(canonicalizeInput('1 234,56'), '1234.56');
  assert.equal(canonicalizeInput('42'), '42');
});

test('un collage est découpé en valeurs', () => {
  assert.deepEqual(splitValues('1\n2\n3'), ['1', '2', '3']);
  assert.deepEqual(splitValues('1; 2; 3'), ['1', '2', '3']);
  assert.deepEqual(splitValues('1\t2\t3'), ['1', '2', '3']);
  assert.deepEqual(splitValues('  1 \n\n 2  '), ['1', '2']);
  assert.deepEqual(splitValues(''), []);
});

test('le CSV échappe ce qui doit l’être', () => {
  const csv = toCsv(['a', 'b'], [['1', 'deux;trois'], ['guillemet "x"', '4']]);
  assert.match(csv, /"deux;trois"/);
  assert.match(csv, /"guillemet ""x"""/);
  assert.match(csv, /\r\n/);
});

test('l’écriture composée est rendue avec ses symboles', () => {
  const units = [{ id: 'ft', symbol: 'pi' }, { id: 'in', symbol: 'po' }];
  const composite = { negative: false, parts: [{ unit: 'ft', value: '5' }, { unit: 'in', value: '8.9' }] };
  assert.equal(compositeText(composite, units, 'fr-CA'), '5 pi 8,9 po');

  const negative = { negative: true, parts: [{ unit: 'ft', value: '5' }] };
  assert.equal(compositeText(negative, units, 'fr-CA'), '−5 pi');

  assert.equal(compositeText(null, units, 'fr-CA'), '');
});
