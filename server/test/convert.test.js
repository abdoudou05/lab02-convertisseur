import test from 'node:test';
import assert from 'node:assert/strict';

import Decimal from 'decimal.js';
import { CATEGORIES, getCategory, getUnit } from '../src/units/definitions.js';
import { D } from '../src/units/constants.js';
import {
  convert, ratio, toBase, fromBase, parseNumericInput, ConversionError,
} from '../src/units/convert.js';
import { formatDecimal } from '../src/units/format.js';

// ---------------------------------------------------------------------------
// Utilitaires de test
// ---------------------------------------------------------------------------

/** Texte du résultat d'une conversion, à la précision demandée. */
const text = (category, from, to, value, precision = 20) =>
  convert({ category, from, to, value, precision }).result.text;

/** Résultat numérique d'une conversion. */
const num = (category, from, to, value) =>
  convert({ category, from, to, value, precision: 20 }).result.number;

/** Écart relatif entre deux nombres, tolérant le cas zéro. */
function assertClose(actual, expected, relativeTolerance, label) {
  const difference = Math.abs(actual - expected);
  const scale = Math.max(Math.abs(expected), Number.MIN_VALUE);
  const relative = expected === 0 ? difference : difference / scale;
  assert.ok(
    relative <= relativeTolerance,
    `${label} : attendu ≈ ${expected}, obtenu ${actual} (écart relatif ${relative})`,
  );
}

// ---------------------------------------------------------------------------
// 1. Intégrité structurelle des définitions
// ---------------------------------------------------------------------------

test('chaque catégorie est structurellement valide', () => {
  const seenCategoryIds = new Set();

  for (const category of CATEGORIES) {
    assert.ok(!seenCategoryIds.has(category.id), `identifiant de catégorie dupliqué : ${category.id}`);
    seenCategoryIds.add(category.id);

    assert.ok(category.units.length >= 2, `${category.id} doit exposer au moins deux unités`);
    assert.ok(['affine', 'reciprocal'].includes(category.kind), `${category.id} : type inconnu`);
    assert.ok(category.name.fr && category.name.en, `${category.id} : nom bilingue manquant`);

    const seenUnitIds = new Set();
    for (const unit of category.units) {
      assert.ok(!seenUnitIds.has(unit.id), `unité dupliquée : ${category.id}/${unit.id}`);
      seenUnitIds.add(unit.id);

      assert.ok(unit.name.fr && unit.name.en, `${category.id}/${unit.id} : nom bilingue manquant`);
      assert.ok(unit.symbol, `${category.id}/${unit.id} : symbole manquant`);

      if (category.kind === 'reciprocal' && unit.mode === 'inverse') {
        assert.ok(unit.constant instanceof Decimal, `${category.id}/${unit.id} : constante manquante`);
        assert.ok(unit.constant.greaterThan(0), `${category.id}/${unit.id} : constante non positive`);
      } else {
        assert.ok(unit.factor instanceof Decimal, `${category.id}/${unit.id} : facteur non décimal`);
        assert.ok(unit.factor.greaterThan(0), `${category.id}/${unit.id} : facteur non positif`);
        assert.ok(unit.factor.isFinite(), `${category.id}/${unit.id} : facteur non fini`);
      }
    }

    // L'unité de base doit exister et être neutre.
    const base = getUnit(category.id, category.base);
    assert.ok(base, `${category.id} : unité de base « ${category.base} » introuvable`);
    if (category.kind === 'affine') {
      assert.ok(base.factor.equals(1), `${category.id} : le facteur de l'unité de base doit valoir 1`);
      assert.ok((base.offset ?? D(0)).isZero(), `${category.id} : le décalage de l'unité de base doit être nul`);
    }

    // La paire par défaut doit être utilisable telle quelle.
    const [defaultFrom, defaultTo] = category.defaultPair;
    assert.ok(getUnit(category.id, defaultFrom), `${category.id} : paire par défaut invalide (${defaultFrom})`);
    assert.ok(getUnit(category.id, defaultTo), `${category.id} : paire par défaut invalide (${defaultTo})`);
    assert.notEqual(defaultFrom, defaultTo, `${category.id} : la paire par défaut doit comporter deux unités distinctes`);
  }
});

