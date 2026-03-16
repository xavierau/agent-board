import type { Todo } from '../services/api';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <li className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span
        className={`flex-1 text-sm ${todo.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}
      >
        {todo.title}
      </span>
      <button
        onClick={() => onDelete(todo.id)}
        className="rounded px-2 py-1 text-xs text-red-500 opacity-100 hover:bg-red-50 sm:opacity-0 sm:group-hover:opacity-100"
      >
        Delete
      </button>
    </li>
  );
}
