import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/app.js';
import { convert, convertBatch, buildTable, parseNumericInput, ConversionError } from '../src/units/convert.js';

const text = (category, from, to, value, precision = 20) =>
  convert({ category, from, to, value, precision }).result.text;

const num = (category, from, to, value) =>
  convert({ category, from, to, value, precision: 20 }).result.number;

function assertClose(actual, expected, tolerance, label) {
  const relative = Math.abs(actual - expected) / Math.abs(expected);
  assert.ok(relative <= tolerance, `${label} : attendu ≈ ${expected}, obtenu ${actual}`);
}

// ---------------------------------------------------------------------------
// Nouvelles catégories linéaires
// ---------------------------------------------------------------------------

test('force, égalités exactes', () => {
  assert.equal(text('force', 'lbf', 'N', 1), '4.4482216152605');
  assert.equal(text('force', 'kgf', 'N', 1), '9.80665');
  assert.equal(text('force', 'kN', 'N', 1), '1000');
  assert.equal(text('force', 'dyn', 'N', 1), '0.00001');
  assert.equal(text('force', 'kip', 'lbf', 1), '1000');
  assert.equal(text('force', 'lbf', 'ozf', 1), '16');
  assert.equal(text('force', 'pdl', 'N', 1), '0.138254954376');
});

test('couple, égalités exactes', () => {
  assert.equal(text('torque', 'lbf_ft', 'Nm', 1), '1.3558179483314004');
  assert.equal(text('torque', 'lbf_ft', 'lbf_in', 1), '12');
  assert.equal(text('torque', 'kgfm', 'Nm', 1), '9.80665');
  assert.equal(text('torque', 'Nm', 'Ncm', 1), '100');
  assert.equal(text('torque', 'lbf_in', 'ozf_in', 1), '16');
  // Couple de serrage courant : 100 N·m vaut environ 73,76 lbf·pi.
  assertClose(num('torque', 'Nm', 'lbf_ft', 100), 73.75621492772654, 1e-13, '100 N·m → lbf·pi');
});

test('fréquence, égalités exactes', () => {
  assert.equal(text('frequency', 'rpm', 'Hz', 60), '1');
  assert.equal(text('frequency', 'Hz', 'rpm', 1), '60');
  assert.equal(text('frequency', 'kHz', 'Hz', 1), '1000');
  assert.equal(text('frequency', 'GHz', 'MHz', 1), '1000');
  assert.equal(text('frequency', 'deg_s', 'rpm', 360), '60');
  // 1 Hz correspond à 2π radians par seconde.
  assertClose(num('frequency', 'Hz', 'rad_s', 1), 2 * Math.PI, 1e-15, 'Hz → rad/s');
});

test('débit de données, le bit et l’octet ne sont pas confondus', () => {
  assert.equal(text('datarate', 'MB_s', 'Mbit_s', 1), '8');
  assert.equal(text('datarate', 'B_s', 'bit_s', 1), '8');
  assert.equal(text('datarate', 'Gbit_s', 'Mbit_s', 1), '1000');
  assert.equal(text('datarate', 'MiB_s', 'Mbit_s', 1), '8.388608');
  // Un lien à 100 Mbit/s transfère au mieux 12,5 Mo/s.
  assert.equal(text('datarate', 'Mbit_s', 'MB_s', 100), '12.5');
});

test('accélération, égalités exactes', () => {
  assert.equal(text('acceleration', 'g0', 'm_s2', 1), '9.80665');
  assert.equal(text('acceleration', 'm_s2', 'Gal', 1), '100');
  assert.equal(text('acceleration', 'Gal', 'mGal', 1), '1000');
  assert.equal(text('acceleration', 'ft_s2', 'in_s2', 1), '12');
  assert.equal(text('acceleration', 'km_h_s', 'm_s2', 36), '10');
  // 60 mi/h valent exactement 88 pi/s, donc 15 mi/h/s valent 22 pi/s².
  assert.equal(text('acceleration', 'mph_s', 'ft_s2', 15), '22');
});

