import test from 'node:test';
import assert from 'node:assert/strict';

import { D } from '../src/units/constants.js';
import {
  formatDecimal, toFraction, toComposite, FormatError,
  normalizeNotation, normalizeRounding, normalizePrecisionMode,
} from '../src/units/format.js';
import { convert } from '../src/units/convert.js';
import { getUnit } from '../src/units/definitions.js';

const render = (input, options) => formatDecimal(D(input), options).text;

// ---------------------------------------------------------------------------
// Notation
// ---------------------------------------------------------------------------

test('la notation « auto » bascule aux extrêmes seulement', () => {
  assert.equal(render('1234.5', { precision: 6 }), '1234.5');
  assert.equal(render('9460730472580800', { precision: 20 }), '9460730472580800');
  assert.equal(formatDecimal(D('1e21'), { precision: 6 }).exponential, true);
  assert.equal(formatDecimal(D('1e-7'), { precision: 6 }).exponential, true);
  assert.equal(formatDecimal(D('1e-6'), { precision: 6 }).exponential, false);
});

test('la notation « plain » ne bascule jamais', () => {
  const output = formatDecimal(D('1.23e-9'), { precision: 3, notation: 'plain' });
  assert.equal(output.exponential, false);
  assert.equal(output.text, '0.00000000123');
});

test('la notation scientifique est toujours normalisée', () => {
  assert.equal(render('1234.5', { precision: 5, notation: 'scientific' }), '1.2345e+3');
  assert.equal(render('0.00042', { precision: 2, notation: 'scientific' }), '4.2e-4');
});

test('la notation d’ingénieur utilise des exposants multiples de trois', () => {
  assert.equal(render('1234.5', { precision: 4, notation: 'engineering' }), '1.235e+3');
  assert.equal(render('12345', { precision: 5, notation: 'engineering' }), '12.345e+3');
  assert.equal(render('0.00042', { precision: 3, notation: 'engineering' }), '420e-6');
  assert.equal(render('999', { precision: 3, notation: 'engineering' }), '999e+0');
});

// ---------------------------------------------------------------------------
// Précision et arrondi
// ---------------------------------------------------------------------------

test('le mode « decimals » fixe le nombre de décimales', () => {
  assert.equal(render('3.14159', { precision: 2, precisionMode: 'decimals' }), '3.14');
  assert.equal(render('3.14159', { precision: 0, precisionMode: 'decimals' }), '3');
  assert.equal(render('1234.5678', { precision: 3, precisionMode: 'decimals' }), '1234.568');
});

test('le mode « significant » fixe le nombre de chiffres significatifs', () => {
  assert.equal(render('3.14159', { precision: 3 }), '3.14');
  assert.equal(render('0.000314159', { precision: 3 }), '0.000314');
  assert.equal(render('1234.5678', { precision: 3 }), '1230');
});

test('chaque mode d’arrondi se comporte comme annoncé', () => {
  const at = (input, rounding) => render(input, { precision: 0, precisionMode: 'decimals', rounding });

  assert.equal(at('2.5', 'half-up'), '3');
  assert.equal(at('3.5', 'half-up'), '4');
  assert.equal(at('2.5', 'half-even'), '2');
  assert.equal(at('3.5', 'half-even'), '4');
  assert.equal(at('2.5', 'half-down'), '2');
  assert.equal(at('2.1', 'up'), '3');
  assert.equal(at('2.9', 'down'), '2');
  assert.equal(at('2.9', 'truncate'), '2');
  assert.equal(at('-2.9', 'truncate'), '-2');
  assert.equal(at('-2.1', 'down'), '-3');
  assert.equal(at('-2.9', 'up'), '-2');
});

test('les réglages hors bornes sont refusés', () => {
  assert.throws(() => normalizeNotation('logarithmic'), FormatError);
  assert.throws(() => normalizeRounding('vers-le-haut'), FormatError);
  assert.throws(() => normalizePrecisionMode('exact'), FormatError);
  assert.equal(normalizeNotation(''), 'auto');
  assert.equal(normalizeRounding(undefined), 'half-up');
  assert.equal(normalizePrecisionMode(null), 'significant');
});

// ---------------------------------------------------------------------------
// Fractions
// ---------------------------------------------------------------------------

test('les fractions sont réduites au plus petit dénominateur', () => {
  assert.equal(toFraction(D('0.5'), 16).text, '1/2');
  assert.equal(toFraction(D('0.25'), 16).text, '1/4');
  assert.equal(toFraction(D('0.375'), 16).text, '3/8');
  assert.equal(toFraction(D('8.375'), 16).text, '8 3/8');
  assert.equal(toFraction(D('0.0625'), 16).text, '1/16');
  assert.equal(toFraction(D('2'), 16).text, '2');
});

test('les fractions gèrent le signe et l’arrondi au plus proche', () => {
  assert.equal(toFraction(D('-3.75'), 16).text, '-3 3/4');
  assert.equal(toFraction(D('-0.5'), 2).text, '-1/2');
  // 0,333 arrondi au seizième le plus proche donne 5/16.
  assert.equal(toFraction(D('0.333'), 16).text, '5/16');
  // La retenue doit remonter sur la partie entière.
  assert.equal(toFraction(D('1.97'), 16).text, '2');
});

