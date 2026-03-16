import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { router } from './routes.js';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static(join(__dirname, '..', 'public')));

app.use(router);

app.listen(PORT, () => {
  console.log(`Board viewer running on http://localhost:${PORT}`);
});