// ---------------------------------------------------------------------------
// 2. Valeurs exactes par définition internationale
//    Ces égalités sont EXACTES : tout écart signale une faute de facteur.
// ---------------------------------------------------------------------------

test('longueur, égalités exactes', () => {
  assert.equal(text('length', 'ft', 'm', 1), '0.3048');
  assert.equal(text('length', 'in', 'cm', 1), '2.54');
  assert.equal(text('length', 'yd', 'm', 1), '0.9144');
  assert.equal(text('length', 'mi', 'km', 1), '1.609344');
  assert.equal(text('length', 'nmi', 'm', 1), '1852');
  assert.equal(text('length', 'm', 'cm', 1), '100');
  assert.equal(text('length', 'ly', 'm', 1), '9460730472580800');
  assert.equal(text('length', 'au', 'm', 1), '149597870700');
});

test('longueur, le pied vers le mètre, cas emblématique du laboratoire', () => {
  assert.equal(text('length', 'ft', 'm', 100, 6), '30.48');
  assertClose(num('length', 'm', 'ft', 1), 3.280839895013123, 1e-15, 'm → pi');
});

test('masse, égalités exactes', () => {
  assert.equal(text('mass', 'lb', 'kg', 1), '0.45359237');
  assert.equal(text('mass', 'oz', 'g', 1), '28.349523125');
  assert.equal(text('mass', 'st', 'lb', 1), '14');
  assert.equal(text('mass', 'ton_us', 'lb', 1), '2000');
  assert.equal(text('mass', 'ton_uk', 'lb', 1), '2240');
  assert.equal(text('mass', 'gr', 'lb', 7000), '1');
  assert.equal(text('mass', 't', 'kg', 1), '1000');
  assert.equal(text('mass', 'ct', 'mg', 1), '200');
  assertClose(num('mass', 'kg', 'lb', 1), 2.2046226218487757, 1e-15, 'kg → lb');
});

test('volume, égalités exactes', () => {
  assert.equal(text('volume', 'gal_us', 'L', 1), '3.785411784');
  assert.equal(text('volume', 'gal_uk', 'L', 1), '4.54609');
  assert.equal(text('volume', 'gal_us', 'floz_us', 1), '128');
  assert.equal(text('volume', 'gal_uk', 'floz_uk', 1), '160');
  assert.equal(text('volume', 'qt_us', 'pt_us', 1), '2');
  assert.equal(text('volume', 'cup_us', 'tbsp_us', 1), '16');
  assert.equal(text('volume', 'tbsp_us', 'tsp_us', 1), '3');
  assert.equal(text('volume', 'bbl', 'gal_us', 1), '42');
  assert.equal(text('volume', 'm3', 'L', 1), '1000');
  assert.equal(text('volume', 'cup_metric', 'mL', 1), '250');
  assert.equal(text('volume', 'ft3', 'L', 1), '28.316846592');
});

test('volume, litres vers gallons, second exemple du laboratoire', () => {
  assertClose(num('volume', 'L', 'gal_us', 1), 0.2641720523581484, 1e-15, 'L → gal US');
  assertClose(num('volume', 'L', 'gal_uk', 1), 0.21996924829908778, 1e-15, 'L → gal imp.');
});