test('accélération, repères concrets', () => {
  // La pesanteur normale exprimée en pieds par seconde carrée.
  assertClose(num('acceleration', 'g0', 'ft_s2', 1), 32.174048556430446, 1e-15, 'g₀ → pi/s²');
  // Un 0 à 100 km/h en 3 s correspond à une accélération moyenne d'environ 0,94 g.
  assertClose(num('acceleration', 'km_h_s', 'g0', 100 / 3), 0.9441816786832669, 1e-12, '0 à 100 km/h en 3 s → g₀');
  // L'anomalie gravimétrique typique se mesure en milligals.
  assert.equal(text('acceleration', 'mGal', 'm_s2', 1), '0.00001');
});

test('masse volumique, égalités exactes et références', () => {
  assert.equal(text('density', 'g_cm3', 'kg_m3', 1), '1000');
  assert.equal(text('density', 'kg_L', 'kg_m3', 1), '1000');
  // L'eau : 1 g/cm³, soit environ 62,43 lb/pi³.
  assertClose(num('density', 'g_cm3', 'lb_ft3', 1), 62.42796057614461, 1e-13, 'g/cm³ → lb/pi³');
  // Valeur publiée à sept chiffres significatifs, comparée à cette précision.
  assertClose(num('density', 'g_cm3', 'lb_gal_us', 1), 8.345404, 1e-7, 'g/cm³ → lb/gal US');
});

// ---------------------------------------------------------------------------
// Consommation : la seule catégorie à rapport inverse
// ---------------------------------------------------------------------------

test('consommation, les équivalences de référence', () => {
  assert.equal(text('fuel', 'l_100km', 'km_L', 100), '1');
  assert.equal(text('fuel', 'km_L', 'l_100km', 1), '100');
  assert.equal(text('fuel', 'l_100km', 'km_L', 10), '10');

  // 235,2145833... est la constante bien connue des tableaux de conversion.
  assertClose(num('fuel', 'mpg_us', 'l_100km', 1), 235.21458333333335, 1e-13, '1 mpg US → L/100 km');
  assertClose(num('fuel', 'mpg_uk', 'l_100km', 1), 282.481, 1e-6, '1 mpg imp. → L/100 km');

  // Une berline à 30 mpg US consomme environ 7,84 L/100 km.
  assertClose(num('fuel', 'mpg_us', 'l_100km', 30), 7.840486111111112, 1e-13, '30 mpg US → L/100 km');
  // Le gallon impérial étant plus grand, le même chiffre en mpg imp. consomme moins.
  assert.ok(num('fuel', 'mpg_uk', 'l_100km', 30) > num('fuel', 'mpg_us', 'l_100km', 30));
});

test('consommation, la relation est bien décroissante', () => {
  // Doubler les mpg divise par deux la consommation.
  const at30 = num('fuel', 'mpg_us', 'l_100km', 30);
  const at60 = num('fuel', 'mpg_us', 'l_100km', 60);
  assertClose(at60, at30 / 2, 1e-14, 'doubler les mpg');

  // Deux unités inverses entre elles restent croissantes.
  assert.ok(num('fuel', 'mpg_us', 'mpg_uk', 60) > num('fuel', 'mpg_us', 'mpg_uk', 30));
});

test('consommation, zéro et négatifs sont refusés', () => {
  for (const value of ['0', '-5', '0.0']) {
    assert.throws(
      () => convert({ category: 'fuel', from: 'mpg_us', to: 'l_100km', value }),
      (error) => error.code === 'POSITIVE_VALUE_REQUIRED',
      `« ${value} » aurait dû être refusé`,
    );
  }
});

test('consommation, aucun facteur constant n’est proposé', () => {
  // Le rapport dépend de la valeur : annoncer « 1 mpg = n L/100 km » serait faux.
  assert.equal(convert({ category: 'fuel', from: 'mpg_us', to: 'l_100km', value: '30' }).ratio, null);
  assert.equal(convert({ category: 'fuel', from: 'mpg_us', to: 'l_100km', value: '30' }).composite, null);
});

