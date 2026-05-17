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