test('température, les points de repère physiques', () => {
  assert.equal(text('temperature', 'C', 'F', 0), '32');
  assert.equal(text('temperature', 'C', 'F', 100), '212');
  assert.equal(text('temperature', 'C', 'F', -40), '-40');
  assert.equal(text('temperature', 'F', 'C', -40), '-40');
  assert.equal(text('temperature', 'C', 'K', 0), '273.15');
  assert.equal(text('temperature', 'K', 'C', 0), '-273.15');
  assert.equal(text('temperature', 'F', 'C', 98.6), '37');
  assert.equal(text('temperature', 'K', 'R', 1), '1.8');
  assert.equal(text('temperature', 'R', 'F', 0), '-459.67');
  // Le point triple de l'eau, référence historique de l'échelle Kelvin.
  assert.equal(text('temperature', 'K', 'C', 273.16), '0.01');
});

test('température, le décalage n’est jamais traité comme un simple facteur', () => {
  // Piège classique : 0 °C ne vaut pas 0 °F, et doubler l'entrée ne double pas la sortie.
  assert.notEqual(text('temperature', 'C', 'F', 0), '0');
  assert.equal(text('temperature', 'C', 'F', 10), '50');
  assert.equal(text('temperature', 'C', 'F', 20), '68');
});

test('superficie, égalités exactes', () => {
  assert.equal(text('area', 'ft2', 'm2', 1), '0.09290304');
  assert.equal(text('area', 'in2', 'm2', 1), '0.00064516');
  assert.equal(text('area', 'ac', 'm2', 1), '4046.8564224');
  assert.equal(text('area', 'ac', 'yd2', 1), '4840');
  assert.equal(text('area', 'mi2', 'ac', 1), '640');
  assert.equal(text('area', 'ha', 'm2', 1), '10000');
  assert.equal(text('area', 'km2', 'ha', 1), '100');
  assertClose(num('area', 'ha', 'ac', 1), 2.4710538146716536, 1e-15, 'ha → ac');
});

test('vitesse, égalités exactes', () => {
  assert.equal(text('speed', 'kn', 'kmh', 1), '1.852');
  assert.equal(text('speed', 'mph', 'm_s', 1), '0.44704');
  assert.equal(text('speed', 'kmh', 'm_s', 3.6), '1');
  assert.equal(text('speed', 'c', 'm_s', 1), '299792458');
  assertClose(num('speed', 'kmh', 'mph', 100), 62.13711922373339, 1e-14, '100 km/h → mi/h');
});

test('temps, égalités exactes', () => {
  assert.equal(text('time', 'h', 'min', 1), '60');
  assert.equal(text('time', 'd', 'h', 1), '24');
  assert.equal(text('time', 'wk', 'd', 1), '7');
  assert.equal(text('time', 'a', 'd', 1), '365.2425');
  assert.equal(text('time', 'mo', 'd', 1), '30.436875');
  assert.equal(text('time', 'a', 'mo', 1), '12');
});

test('pression, égalités et valeurs de référence', () => {
  assert.equal(text('pressure', 'atm', 'Pa', 1), '101325');
  assert.equal(text('pressure', 'bar', 'kPa', 1), '100');
  assert.equal(text('pressure', 'atm', 'torr', 1), '760');
  assert.equal(text('pressure', 'inHg', 'mmHg', 1), '25.4');
  // Valeurs publiées (NIST SP 811), comparées à la précision qu'elles affichent.
  assertClose(num('pressure', 'atm', 'psi', 1), 14.695948775513449, 1e-14, 'atm → psi');
  assertClose(num('pressure', 'bar', 'psi', 1), 14.50377377, 1e-9, 'bar → psi');
  assertClose(num('pressure', 'psi', 'Pa', 1), 6894.757293, 1e-9, 'psi → Pa');
  assertClose(num('pressure', 'psi', 'kPa', 32), 220.6322334, 1e-9, '32 psi → kPa');
});

test('pression, le torr et le mmHg ne sont pas confondus', () => {
  const torr = convert({ category: 'pressure', from: 'torr', to: 'Pa', value: 1, precision: 12 });
  const mmHg = convert({ category: 'pressure', from: 'mmHg', to: 'Pa', value: 1, precision: 12 });
  assert.notEqual(torr.result.text, mmHg.result.text);
  assertClose(torr.result.number, 133.32236842105263, 1e-14, 'torr → Pa');
  assert.equal(mmHg.result.text, '133.322387415');
});