// ---------------------------------------------------------------------------
// Unités personnalisées
// ---------------------------------------------------------------------------

const HAND = { id: 'hand', symbol: 'hh', name: 'main', factor: '0.1016' };

test('une unité personnalisée est utilisable comme n’importe quelle autre', () => {
  // La « main », unité équestre : 4 pouces exactement.
  const output = convert({
    category: 'length', from: 'hand', to: 'in', value: '16', precision: 20, extraUnits: [HAND],
  });
  assert.equal(output.result.text, '64');
  assert.ok(output.all.some((row) => row.unit === 'hand'));
});

test('une unité personnalisée peut aussi être la cible', () => {
  const output = convert({
    category: 'length', from: 'm', to: 'hand', value: '1.6256', precision: 20, extraUnits: [HAND],
  });
  assert.equal(output.result.text, '16');
});

test('les unités personnalisées invalides sont refusées', () => {
  const rejected = [
    { id: '', symbol: 'x', factor: '1' },
    { id: 'bad id', symbol: 'x', factor: '1' },
    { id: 'ok', symbol: 'x', factor: '0' },
    { id: 'ok', symbol: 'x', factor: '-1' },
    { id: 'ok', symbol: 'x', factor: 'abc' },
    { id: 'ok', symbol: 'x' },
  ];

  for (const unit of rejected) {
    assert.throws(
      () => convert({ category: 'length', from: 'm', to: 'ft', value: '1', extraUnits: [unit] }),
      ConversionError,
      `${JSON.stringify(unit)} aurait dû être refusée`,
    );
  }
});

test('une unité personnalisée ne peut pas masquer une unité officielle', () => {
  assert.throws(
    () => convert({
      category: 'length', from: 'm', to: 'ft', value: '1',
      extraUnits: [{ id: 'ft', symbol: 'pi', factor: '999' }],
    }),
    (error) => error.code === 'CUSTOM_UNIT_CONFLICT',
  );
});

test('les catégories non linéaires refusent les unités personnalisées', () => {
  for (const category of ['temperature', 'fuel']) {
    assert.throws(
      () => convert({
        category, from: category === 'fuel' ? 'mpg_us' : 'C', to: category === 'fuel' ? 'km_L' : 'F',
        value: '10', extraUnits: [HAND],
      }),
      (error) => error.code === 'CUSTOM_UNIT_UNSUPPORTED',
      `${category} aurait dû refuser`,
    );
  }
});

// ---------------------------------------------------------------------------
// Conversion par lot
// ---------------------------------------------------------------------------

test('un lot convertit chaque valeur avec les mêmes réglages', () => {
  const output = convertBatch({
    category: 'length', from: 'ft', to: 'm', values: ['1', '2', '10', '100'], precision: 6,
  });

  assert.equal(output.count, 4);
  assert.equal(output.converted, 4);
  assert.deepEqual(output.rows.map((row) => row.text), ['0.3048', '0.6096', '3.048', '30.48']);
});

test('un lot isole les valeurs fautives sans faire échouer le reste', () => {
  const output = convertBatch({
    category: 'length', from: 'ft', to: 'm', values: ['1', 'abc', '3', '1.2.3'], precision: 6,
  });

  assert.equal(output.count, 4);
  assert.equal(output.converted, 2);
  assert.equal(output.rows[0].text, '0.3048');
  assert.ok(output.rows[1].error);
  assert.equal(output.rows[2].text, '0.9144');
  assert.ok(output.rows[3].error);
});

test('un lot accepte les expressions et les formats français', () => {
  const output = convertBatch({
    category: 'length', from: 'ft', to: 'm', values: ['2*5', '1 000', '3,5'], precision: 6,
  });
  assert.deepEqual(output.rows.map((row) => row.text), ['3.048', '304.8', '1.0668']);
});

