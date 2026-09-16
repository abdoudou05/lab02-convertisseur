import test from 'node:test';
import assert from 'node:assert/strict';

import { CATEGORY_ICONS } from '../src/components/categoryIcons.js';
import { CATEGORIES } from '../../server/src/units/definitions.js';

// Le catalogue du serveur est la source de vérité : une catégorie dont l'icône
// n'est pas associée retombe en silence sur l'icône générique. Ce test rend
// l'oubli visible au lieu de le laisser passer dans l'interface.

test('chaque catégorie du serveur a une icône associée', () => {
  const missing = CATEGORIES
    .filter((category) => !(category.icon in CATEGORY_ICONS))
    .map((category) => `${category.id} (${category.icon})`);

  assert.deepEqual(missing, [], `Icônes manquantes : ${missing.join(', ')}`);
});

test('chaque icône associée est un composant Material UI', () => {
  for (const [name, Icon] of Object.entries(CATEGORY_ICONS)) {
    assert.ok(Icon && typeof Icon === 'object' && '$$typeof' in Icon, `${name} n'est pas un composant React`);
  }
});

test('aucune icône associée n\'est orpheline', () => {
  const used = new Set(CATEGORIES.map((category) => category.icon));
  const orphans = Object.keys(CATEGORY_ICONS).filter((name) => !used.has(name));
  assert.deepEqual(orphans, [], `Icônes sans catégorie : ${orphans.join(', ')}`);
});
