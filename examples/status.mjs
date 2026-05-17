import { IletinizClient, IletinizNotFoundError } from '../dist/esm/index.js';

const client = new IletinizClient({
  apiKey: process.env.ILETINIZ_API_KEY,
});

try {
  const info = await client.messages.retrieve(process.argv[2]);
  console.log(info);
} catch (err) {
  if (err instanceof IletinizNotFoundError) {
    console.error('Mesaj bulunamadı.');
  } else {
    throw err;
  }
}
