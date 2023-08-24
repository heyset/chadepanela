import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import * as db from './db.js';
import { BusinessLogicError } from './business-logic-error.js';

export const app = express();

// config

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      connectSrc: ["'self'", 'ws://127.0.0.1:35729/livereload'],
      imgSrc: '*',
    },
  },
}));

app.use(cors());

app.use(express.static(path.join(process.cwd(), 'src', 'public')));

// views

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.get('/', async (req, res) => {
  res.render('pages/home');
});

app.get('/entrar', async (req, res) => {
  res.render('pages/login');
});

app.get('/presentes', async (req, res) => {
  res.render('pages/gift-list');
});

app.get('/detalhes', async (req, res) => {
  res.render('pages/details');
});

app.use(async (err, req, res, next) => {
  res.status(
    err instanceof BusinessLogicError ? 400 : 500
  );
  res.send(`Alguma coisa deu errado :( - manda pro Matheus um print: ${err}`);
});

// api

app.use(async (req, res, next) => {
  const key = req.headers.authorization;
  if (!key)
  {
    res.status(401);
    return res.json({ error: { message: 'Unauthorized', code: 401 } })
  }

  const guest = await db.findGuest(key);
  if (!guest)
  {
    res.status(403);
    return res.json({ error: { message: 'Forbidden', code: 403 } });
  }

  res.locals.guest = guest;

  next();
});

app.get('/api/gifts', async (req, res) => {
  const { gifts, gifters } = await db.getAllGifts();
  let amountChosenByUser = 0;
  gifts.forEach((gift) => {
    if (gifters.get(gift.id)?.has(res.locals.guest.key)) {
      gift.chosenByUser = true;
      amountChosenByUser += 1;
    } else {
      gift.chosenByUser = false;
    }
  });

  res.json({
    ok: true,
    gifts: gifts.sort((a, b) => (a.description < b.description) ? -1 : 1),
    userCanChooseMore: amountChosenByUser < 3,
  });
});

app.post('/api/gifts/choose/:id', async (req, res) => {
  await db.chooseGift(req.params.id, res.locals.guest.key);
});

app.get('/api/new-id', async (req, res) => {
  const id = db.generateId();
  res.json({ id });
});

app.get('/api/guest-name', async (req, res) => {
  const { guest } = res.locals;
  res.json({
    ok: true,
    guest: {
      name: guest.name,
      surname: guest.surname,
      specialMessage: guest.specialMessage,
    },
  });
});

app.post('/api/login', async (req, res) => {
  res.json({ ok: true });
});

app.use(async (err, req, res, next) => {
  if (err instanceof BusinessLogicError) {
    res.status(400);
  } else {
    res.status(500);
    console.log(err);
  }
  res.json({ error: { message: err.message, code: err.code } });
});