test('les lots vides ou démesurés sont refusés', () => {
  assert.throws(
    () => convertBatch({ category: 'length', from: 'ft', to: 'm', values: [] }),
    (error) => error.code === 'EMPTY_BATCH',
  );
  assert.throws(
    () => convertBatch({ category: 'length', from: 'ft', to: 'm', values: new Array(501).fill('1') }),
    (error) => error.code === 'BATCH_TOO_LARGE',
  );
});

// ---------------------------------------------------------------------------
// Table de référence
// ---------------------------------------------------------------------------

test('une table de référence suit le départ, le pas et le nombre demandés', () => {
  const table = buildTable({
    category: 'length', from: 'ft', to: 'm', start: '1', step: '1', count: 5, precision: 6,
  });

  assert.equal(table.count, 5);
  assert.deepEqual(table.rows.map((row) => row.inputFormatted), ['1', '2', '3', '4', '5']);
  assert.deepEqual(table.rows.map((row) => row.text), ['0.3048', '0.6096', '0.9144', '1.2192', '1.524']);
});

test('une table accepte un pas décimal et un départ négatif', () => {
  const table = buildTable({
    category: 'temperature', from: 'C', to: 'F', start: '-10', step: '5', count: 3, precision: 6,
  });
  assert.deepEqual(table.rows.map((row) => row.text), ['14', '23', '32']);
});

test('une table refuse les paramètres absurdes', () => {
  const base = { category: 'length', from: 'ft', to: 'm' };
  assert.throws(() => buildTable({ ...base, count: 0 }), (error) => error.code === 'INVALID_COUNT');
  assert.throws(() => buildTable({ ...base, count: 201 }), (error) => error.code === 'INVALID_COUNT');
  assert.throws(() => buildTable({ ...base, step: '0' }), (error) => error.code === 'INVALID_STEP');
});

// ---------------------------------------------------------------------------
// Routes HTTP correspondantes
// ---------------------------------------------------------------------------

let server;
let origin;

