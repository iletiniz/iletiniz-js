import { IletinizClient } from '../dist/esm/index.js';

const client = new IletinizClient({
  apiKey: process.env.ILETINIZ_API_KEY,
});

const result = await client.messages.send({
  to: '+905551234567',
  body: 'Merhaba! Bu Iletiniz SDK ile gönderilen test mesajıdır.',
});

console.log('Job:', result.job_id, 'Status:', result.status);
