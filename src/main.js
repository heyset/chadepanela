import 'dotenv/config';
import { app } from './server.js';
import * as db from './db.js';

console.log(process.env.PRIVATE_KEY);
await db.connect();

app.get('/gifts', async (req, res) => {
  const gifts = await db.getAllGifts();
  res.json({ gifts });
});

app.post('/gifts/choose/:id', async (req, res) => {
  db.chooseGift(req.params.id);
});

app.use(async (err, req, res, next) => {
  res.send(`Alguma coisa deu errado :( - manda pro Matheus um print: ${err}`);
});

const port = process.env.PORT || 3030;

app.listen(port, () => {
  console.log(`server is up on port ${port}`);
});