test('énergie, égalités exactes', () => {
  assert.equal(text('energy', 'kWh', 'MJ', 1), '3.6');
  assert.equal(text('energy', 'kWh', 'J', 1), '3600000');
  assert.equal(text('energy', 'kcal', 'kJ', 1), '4.184');
  assert.equal(text('energy', 'cal', 'J', 1), '4.184');
  assert.equal(text('energy', 'BTU', 'J', 1), '1055.05585262');
  assert.equal(text('energy', 'Wh', 'J', 1), '3600');
  assertClose(num('energy', 'eV', 'J', 1), 1.602176634e-19, 1e-15, 'eV → J');
  assertClose(num('energy', 'ftlb', 'J', 1), 1.3558179483314004, 1e-15, 'pi·lbf → J');
});

test('puissance, égalités et valeurs de référence', () => {
  assert.equal(text('power', 'kW', 'W', 1), '1000');
  assert.equal(text('power', 'ch', 'W', 1), '735.49875');
  assertClose(num('power', 'hp', 'W', 1), 745.6998715822702, 1e-14, 'hp → W');
  assertClose(num('power', 'hp', 'ch', 1), 1.013869665, 1e-9, 'hp → ch');
  assertClose(num('power', 'btu_h', 'W', 1), 0.2930710701722222, 1e-14, 'BTU/h → W');
});

test('données numériques, décimal contre binaire', () => {
  assert.equal(text('data', 'B', 'bit', 1), '8');
  assert.equal(text('data', 'kB', 'B', 1), '1000');
  assert.equal(text('data', 'KiB', 'B', 1), '1024');
  assert.equal(text('data', 'GiB', 'MB', 1), '1073.741824');
  assert.equal(text('data', 'TiB', 'GiB', 1), '1024');
  // Le fameux écart entre le disque « 1 To » vendu et les « 931 Gio » affichés.
  assertClose(num('data', 'TB', 'TiB', 1), 0.9094947017729282, 1e-15, 'To → Tio');
  assertClose(num('data', 'GB', 'GiB', 1), 0.9313225746154785, 1e-15, 'Go → Gio');
});

test('angle, égalités exactes', () => {
  assert.equal(text('angle', 'turn', 'deg', 1), '360');
  assert.equal(text('angle', 'deg', 'arcmin', 1), '60');
  assert.equal(text('angle', 'arcmin', 'arcsec', 1), '60');
  assert.equal(text('angle', 'turn', 'gon', 1), '400');
  assert.equal(text('angle', 'rad', 'mrad', 1), '1000');
  assertClose(num('angle', 'deg', 'rad', 180), Math.PI, 1e-15, '180° → rad');
  assertClose(num('angle', 'rad', 'deg', 1), 57.29577951308232, 1e-14, 'rad → °');
});

// ---------------------------------------------------------------------------
// 3. Propriétés invariantes, vérifiées sur TOUTES les paires d'unités
// ---------------------------------------------------------------------------

test('propriété, convertir une unité vers elle-même est neutre', () => {
  for (const category of CATEGORIES) {
    for (const unit of category.units) {
      const output = convert({
        category: category.id, from: unit.id, to: unit.id, value: '12.5', precision: 20,
      });
      assertClose(output.result.number, 12.5, 1e-24, `${category.id}/${unit.id} → lui-même`);
    }
  }
});

