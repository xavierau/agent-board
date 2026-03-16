const API_BASE = '/api';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTodoInput {
  title: string;
}

export interface UpdateTodoInput {
  title?: string;
  completed?: boolean;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchTodos(): Promise<Todo[]> {
  const response = await fetch(`${API_BASE}/todos`);
  return handleResponse<Todo[]>(response);
}

export async function createTodo(input: CreateTodoInput): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<Todo>(response);
}

export async function updateTodo(
  id: string,
  input: UpdateTodoInput,
): Promise<Todo> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  return handleResponse<Todo>(response);
}

export async function deleteTodo(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/todos/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
}
