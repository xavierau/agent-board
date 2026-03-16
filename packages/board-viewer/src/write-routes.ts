import { Router } from 'express';
import { boardWriteRouter } from './board-write-routes.js';
import { cardWriteRouter } from './card-write-routes.js';
import { commentWriteRouter } from './comment-write-routes.js';

export const writeRouter = Router();

writeRouter.use(boardWriteRouter);
writeRouter.use(cardWriteRouter);
writeRouter.use(commentWriteRouter);
