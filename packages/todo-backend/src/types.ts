export interface Todo {
  readonly id: string;
  readonly title: string;
  readonly completed: boolean;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

export interface CreateTodoInput {
  readonly title: string;
}

export interface UpdateTodoInput {
  readonly title?: string;
  readonly completed?: boolean;
}
