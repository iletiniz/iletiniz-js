# İletiniz JS / TS SDK

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Iletiniz API için resmi JavaScript ve TypeScript SDK'si. Node.js 18+ ve modern tarayıcılarda çalışır.

## Kurulum

```bash
npm install @iletiniz/sdk
# veya
pnpm add @iletiniz/sdk
# veya
yarn add @iletiniz/sdk
```

## Hızlı başlangıç

```ts
import { IletinizClient } from '@iletiniz/sdk';

const client = new IletinizClient({
  apiKey: process.env.ILETINIZ_API_KEY, // 'iltz_live_…' veya 'iltz_test_…'
});

const result = await client.messages.send({
  to: '+905551234567',
  body: 'Merhaba!',
});

console.log(result.job_id, result.status);
```

`apiKey` verilmediğinde SDK `ILETINIZ_API_KEY` ortam değişkenini okur.

## Yapılandırma

```ts
new IletinizClient({
  apiKey: 'iltz_live_…',
  baseUrl: 'https://api.iletiniz.com', // varsayılan
  timeoutMs: 30_000,                    // varsayılan
  maxRetries: 2,                        // 408/429/5xx ve ağ hatalarında
  defaultHeaders: { 'X-Source': 'crm' },
  fetch: globalThis.fetch,              // özel fetch implementasyonu
});
```

## Endpoint'ler

SDK, public API yüzeyini kapsar:

| Metot                                      | HTTP                              |
| ------------------------------------------ | --------------------------------- |
| `client.health.check()`                    | `GET /v1/health`                  |
| `client.messages.send(params)`             | `POST /v1/messages`               |
| `client.messages.sendBulk(params)`         | `POST /v1/messages/bulk`          |
| `client.messages.retrieve(jobId)`          | `GET /v1/messages/{jobId}`        |
| `client.messages.status(jobId)` (alias)    | `GET /v1/messages/{jobId}`        |
| `client.scheduled.list(params?)`           | `GET /v1/scheduled`               |
| `client.scheduled.retrieve(id)`            | `GET /v1/scheduled/{id}`          |
| `client.scheduled.cancel(id)`              | `DELETE /v1/scheduled/{id}`       |
| `client.reminders.create(params)`          | `POST /v1/reminders`              |
| `client.reminders.list(params?)`           | `GET /v1/reminders`               |
| `client.reminders.retrieve(id)`            | `GET /v1/reminders/{id}`          |
| `client.reminders.update(id, params)`      | `PATCH /v1/reminders/{id}`        |
| `client.reminders.delete(id)`              | `DELETE /v1/reminders/{id}`       |
| `client.partner.profile()`                 | `GET /v1/partner`                 |
| `client.partner.createAccount(params)`     | `POST /v1/partner/accounts`       |
| `client.partner.listAccounts(params?)`     | `GET /v1/partner/accounts`        |
| `client.partner.retrieveAccount(id)`       | `GET /v1/partner/accounts/{id}`   |
| `client.partner.suspendAccount(id)` / `unsuspendAccount(id)` | `POST /v1/partner/accounts/{id}/suspend` / `unsuspend` |
| `client.partner.createApiKey(id, params)`  | `POST /v1/partner/accounts/{id}/api-keys` |
| `client.partner.listApiKeys(id)`           | `GET /v1/partner/accounts/{id}/api-keys` |
| `client.partner.revokeApiKey(id, keyId)`   | `DELETE /v1/partner/accounts/{id}/api-keys/{keyId}` |
| `client.partner.transferQuota(id, amount)` | `POST /v1/partner/accounts/{id}/quota-transfers` |
| `client.partner.createWhatsappSignupLink(id)` | `POST /v1/partner/accounts/{id}/whatsapp-signup` |

### Tek mesaj göndermek

```ts
await client.messages.send({
  to: '+905551234567',
  body: 'Sipariş kodunuz: 4821',
  sender: 'MAGAZA',          // opsiyonel
  provider: 'netgsm',        // opsiyonel
});
```

### Telegram üzerinden göndermek

`provider: 'telegram'` seçildiğinde `to` alanı SMS yerine Telegram alıcı tanımlayıcısı bekler:
numerik `chat_id` (örn `8409353994`, gruplar için `-1001234567890`) veya `@kullaniciadi`. `sender` Telegram için kullanılmaz — bot kimliği bağlantıdaki token'a gömülüdür.

```ts
await client.messages.send({
  to: '8409353994',
  body: 'Merhaba!',
  provider: 'telegram',
});
```

### Sağlayıcılar-arası fallback

Birincil sağlayıcı mesajı **reddederse** (hard-fail: sağlayıcı hata döner veya bağlantı kurulamaz), aynı mesaj (aynı alıcı, aynı içerik, aynı SMS kanalı) sıradaki yedek sağlayıcıyla otomatik yeniden denenir. İlk **başarıda** durur. `fallback` en fazla 3 sağlayıcı kodundan oluşan sıralı bir dizidir; hepsi müşterinin bağlı `kind: sms` sağlayıcıları olmalı ve ne birincil ile ne de birbirleriyle aynı olabilir.

