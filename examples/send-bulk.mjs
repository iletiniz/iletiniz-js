import { IletinizClient } from '../dist/esm/index.js';

const client = new IletinizClient({
  apiKey: process.env.ILETINIZ_API_KEY,
});

const result = await client.messages.sendBulk({
  template: 'low_stock_alert',
  items: [
    { to: '+905551111111', variables: { product: 'Ürün A', stock: 3 } },
    { to: '+905552222222', variables: { product: 'Ürün B', stock: 1 } },
  ],
});

console.log(`Toplam: ${result.total}, Gönderilen: ${result.sent}, Başarısız: ${result.failed}`);
