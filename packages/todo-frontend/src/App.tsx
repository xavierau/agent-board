import { useCallback, useEffect, useState } from 'react';
import { AddTodoForm } from './components/AddTodoForm';
import { TodoList } from './components/TodoList';
import {
  createTodo,
  deleteTodo,
  fetchTodos,
  updateTodo,
  type Todo,
} from './services/api';

export function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodos = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchTodos();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  const handleAdd = async (title: string) => {
    try {
      setError(null);
      await createTodo({ title });
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add todo');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      setError(null);
      const todo = todos.find((t) => t.id === id);
      if (!todo) return;
      await updateTodo(id, { completed: !todo.completed });
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update todo');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setError(null);
      await deleteTodo(id);
      await loadTodos();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete todo');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Todo App</h1>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <AddTodoForm onAdd={handleAdd} />
          <div className="mt-6">
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </p>
            )}
            {loading ? (
              <p className="py-8 text-center text-sm text-gray-400">
                Loading...
              </p>
            ) : (
              <TodoList
                todos={todos}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
