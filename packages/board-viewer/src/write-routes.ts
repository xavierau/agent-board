import { Router } from 'express';
import { boardWriteRouter } from './board-write-routes.js';
import { boardAccessRouter } from './board-access-routes.js';
import { cardWriteRouter } from './card-write-routes.js';
import { commentWriteRouter } from './comment-write-routes.js';
import { boardLabelRouter } from './board-label-routes.js';
import { cardLabelRouter } from './card-label-routes.js';
import { checklistRouter } from './checklist-routes.js';
import { checklistItemRouter } from './checklist-item-routes.js';

export const writeRouter = Router();

writeRouter.use(boardWriteRouter);
writeRouter.use(boardAccessRouter);
writeRouter.use(cardWriteRouter);
writeRouter.use(commentWriteRouter);
writeRouter.use(boardLabelRouter);
writeRouter.use(cardLabelRouter);
writeRouter.use(checklistRouter);
writeRouter.use(checklistItemRouter);
