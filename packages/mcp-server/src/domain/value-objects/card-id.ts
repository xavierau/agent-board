import { v4 as uuidv4 } from 'uuid';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CardId {
  private constructor(readonly value: string) {}

  static generate(): CardId {
    return new CardId(uuidv4());
  }

  static from(value: string): CardId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid CardId: ${value}`);
    }
    return new CardId(value);
  }

  toString(): string {
    return this.value;
  }
}