```ts
const result = await client.messages.send({
  to: '+905551234567',
  body: 'Sipariş kodunuz: 4821',
  provider: 'netgsm',                       // birincil
  fallback: ['verimor', 'iletimerkezi'],    // sıralı yedekler (max 3)
});

// result.provider  → mesajı KABUL eden sağlayıcı
// result.attempts  → denenen her sağlayıcı + sonucu (opsiyonel)
```

> **Kota tek sayım:** Bir mantıksal mesaj, kaç sağlayıcı denenirse denensin **tek** kota harcar; hepsi başarısız olursa hiç kota harcanmaz.
>
> **Kapsam:** Yalnızca **reddte (hard-fail)** tetiklenir ve yalnızca **SMS→SMS**'tir (kanallar arası değil, örn. WhatsApp→SMS yok). "Teslim edilemedi / timeout" için otomatik fallback henüz yoktur (gelecek sürüm).

`sendBulk` yanıtında kabul eden sağlayıcı, öğe bazında `delivered_via` alanında döner.

### Template ile göndermek

```ts
await client.messages.send({
  to: '+905551234567',
  template: 'order_shipped',
  variables: { name: 'Ayşe', tracking_no: 'TR123' },
});
```

`body` ve `template` aynı anda kullanılamaz; tam olarak biri zorunludur. `variables` yalnızca `template` ile birlikte verilebilir.

### Toplu gönderim

Tek istekte en fazla 200 öğe gönderebilirsiniz.

```ts
// Düz metin modu — her item'da body zorunlu, variables yok
await client.messages.sendBulk({
  items: [
    { to: '+905551111111', body: 'Mesaj 1' },
    { to: '+905552222222', body: 'Mesaj 2' },
  ],
});

// Template modu — items'ta body olmamalı
await client.messages.sendBulk({
  template: 'low_stock_alert',
  items: [
    { to: '+905551111111', variables: { product: 'Ürün A', stock: 3 } },
    { to: '+905552222222', variables: { product: 'Ürün B', stock: 1 } },
  ],
});
```

### Onaylı WhatsApp şablonu göndermek

Meta'da onaylanmış (APPROVED) bir şablonu `whatsappTemplate` ile gönderin. `components`, Meta Cloud API'nin `template.components` biçimini izler. `sender`, WhatsApp'ta gönderici numaranın Meta `phone_number_id` değeridir (verilmezse bağlantının numarası kullanılır).

```ts
const res = await client.messages.send({
  to: '+905551234567',
  provider: 'whatsapp',
  sender: '123456789012345',
  whatsappTemplate: {
    name: 'randevu_hatirlatma',
    language: 'tr',
    components: [
      { type: 'body', parameters: [{ type: 'text', text: 'Ayşe' }, { type: 'text', text: '5 Kasım 10:00' }] },
    ],
  },
});
console.log(res.whatsapp_template); // 'randevu_hatirlatma'
```

Toplu gönderimde alıcı başına değişkenleri `items[].whatsappComponents` ile verin (üst seviye `components` varsayılandır):

```ts
await client.messages.sendBulk({
  provider: 'whatsapp',
  whatsappTemplate: { name: 'kargo_cikti', language: 'tr' },
  items: [
    { to: '+905551112233', whatsappComponents: [{ type: 'body', parameters: [{ type: 'text', text: 'TR123' }] }] },
    { to: '+905554445566', whatsappComponents: [{ type: 'body', parameters: [{ type: 'text', text: 'TR456' }] }] },
  ],
});
```

### Zamanlanmış gönderim

`scheduledAt` verilirse mesaj şimdi gönderilmez; yanıt `{ scheduled_id, status: 'scheduled', ... }` olur. Saat dilimli ISO 8601 dizesi veya `Date` kabul edilir (en az 30 sn, en fazla 90 gün sonrası).

```ts
const job = await client.messages.send({
  to: '+905551234567',
  body: 'Yarınki randevunuzu hatırlatırız.',
  scheduledAt: '2026-11-05T09:00:00+03:00',
});

const { data } = await client.scheduled.list({ status: 'scheduled' });
await client.scheduled.cancel(job.scheduled_id);
```

### Hatırlatma kuralları

```ts
// Randevudan 24 saat ve 2 saat önce
await client.reminders.create({
  type: 'one_time',
  name: 'Randevu #4411',
  eventAt: '2026-11-10T14:00:00+03:00',
  offsetsMinutes: [1440, 120],
  message: { to: '+905551234567', body: 'Randevunuz 10 Kasım 14:00.' },
});

// Her pazartesi 09:30 (Europe/Istanbul)
const rule = await client.reminders.create({
  type: 'recurring',
  name: 'Haftalık bülten',
  frequency: 'weekly',
  dayOfWeek: 1,
  timeOfDay: '09:30',
  message: { to: '+905551234567', template: 'haftalik_bulten' },
});

await client.reminders.update(rule.id, { status: 'paused' });
await client.reminders.delete(rule.id);
```