test('propriété, tout aller-retour A → B → A restitue la valeur d’origine', () => {
  const samples = [D('1'), D('0.001'), D('7.25'), D('-3.5'), D('123456.789')];

  for (const category of CATEGORIES) {
    for (const from of category.units) {
      for (const to of category.units) {
        for (const sample of samples) {
          // Les catégories à rapport inverse rejettent zéro et les négatifs.
          if (category.kind === 'reciprocal' && sample.lessThanOrEqualTo(0)) continue;

          const base = toBase(from, sample, category.kind);
          const target = fromBase(to, base, category.kind);
          const roundTrip = fromBase(from, toBase(to, target, category.kind), category.kind);

          const drift = roundTrip.minus(sample).abs()
            .div(sample.abs().greaterThan(0) ? sample.abs() : D(1));
          assert.ok(
            drift.lessThan('1e-30'),
            `${category.id} : ${from.id} → ${to.id} → ${from.id} dérive de ${drift} (départ ${sample})`,
          );
        }
      }
    }
  }
});

test('propriété, la conversion est monotone croissante', () => {
  for (const category of CATEGORIES) {
    for (const from of category.units) {
      for (const to of category.units) {
        const low = convert({ category: category.id, from: from.id, to: to.id, value: '10', precision: 20 });
        const high = convert({ category: category.id, from: from.id, to: to.id, value: '20', precision: 20 });
        const expectDecreasing = category.kind === 'reciprocal'
          && ((from.mode === 'inverse') !== (to.mode === 'inverse'));

        if (expectDecreasing) {
          assert.ok(high.result.number < low.result.number,
            `${category.id} : ${from.id} → ${to.id} devrait décroître`);
        } else {
          assert.ok(high.result.number > low.result.number,
            `${category.id} : ${from.id} → ${to.id} devrait croître`);
        }
      }
    }
  }
});

test('propriété, la transitivité est respectée (A → B → C équivaut à A → C)', () => {
  for (const category of CATEGORIES) {
    const [a, b, c] = category.units;
    if (!c) continue;

    const direct = convert({ category: category.id, from: a.id, to: c.id, value: '42', precision: 20 });
    const viaB = convert({ category: category.id, from: a.id, to: b.id, value: '42', precision: 20 });
    const then = convert({ category: category.id, from: b.id, to: c.id, value: viaB.result.raw, precision: 20 });

    assertClose(then.result.number, direct.result.number, 1e-18,
      `${category.id} : ${a.id} → ${b.id} → ${c.id}`);
  }
});

