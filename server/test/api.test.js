import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';

import { createApp } from '../src/app.js';

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
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
  return { status: response.status, body: await response.json() };
};

// ---------------------------------------------------------------------------

test('GET /api/health répond', async () => {
  const { status, body } = await get('/api/health');
  assert.equal(status, 200);
  assert.equal(body.status, 'ok');
  assert.ok(body.categories > 0);
  assert.ok(body.units > 0);
});

test('GET /api/categories renvoie le catalogue en français par défaut', async () => {
  const { status, body } = await get('/api/categories');
  assert.equal(status, 200);
  assert.equal(body.lang, 'fr');

  const length = body.categories.find((category) => category.id === 'length');
  assert.equal(length.name, 'Longueur');
  assert.ok(length.units.some((unit) => unit.id === 'ft' && unit.name === 'pied'));
  // Aucun objet Decimal ne doit fuir vers le client.
  assert.equal(JSON.stringify(body).includes('"s":'), false);
});

test('GET /api/categories?lang=en bascule la langue', async () => {
  const { body } = await get('/api/categories?lang=en');
  assert.equal(body.lang, 'en');

  const length = body.categories.find((category) => category.id === 'length');
  assert.equal(length.name, 'Length');
  assert.ok(length.units.some((unit) => unit.id === 'ft' && unit.name === 'foot'));
});

test('les symboles propres à une langue sont bien localisés', async () => {
  const fr = await get('/api/categories/data?lang=fr');
  const en = await get('/api/categories/data?lang=en');

  const frGigabyte = fr.body.category.units.find((unit) => unit.id === 'GB');
  const enGigabyte = en.body.category.units.find((unit) => unit.id === 'GB');

  assert.equal(frGigabyte.symbol, 'Go');
  assert.equal(enGigabyte.symbol, 'GB');
});

test('une langue non gérée retombe sur le français', async () => {
  const { body } = await get('/api/categories?lang=de');
  assert.equal(body.lang, 'fr');
});

test('GET /api/categories/:id sur une catégorie inconnue renvoie 404', async () => {
  const { status, body } = await get('/api/categories/licorne');
  assert.equal(status, 404);
  assert.equal(body.error.code, 'UNKNOWN_CATEGORY');
  assert.match(body.error.message, /licorne/);
});

test('POST /api/convert effectue la conversion attendue', async () => {
  const { status, body } = await post('/api/convert', {
    category: 'length', from: 'ft', to: 'm', value: '100', precision: 6,
  });

  assert.equal(status, 200);
  assert.equal(body.result.text, '30.48');
  assert.equal(body.ratio.text, '0.3048');
  assert.equal(body.all.length > 0, true);
});

test('GET /api/convert rend une conversion partageable par URL', async () => {
  const { status, body } = await get('/api/convert?category=volume&from=L&to=gal_us&value=20&precision=6');
  assert.equal(status, 200);
  assert.equal(body.result.text, '5.28344');
});

test('les champs obligatoires manquants renvoient 400', async () => {
  for (const field of ['category', 'from', 'to', 'value']) {
    const payload = { category: 'length', from: 'ft', to: 'm', value: '1' };
    delete payload[field];

    const { status, body } = await post('/api/convert', payload);
    assert.equal(status, 400, `champ manquant : ${field}`);
    assert.equal(body.error.code, 'MISSING_FIELD');
    assert.equal(body.error.details.field, field);
  }
});

test('une valeur non numérique renvoie 400 avec un message lisible', async () => {
  const { status, body } = await post('/api/convert', {
    category: 'length', from: 'ft', to: 'm', value: '1.2.3',
  });
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_VALUE');
  assert.match(body.error.message, /1\.2\.3/);
});

test('les messages d’erreur suivent la langue demandée', async () => {
  const fr = await post('/api/convert?lang=fr', { category: 'length', from: 'ft', to: 'm', value: '1.2.3' });
  const en = await post('/api/convert?lang=en', { category: 'length', from: 'ft', to: 'm', value: '1.2.3' });

  assert.match(fr.body.error.message, /n’est pas un nombre valide/);
  assert.match(en.body.error.message, /is not a valid number/);
});

test('un avertissement accompagne les températures impossibles', async () => {
  const { body } = await post('/api/convert', {
    category: 'temperature', from: 'C', to: 'F', value: '-500', precision: 6,
  });
  assert.equal(body.warnings.length, 1);
  assert.equal(body.warnings[0].code, 'BELOW_ABSOLUTE_ZERO');
  assert.match(body.warnings[0].message, /zéro absolu/);
});

test('un corps JSON malformé renvoie 400 et non 500', async () => {
  const { status, body } = await post('/api/convert', '{ ceci n’est pas du JSON');
  assert.equal(status, 400);
  assert.equal(body.error.code, 'INVALID_JSON');
});

test('une route inconnue renvoie un 404 JSON', async () => {
  const { status, body } = await get('/api/nexistepas');
  assert.equal(status, 404);
  assert.equal(body.error.code, 'NOT_FOUND');
});

test('l’en-tête X-Powered-By n’est pas exposé', async () => {
  const response = await fetch(`${origin}/api/health`);
  assert.equal(response.headers.get('x-powered-by'), null);
});

test('CORS est activé pour le client de développement', async () => {
  const response = await fetch(`${origin}/api/health`, { headers: { Origin: 'http://localhost:5173' } });
  assert.equal(response.headers.get('access-control-allow-origin'), '*');
});
