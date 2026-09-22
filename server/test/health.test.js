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

for (const route of ['/health', '/api/health']) {
  test(`GET ${route} expose un rapport de santé complet`, async () => {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    const body = await response.json();
    assert.equal(body.status, 'ok');
    assert.equal(typeof body.revision, 'string');
    assert.ok(body.uptime >= 0);
    assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
    assert.ok(body.categories > 0 && body.units > 0);
  });
}
