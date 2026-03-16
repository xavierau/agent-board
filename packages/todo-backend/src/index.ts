import express from 'express';
import cors from 'cors';
import { join } from 'node:path';
import { JsonlStore } from './db/jsonl-store.js';
import { createTodoRouter } from './routes/todos.js';

const PORT = 3001;
const DB_PATH = join(process.cwd(), 'data', 'todos.jsonl');

const store = new JsonlStore(DB_PATH);
const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/todos', createTodoRouter(store));

app.listen(PORT, () => {
  console.log(`Todo backend listening on http://localhost:${PORT}`);
});
