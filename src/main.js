import 'dotenv/config';
import { app } from "./server.js";

app.get('/', (req, res) => {
  console.log('got a request');
  res.send('ok');
})

const port = process.env.PORT || 3030;

app.listen(port, () => {
  console.log(`server is up on port ${port}`);
});