before(async () => {
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

const get = async (path) => {
  const response = await fetch(`${origin}${path}`);
  return { status: response.status, body: await response.json() };
};

const post = async (path, payload) => {
  const response = await fetch(`${origin}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
};

test('POST /api/convert/batch répond', async () => {
  const { status, body } = await post('/api/convert/batch', {
    category: 'mass', from: 'lb', to: 'kg', values: ['1', '10'], precision: 6,
  });
  assert.equal(status, 200);
  assert.deepEqual(body.rows.map((row) => row.text), ['0.453592', '4.53592']);
});

test('GET /api/table répond', async () => {
  const { status, body } = await get('/api/table?category=volume&from=L&to=gal_us&start=1&step=1&count=3&precision=6');
  assert.equal(status, 200);
  assert.equal(body.count, 3);
  assert.equal(body.rows[0].text, '0.264172');
});

test('GET /api/ratio répond', async () => {
  const { status, body } = await get('/api/ratio?category=length&from=ft&to=m&precision=20');
  assert.equal(status, 200);
  assert.equal(body.ratio.text, '0.3048');
});

test('le catalogue annonce les capacités de mise en forme', async () => {
  const { body } = await get('/api/categories');
  assert.ok(body.formatting.notations.includes('engineering'));
  assert.ok(body.formatting.roundingModes.includes('half-even'));
  assert.ok(body.formatting.fractionDenominators.includes(16));

  const length = body.categories.find((category) => category.id === 'length');
  assert.equal(length.supportsCustomUnits, true);
  assert.ok(length.composites.some((preset) => preset.id === 'ft_in'));

  const temperature = body.categories.find((category) => category.id === 'temperature');
  assert.equal(temperature.supportsCustomUnits, false);
  assert.equal(temperature.absoluteFloor, true);

  const fuel = body.categories.find((category) => category.id === 'fuel');
  assert.equal(fuel.positiveOnly, true);
  assert.equal(fuel.kind, 'reciprocal');
});

test('les unités personnalisées passent par l’URL en GET', async () => {
  const extra = encodeURIComponent(JSON.stringify([HAND]));
  const { status, body } = await get(
    `/api/convert?category=length&from=hand&to=in&value=16&precision=20&extraUnits=${extra}`,
  );
  assert.equal(status, 200);
  assert.equal(body.result.text, '64');
});

test('une conversion par expression renvoie l’avertissement correspondant', async () => {
  const { body } = await post('/api/convert', {
    category: 'length', from: 'ft', to: 'm', value: '3*100', precision: 6,
  });
  assert.equal(body.input.expression, '3*100');
  assert.equal(body.result.text, '91.44');
  assert.ok(body.warnings.some((warning) => warning.code === 'EXPRESSION_EVALUATED'));
});

test('une expression fautive renvoie un message explicite', async () => {
  const { status, body } = await post('/api/convert', {
    category: 'length', from: 'ft', to: 'm', value: '1/0',
  });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'DIVISION_BY_ZERO');
});

// ---------------------------------------------------------------------------
// Durcissement des entrées
// ---------------------------------------------------------------------------

test('la précision refuse les types qui se convertiraient en silence', () => {
  // Number(true) vaut 1 et Number([6]) vaut 6 : sans filtre de type, ces
  // saisies produiraient un résultat dégradé au lieu d'une erreur.
  for (const precision of [true, false, [6], {}, [], [6, 7]]) {
    assert.throws(
      () => convert({ category: 'length', from: 'ft', to: 'm', value: '1', precision }),
      (error) => error.code === 'INVALID_PRECISION',
      `précision ${JSON.stringify(precision)} aurait dû être refusée`,
    );
  }

  // Les formes légitimes restent acceptées.
  assert.equal(convert({ category: 'length', from: 'ft', to: 'm', value: '1', precision: 6 }).precision, 6);
  assert.equal(convert({ category: 'length', from: 'ft', to: 'm', value: '1', precision: '6' }).precision, 6);
});

test('les identifiants réservés sont refusés comme unités personnalisées', () => {
  for (const id of ['__proto__', 'constructor', 'prototype', 'PROTOTYPE']) {
    assert.throws(
      () => convert({
        category: 'length', from: 'm', to: 'ft', value: '1',
        extraUnits: [{ id, symbol: 'x', factor: '1' }],
      }),
      (error) => error.code === 'INVALID_CUSTOM_UNIT',
      `« ${id} » aurait dû être refusé`,
    );
  }

  // Aucun prototype n'a été atteint au passage.
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.factor, undefined);
});

test('un corps trop volumineux renvoie 413 et non 500', async () => {
  const response = await fetch(`${origin}/api/convert`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ category: 'length', from: 'ft', to: 'm', value: '1', pad: 'x'.repeat(20000) }),
  });
  const body = await response.json();

  assert.equal(response.status, 413);
  assert.equal(body.error.code, 'BODY_TOO_LARGE');
});

test('une table honore positiveOnly et annonce le nombre réel de lignes', () => {
  // Départ négatif sur une catégorie strictement positive : les lignes
  // impossibles sont écartées, et `count` reflète ce qui est vraiment renvoyé.
  const table = buildTable({
    category: 'fuel', from: 'mpg_us', to: 'l_100km', start: '-2', step: '1', count: 6, precision: 6,
  });
  assert.equal(table.count, table.rows.length);
  assert.equal(table.count, 3);
  assert.ok(table.rows.every((row) => Number(row.input) > 0));
});

test('l’évaluateur d’expressions reste rapide sur les entrées hostiles', () => {
  const hostile = [
    '('.repeat(60) + '1' + ')'.repeat(60),
    '9^9^2',
    'sin(999999999)',
    'exp(200)',
    'sqrt('.repeat(20) + '2' + ')'.repeat(20),
  ];

  const started = process.hrtime.bigint();
  for (const input of hostile) {
    try { parseNumericInput(input); } catch { /* refus accepté, seul le temps compte */ }
  }
  const elapsedMs = Number(process.hrtime.bigint() - started) / 1e6;

  assert.ok(elapsedMs < 500, `évaluation trop lente : ${elapsedMs.toFixed(1)} ms`);
});