test('une fraction signale si elle est exacte', () => {
  assert.equal(toFraction(D('0.375'), 16).exact, true);
  assert.equal(toFraction(D('0.333'), 16).exact, false);
  assert.equal(toFraction(D('7'), 16).exact, true);
});

test('un dénominateur invalide est refusé', () => {
  assert.throws(() => toFraction(D('1.5'), 0), FormatError);
  assert.throws(() => toFraction(D('1.5'), 1), FormatError);
  assert.throws(() => toFraction(D('1.5'), 3.5), FormatError);
});

// ---------------------------------------------------------------------------
// Écriture composée
// ---------------------------------------------------------------------------

const steps = (categoryId, ids) => ids.map((id) => getUnit(categoryId, id));

test('une longueur se décompose en pieds et pouces', () => {
  const composite = toComposite(D('1.75'), steps('length', ['ft', 'in']), { precision: 2 });
  assert.equal(composite.negative, false);
  assert.equal(composite.parts[0].unit, 'ft');
  assert.equal(composite.parts[0].value, '5');
  assert.equal(composite.parts[1].unit, 'in');
  // 1,75 m = 68,8976... po, soit 5 pi et 8,9 po.
  assert.equal(composite.parts[1].value, '8.9');
});

test('une durée se décompose en heures, minutes et secondes', () => {
  const composite = toComposite(D('3661'), steps('time', ['h', 'min', 's']), { precision: 0 });
  assert.deepEqual(
    composite.parts.map((part) => `${part.value} ${part.unit}`),
    ['1 h', '1 min', '1 s'],
  );
});

test('les unités de tête nulles sont omises', () => {
  const composite = toComposite(D('0.2'), steps('length', ['ft', 'in']), { precision: 1 });
  assert.equal(composite.parts.length, 1);
  assert.equal(composite.parts[0].unit, 'in');
});

test('le signe est porté une seule fois, en tête', () => {
  const composite = toComposite(D('-3661'), steps('time', ['h', 'min', 's']), { precision: 0 });
  assert.equal(composite.negative, true);
  assert.ok(composite.parts.every((part) => !part.value.startsWith('-')));
});

test('la somme des parties reconstitue la valeur d’origine', () => {
  const units = steps('length', ['ft', 'in']);
  const composite = toComposite(D('12.3456'), units, { precision: 8 });

  const total = composite.parts.reduce(
    (sum, part) => sum.plus(D(part.value).times(units.find((unit) => unit.id === part.unit).factor)),
    D(0),
  );
  assert.ok(total.minus(D('12.3456')).abs().lessThan('1e-6'), `reconstitution : ${total}`);
});

// ---------------------------------------------------------------------------
// Intégration dans une conversion complète
// ---------------------------------------------------------------------------

test('une conversion expose l’écriture composée de sa catégorie', () => {
  const output = convert({ category: 'length', from: 'm', to: 'ft', value: '1.75', precision: 4 });
  assert.equal(output.composite.id, 'ft_in');
  assert.equal(output.composite.parts[0].unit, 'ft');
  assert.equal(output.composite.parts[0].value, '5');
});

test('l’écriture composée peut être désactivée ou choisie', () => {
  assert.equal(
    convert({ category: 'length', from: 'm', to: 'ft', value: '1.75', composite: 'none' }).composite,
    null,
  );
  assert.equal(
    convert({ category: 'length', from: 'm', to: 'ft', value: '1.75', composite: 'm_cm_mm' }).composite.id,
    'm_cm_mm',
  );
});

test('la température n’a pas d’écriture composée', () => {
  // Décomposer une échelle avec décalage n'aurait aucun sens physique.
  assert.equal(convert({ category: 'temperature', from: 'C', to: 'F', value: '20' }).composite, null);
});

test('une conversion peut renvoyer une fraction impériale', () => {
  const output = convert({
    category: 'length', from: 'mm', to: 'in', value: '212.725', precision: 6, fraction: 16,
  });
  // 212,725 mm = 8,375 po exactement, soit 8 3/8 po.
  assert.equal(output.result.text, '8.375');
  assert.equal(output.result.fraction.text, '8 3/8');
  assert.equal(output.result.fraction.exact, true);
});

test('les zéros de queue sont retirés de l’écriture composée', () => {
  // 1 pi tout rond doit se lire « 1 pi », pas « 1 pi 0 po ».
  const exact = toComposite(D('0.3048'), steps('length', ['ft', 'in']), { precision: 2 });
  assert.equal(exact.parts.length, 1);
  assert.equal(exact.parts[0].unit, 'ft');
  assert.equal(exact.parts[0].value, '1');

  // Une heure pile se lit « 1 h ».
  const hour = toComposite(D('3600'), steps('time', ['h', 'min', 's']), { precision: 0 });
  assert.deepEqual(hour.parts.map((part) => `${part.value} ${part.unit}`), ['1 h']);

  // Mais une valeur intermédiaire nulle est conservée : « 1 h 0 min 5 s ».
  const gap = toComposite(D('3605'), steps('time', ['h', 'min', 's']), { precision: 0 });
  assert.deepEqual(gap.parts.map((part) => `${part.value} ${part.unit}`), ['1 h', '0 min', '5 s']);

  // Zéro reste affichable.
  const zero = toComposite(D('0'), steps('length', ['ft', 'in']), { precision: 2 });
  assert.equal(zero.parts.length, 1);
  assert.equal(zero.parts[0].value, '0');
});
