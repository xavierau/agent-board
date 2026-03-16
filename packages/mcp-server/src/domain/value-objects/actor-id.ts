export class ActorId {
  private constructor(readonly value: string) {}

  static from(value: string): ActorId {
    if (!value || value.trim().length === 0) {
      throw new Error('ActorId cannot be empty');
    }
    return new ActorId(value.trim());
  }

  toString(): string {
    return this.value;
  }
}
