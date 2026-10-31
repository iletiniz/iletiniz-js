// Çalıştırma: npm run build && npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { IletinizClient, IletinizError } from '../dist/esm/index.js';

function mockClient(response = {}, status = 200) {
  const calls = [];
  const fetch = async (url, init) => {
    calls.push({ url, init, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(response), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  };
  const client = new IletinizClient({ apiKey: 'iltz_test_abc', fetch, maxRetries: 2 });
  return { client, calls };
}

test('whatsappTemplate + sender + scheduledAt (Date) gövdeye doğru yazılır', async () => {
  const { client, calls } = mockClient({ scheduled_id: 7, status: 'scheduled' });
  const at = new Date('2026-11-05T06:00:00.000Z');
  const res = await client.messages.send({
    to: '+905551234567',
    provider: 'whatsapp',
    sender: '123456789012345',
    whatsappTemplate: {
      name: 'randevu_hatirlatma',
      language: 'tr',
      components: [{ type: 'body', parameters: [{ type: 'text', text: 'Ayşe' }] }],
    },
    scheduledAt: at,
  });
  assert.equal(res.scheduled_id, 7);
  assert.equal(calls[0].url, 'https://api.iletiniz.com/v1/messages');
  assert.equal(calls[0].body.scheduledAt, '2026-11-05T06:00:00.000Z');
  assert.equal(calls[0].body.sender, '123456789012345');
  assert.equal(calls[0].body.whatsappTemplate.name, 'randevu_hatirlatma');
});

test('body ile whatsappTemplate birlikte reddedilir', async () => {
  const { client } = mockClient();
  await assert.rejects(
    client.messages.send({
      to: '+905551234567',
      body: 'x',
      whatsappTemplate: { name: 'a', language: 'tr' },
    }),
    IletinizError,
  );
});

test('bulk: whatsappComponents yalnız whatsappTemplate ile', async () => {
  const { client, calls } = mockClient({ total: 1, sent: 1, failed: 0, results: [] });
  await assert.rejects(
    client.messages.sendBulk({
      items: [{ to: '+905551234567', body: 'x', whatsappComponents: [] }],
    }),
    IletinizError,
  );
  await client.messages.sendBulk({
    provider: 'whatsapp',
    whatsappTemplate: { name: 'kargo', language: 'tr' },
    items: [
      {
        to: '+905551234567',
        whatsappComponents: [{ type: 'body', parameters: [{ type: 'text', text: 'TR1' }] }],
      },
    ],
  });
  assert.equal(calls[0].url, 'https://api.iletiniz.com/v1/messages/bulk');
  assert.equal(calls[0].body.items[0].whatsappComponents[0].type, 'body');
});

test('scheduled list/cancel ve reminders CRUD yolları', async () => {
  const { client, calls } = mockClient({ data: [], limit: 10, offset: 0 });
  await client.scheduled.list({ status: 'scheduled', limit: 10 });
  await client.scheduled.cancel(5);
  await client.reminders.create({
    type: 'recurring',
    name: 'Haftalık',
    message: { to: '+905551234567', body: 'Merhaba' },
    frequency: 'weekly',
    timeOfDay: '09:30',
    dayOfWeek: 1,
  });
  await client.reminders.update(3, { status: 'paused' });
  await client.reminders.delete(3);
  assert.deepEqual(
    calls.map((c) => `${c.init.method} ${c.url}`),
    [
      'GET https://api.iletiniz.com/v1/scheduled?status=scheduled&limit=10',
      'DELETE https://api.iletiniz.com/v1/scheduled/5',
      'POST https://api.iletiniz.com/v1/reminders',
      'PATCH https://api.iletiniz.com/v1/reminders/3',
      'DELETE https://api.iletiniz.com/v1/reminders/3',
    ],
  );
  assert.throws(() =>
    client.reminders.create({
      type: 'recurring',
      name: 'x',
      message: { to: '+905551234567', body: 'y' },
      frequency: 'weekly',
      timeOfDay: '09:30',
    }),
  );
});

test('partner yolları ve kota aktarımı yeniden denenmez', async () => {
  const { client, calls } = mockClient({ error: { code: 'x', message: 'y' } }, 503);
  await assert.rejects(client.partner.transferQuota(12, 500), (e) => {
    // API zarfı {"error":{"code","message"}} çözülür.
    assert.equal(e.code, 'x');
    assert.equal(e.message, 'y');
    return true;
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://api.iletiniz.com/v1/partner/accounts/12/quota-transfers');
  assert.deepEqual(calls[0].body, { amount: 500 });

  const ok = mockClient({});
  await ok.client.partner.createAccount({ name: 'Klinik A', externalRef: 'k-1' });
  await ok.client.partner.createApiKey(12, { name: 'prod', test: true });
  await ok.client.partner.createWhatsappSignupLink(12);
  await ok.client.partner.suspendAccount(12);
  assert.deepEqual(
    ok.calls.map((c) => `${c.init.method} ${c.url}`),
    [
      'POST https://api.iletiniz.com/v1/partner/accounts',
      'POST https://api.iletiniz.com/v1/partner/accounts/12/api-keys',
      'POST https://api.iletiniz.com/v1/partner/accounts/12/whatsapp-signup',
      'POST https://api.iletiniz.com/v1/partner/accounts/12/suspend',
    ],
  );
});

test('partner: alt hesap API anahtarlarını listeler ve iptal eder', async () => {
  const key = {
    id: 7,
    name: 'prod',
    key_prefix: 'iltz_live_Ab',
    scopes: ['messages:send'],
    sandbox: false,
    source: 'partner',
    status: 'active',
    created_at: '2026-10-31T10:00:00.000Z',
    last_used_at: null,
    revoked_at: null,
  };
  const list = mockClient({ data: [key] });
  const res = await list.client.partner.listApiKeys(12);
  assert.equal(res.data[0].key_prefix, 'iltz_live_Ab');
  assert.equal(list.calls[0].init.method, 'GET');
  assert.equal(list.calls[0].url, 'https://api.iletiniz.com/v1/partner/accounts/12/api-keys');

  const revoke = mockClient({ ...key, status: 'revoked', revoked_at: '2026-10-31T11:00:00.000Z' });
  const revoked = await revoke.client.partner.revokeApiKey(12, 7);
  assert.equal(revoked.status, 'revoked');
  assert.equal(revoke.calls[0].init.method, 'DELETE');
  assert.equal(revoke.calls[0].url, 'https://api.iletiniz.com/v1/partner/accounts/12/api-keys/7');

  assert.throws(() => list.client.partner.listApiKeys(0));
  assert.throws(() => revoke.client.partner.revokeApiKey(12, -1));
});
