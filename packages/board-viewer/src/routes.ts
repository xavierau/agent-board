import { Router } from 'express';
import { readRouter } from './read-routes.js';
import { writeRouter } from './write-routes.js';
import { agentRouter } from './agent-routes.js';

export const router = Router();

router.use(readRouter);
router.use(writeRouter);
router.use(agentRouter);
