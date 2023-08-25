import 'dotenv/config';
import { app } from './server.js';
import * as db from './db.js';

await db.connect();

const port = process.env.PORT || 3030;

app.listen(port, '0.0.0.0', () => {
  console.log(`server is up on port ${port}`);
});
