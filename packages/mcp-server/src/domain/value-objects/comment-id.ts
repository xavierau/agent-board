import { v4 as uuidv4 } from 'uuid';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class CommentId {
  private constructor(readonly value: string) {}

  static generate(): CommentId {
    return new CommentId(uuidv4());
  }

  static from(value: string): CommentId {
    if (!UUID_REGEX.test(value)) {
      throw new Error(`Invalid CommentId: ${value}`);
    }
    return new CommentId(value);
  }

  toString(): string {
    return this.value;
  }
}
