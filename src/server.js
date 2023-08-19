import express from 'express';
import helmet from 'helmet';
import path from 'path';

export const app = express();
app.use(helmet());
app.use(express.static(path.join(process.cwd(), 'src', 'public')));