test('propriété, le tableau « toutes les unités » concorde avec la conversion directe', () => {
  for (const category of CATEGORIES) {
    const [from] = category.defaultPair;
    const output = convert({ category: category.id, from, to: category.base, value: '3.7', precision: 12 });

    assert.equal(output.all.length, category.units.length);
    for (const row of output.all) {
      const direct = convert({ category: category.id, from, to: row.unit, value: '3.7', precision: 12 });
      assert.equal(row.text, direct.result.text, `${category.id}/${row.unit} : tableau et calcul direct divergent`);
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Lecture des saisies utilisateur
// ---------------------------------------------------------------------------

test('la saisie accepte les conventions française et anglaise', () => {
  assert.equal(parseNumericInput('12,5').decimal.toString(), '12.5');
  assert.equal(parseNumericInput('12.5').decimal.toString(), '12.5');
  assert.equal(parseNumericInput('1 234,56').decimal.toString(), '1234.56');
  assert.equal(parseNumericInput('1 234,56').decimal.toString(), '1234.56'); // espace insécable
  assert.equal(parseNumericInput('1 234,56').decimal.toString(), '1234.56'); // espace fine insécable
  assert.equal(parseNumericInput('1,234.56').decimal.toString(), '1234.56');
  assert.equal(parseNumericInput('  -7.25  ').decimal.toString(), '-7.25');
  assert.equal(parseNumericInput('1e3').decimal.toString(), '1000');
  assert.equal(parseNumericInput('.5').decimal.toString(), '0.5');
  assert.equal(parseNumericInput('+3').decimal.toString(), '3');
  assert.equal(parseNumericInput(42).decimal.toString(), '42');
});

test('la saisie rejette ce qui n’est pas un nombre', () => {
  // Ni un nombre, ni une expression évaluable.
  const rejected = ['', '   ', 'abc', '1.2.3', '12a', 'Infinity', 'NaN', '0x10', '1e', '((1+2)'];
  for (const input of rejected) {
    assert.throws(() => parseNumericInput(input), ConversionError, `« ${input} » aurait dû être rejeté`);
  }
  assert.throws(() => parseNumericInput('9'.repeat(65)), ConversionError, 'saisie trop longue');
  assert.throws(() => parseNumericInput(Number.NaN), ConversionError);
  assert.throws(() => parseNumericInput(Number.POSITIVE_INFINITY), ConversionError);
  assert.throws(() => parseNumericInput(null), ConversionError);
  assert.throws(() => parseNumericInput({}), ConversionError);
});

test('la saisie accepte une expression arithmétique', () => {
  const value = (input) => parseNumericInput(input).decimal.toString();

  assert.equal(value('1/2'), '0.5');
  assert.equal(value('12*3+4'), '40');
  assert.equal(value('(5+3)/2'), '4');
  assert.equal(value('2^10'), '1024');
  assert.equal(value('-3*-4'), '12');
  assert.equal(value('sqrt(144)'), '12');
  assert.equal(value('abs(-7.5)'), '7.5');
  assert.equal(value('10-2-3'), '5');            // associativité à gauche
  assert.equal(value('2^3^2'), '512');           // associativité à droite
  assert.equal(value('1 234,5 + 0,5'), '1235');  // séparateurs français

  // L'expression est signalée dans la charge utile.
  assert.equal(parseNumericInput('6*7').expression, '6*7');
  assert.equal(parseNumericInput('42').expression, null);
});

test('les conversions acceptent une expression comme valeur', () => {
  const output = convert({ category: 'length', from: 'ft', to: 'm', value: '3*100', precision: 6 });
  assert.equal(output.input.text, '300');
  assert.equal(output.input.expression, '3*100');
  assert.equal(output.result.text, '91.44');
  assert.ok(output.warnings.some((warning) => warning.code === 'EXPRESSION_EVALUATED'));
});

// ---------------------------------------------------------------------------
// 5. Mise en forme et précision
// ---------------------------------------------------------------------------

test('la précision demandée est respectée', () => {
  assert.equal(text('length', 'm', 'ft', 1, 3), '3.28');
  assert.equal(text('length', 'm', 'ft', 1, 6), '3.28084');
  assert.equal(text('length', 'm', 'ft', 1, 10), '3.280839895');
  assert.equal(text('temperature', 'C', 'F', 37, 4), '98.6');
});

test('la mise en forme évite les artefacts de la virgule flottante', () => {
  // 0,1 + 0,2 en binaire donne 0,30000000000000004 ; le calcul décimal, non.
  assert.equal(text('length', 'm', 'cm', '0.003', 6), '0.3');
  assert.equal(text('temperature', 'C', 'F', 100, 15), '212');
  assert.equal(formatDecimal(D('0.30000000000000004'), { precision: 6 }).text, '0.3');
  assert.equal(formatDecimal(D(0), { precision: 6 }).text, '0');
});

test('la notation scientifique prend le relais aux extrêmes', () => {
  const tiny = formatDecimal(D('0.00000001234'), { precision: 4 });
  assert.ok(tiny.exponential);
  assert.match(tiny.text, /e-8$/);

  const huge = formatDecimal(D('1.234e22'), { precision: 4 });
  assert.ok(huge.exponential);

  const ordinary = formatDecimal(D('1234.5'), { precision: 6 });
  assert.equal(ordinary.exponential, false);
  assert.equal(ordinary.text, '1234.5');

  // Sous le seuil de 1e21, la forme développée reste lisible et est conservée.
  const large = formatDecimal(D('9460730472580800'), { precision: 20 });
  assert.equal(large.exponential, false);
  assert.equal(large.text, '9460730472580800');
});

test('la précision hors bornes est refusée', () => {
  for (const precision of [0, -1, 21, 2.5, 'beaucoup']) {
    assert.throws(
      () => convert({ category: 'length', from: 'm', to: 'ft', value: 1, precision }),
      ConversionError,
      `précision « ${precision} » aurait dû être refusée`,
    );
  }
});

// ---------------------------------------------------------------------------
// 6. Erreurs et avertissements
// ---------------------------------------------------------------------------

test('les catégories et unités inconnues renvoient une erreur identifiable', () => {
  assert.throws(
    () => convert({ category: 'licorne', from: 'm', to: 'ft', value: 1 }),
    (error) => error.code === 'UNKNOWN_CATEGORY' && error.status === 404,
  );
  assert.throws(
    () => convert({ category: 'length', from: 'parsec', to: 'm', value: 1 }),
    (error) => error.code === 'UNKNOWN_UNIT' && error.status === 404,
  );
  assert.throws(
    () => convert({ category: 'length', from: 'm', to: 'kg', value: 1 }),
    (error) => error.code === 'UNKNOWN_UNIT',
  );
});

test('une température sous le zéro absolu est signalée sans bloquer le calcul', () => {
  const impossible = convert({ category: 'temperature', from: 'C', to: 'F', value: -300, precision: 6 });
  assert.equal(impossible.warnings.length, 1);
  assert.equal(impossible.warnings[0].code, 'BELOW_ABSOLUTE_ZERO');
  assert.equal(impossible.result.text, '-508');

  const ordinary = convert({ category: 'temperature', from: 'C', to: 'F', value: 20, precision: 6 });
  assert.equal(ordinary.warnings.length, 0);

  // Exactement 0 K est la limite : atteignable, donc non signalée.
  const limit = convert({ category: 'temperature', from: 'K', to: 'C', value: 0, precision: 6 });
  assert.equal(limit.warnings.length, 0);
});

test('les autres catégories n’émettent pas d’avertissement sur les négatifs', () => {
  const output = convert({ category: 'length', from: 'm', to: 'ft', value: -5, precision: 6 });
  assert.equal(output.warnings.length, 0);
  assert.equal(output.result.number < 0, true);
});

// ---------------------------------------------------------------------------
// 7. Facteur de conversion affiché
// ---------------------------------------------------------------------------

test('le facteur « 1 unité = n unités » est exact', () => {
  assert.equal(ratio({ category: 'length', from: 'ft', to: 'm', precision: 20 }).text, '0.3048');
  assert.equal(ratio({ category: 'volume', from: 'gal_us', to: 'L', precision: 20 }).text, '3.785411784');
  assert.equal(ratio({ category: 'mass', from: 'lb', to: 'kg', precision: 20 }).text, '0.45359237');
});

test('le facteur n’est pas proposé quand il n’a pas de sens', () => {
  // Une échelle affine n'a pas de facteur unique : 1 °C ne « vaut » pas n °F.
  assert.equal(ratio({ category: 'temperature', from: 'C', to: 'F', precision: 6 }), null);
});

// ---------------------------------------------------------------------------
// 8. Charge utile complète
// ---------------------------------------------------------------------------

test('la réponse contient tout ce dont l’interface a besoin', () => {
  const output = convert({ category: 'length', from: 'ft', to: 'm', value: '100', precision: 6 });

  assert.equal(output.category, 'length');
  assert.equal(output.from, 'ft');
  assert.equal(output.to, 'm');
  assert.equal(output.precision, 6);
  assert.equal(output.input.text, '100');
  assert.equal(output.result.text, '30.48');
  assert.equal(output.result.number, 30.48);
  assert.equal(typeof output.result.raw, 'string');
  assert.equal(output.result.exponential, false);
  assert.equal(Array.isArray(output.all), true);
  assert.equal(Array.isArray(output.warnings), true);

  const category = getCategory('length');
  assert.equal(output.all.length, category.units.length);
});
