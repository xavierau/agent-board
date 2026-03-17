import type { CardEvent } from './card-events.js';
import type { BoardEvent } from './board-events.js';
import type { BoardLabelEvent } from './board-label-events.js';

export type DomainEvent = CardEvent | BoardEvent | BoardLabelEvent;
