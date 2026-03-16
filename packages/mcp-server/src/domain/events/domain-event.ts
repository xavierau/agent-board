import type { CardEvent } from './card-events.js';
import type { BoardEvent } from './board-events.js';

export type DomainEvent = CardEvent | BoardEvent;
