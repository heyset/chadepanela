import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';

export const app = express();
app.use(cors());
app.use(express.static(path.join(process.cwd(), 'src', 'public')));
