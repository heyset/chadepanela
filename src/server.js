import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import * as db from './db.js';

export const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      imgSrc: '*',
    },
  },
}));

app.use(cors());

app.use(express.static(path.join(process.cwd(), 'src', 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.get('/', async (req, res) => {
  res.render('pages/gift-list');
});

app.get('/api/gifts', async (req, res) => {
  const gifts = await db.getAllGifts();
  res.json({
    gifts: gifts.sort((a, b) => (a.description < b.description) ? -1 : 1)
  });
});

app.post('api/gifts/choose/:id', async (req, res) => {
  db.chooseGift(req.params.id);
});

app.get('/api/new-id', async (req, res) => {
  const id = db.generateId();
  res.json({ id });
});

app.use(async (err, req, res, next) => {
  res.send(`Alguma coisa deu errado :( - manda pro Matheus um print: ${err}`);
});