### Partner API

Partner hesabının `partner:manage` yetkili canlı anahtarıyla:

```ts
const partner = new IletinizClient({ apiKey: process.env.ILETINIZ_PARTNER_KEY });

const child = await partner.partner.createAccount({ name: 'Klinik Ankara', externalRef: 'klinik-42' });
const key = await partner.partner.createApiKey(child.id, { name: 'prod' });
// key.key yalnız bu yanıtta döner; güvenli şekilde saklayın.

// Alt hesabın anahtarlarını listeleyin (düz metin anahtar dönmez, yalnız key_prefix) ve gerekirse iptal edin:
const { data: keys } = await partner.partner.listApiKeys(child.id);
await partner.partner.revokeApiKey(child.id, keys[0].id); // idempotent: iptal edilmişse aynı nesne döner

await partner.partner.transferQuota(child.id, 5000);
const link = await partner.partner.createWhatsappSignupLink(child.id);
// link.url'yi müşterinize iletin (24 saat geçerli, tek kullanımlık).

// Alt hesap adına gönderim, alt hesabın anahtarıyla yapılır:
const childClient = new IletinizClient({ apiKey: key.key });
```

`transferQuota`, `createAccount` ve `createApiKey` istekleri hata durumunda otomatik yeniden denenmez (çift aktarım/çift kayıt riskine karşı).

### Mesaj durumunu sorgulamak

```ts
const info = await client.messages.retrieve(jobId);
// info.status: 'sent' | 'queued' | 'failed' | 'delivered' | 'expired' | 'rejected' | 'unknown'
```

### Sağlık kontrolü

```ts
const health = await client.health.check();
// { ok: true, db: 'up' }
```

## Hata yönetimi

Tüm hatalar `IletinizError` sınıfından türetilir. HTTP status'a göre uygun alt sınıf fırlatılır:

```ts
import {
  IletinizAPIError,
  IletinizAuthenticationError,
  IletinizValidationError,
  IletinizRateLimitError,
  IletinizNotFoundError,
  IletinizServerError,
  IletinizTimeoutError,
  IletinizConnectionError,
} from '@iletiniz/sdk';

try {
  await client.messages.send({ to: '+905551234567', body: 'test' });
} catch (err) {
  if (err instanceof IletinizAuthenticationError) {
    // 401 — geçersiz veya iptal edilmiş anahtar
  } else if (err instanceof IletinizValidationError) {
    // 400 / 422 — istek doğrulanamadı
    console.error(err.body);
  } else if (err instanceof IletinizRateLimitError) {
    // 429 — yeniden denemeden önce backoff
  } else if (err instanceof IletinizAPIError) {
    console.error(err.status, err.code, err.message, err.requestId);
  } else if (err instanceof IletinizTimeoutError) {
    // istek timeout'a takıldı
  } else if (err instanceof IletinizConnectionError) {
    // ağ hatası
  } else {
    throw err;
  }
}
```

## Yeniden deneme stratejisi

SDK, aşağıdaki durumlarda otomatik olarak `maxRetries` defa yeniden dener (varsayılan: 2):

- Ağ kaynaklı bağlantı hataları
- HTTP 408, 429, 500–599

`Retry-After` başlığı varsa beklenir; aksi halde exponential backoff (jitter ile) uygulanır. Yeniden denemeyi kapatmak için `maxRetries: 0` verin.

## Timeout ve iptal

İstek bazında timeout veya iptal:

```ts
const ctrl = new AbortController();
setTimeout(() => ctrl.abort(), 5000);

await client.messages.send(
  { to: '+905551234567', body: 'merhaba' },
  { signal: ctrl.signal, timeoutMs: 10_000 },
);
```

## TypeScript

SDK tamamen TypeScript ile yazıldı. Tüm parametre ve yanıt tipleri export edilir:

```ts
import type {
  SendMessageParams,
  SendMessageResponse,
  MessageStatusResponse,
  SendBulkParams,
  SendBulkResponse,
  HealthResponse,
} from '@iletiniz/sdk';
```

## Katkıda Bulunma / Contributing

Katkı sağlamak ister misiniz? Lütfen [CONTRIBUTING.md](./CONTRIBUTING.md) dosyasını inceleyin. English: [CONTRIBUTING.en.md](./CONTRIBUTING.en.md).

## Davranış Kuralları / Code of Conduct

Bu proje [Contributor Covenant](./CODE_OF_CONDUCT.md) davranış kurallarına bağlıdır. English: [CODE_OF_CONDUCT.en.md](./CODE_OF_CONDUCT.en.md).

## Güvenlik / Security

Güvenlik açığı bildirmek için lütfen [SECURITY.md](./SECURITY.md) dosyasındaki adımları izleyin — **public issue açmayın**. English: [SECURITY.en.md](./SECURITY.en.md).

## Lisans / License

MIT — bkz. / see [LICENSE](./LICENSE).
