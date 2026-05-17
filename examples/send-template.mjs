import { IletinizClient } from '../dist/esm/index.js';

const client = new IletinizClient({
  apiKey: process.env.ILETINIZ_API_KEY,
});

const result = await client.messages.send({
  to: '+905551234567',
  template: 'order_shipped',
  variables: { name: 'Ayşe', tracking_no: 'TR123456789' },
});

console.log('Sent via template:', result.template_key, '→', result.status);
