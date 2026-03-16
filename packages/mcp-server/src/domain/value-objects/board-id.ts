import { v4 as uuidv4 } from 'uuid';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class BoardId {
  private constructor(readonly value: string) {}

  static generate(): BoardId {
    return new BoardId(uuidv4());
  }

  static from(value: string): BoardId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid BoardId: ${value}`);
    }
    return new BoardId(value);
  }

  toString(): string {
    return this.value;
  }
}
