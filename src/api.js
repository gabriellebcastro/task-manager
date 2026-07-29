const BASE = 'http://localhost:3001/api';

export async function fetchTasks() {
  const r = await fetch(`${BASE}/tasks`);
  if (!r.ok) throw new Error('Failed to fetch tasks');
  return r.json();
}

export async function createTask(data) {
  const r = await fetch(`${BASE}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Failed to create task');
  return r.json();
}

export async function updateTask(id, data) {
  const r = await fetch(`${BASE}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) throw new Error('Failed to update task');
  return r.json();
}

export async function deleteTask(id) {
  const r = await fetch(`${BASE}/tasks/${id}`, { method: 'DELETE' });
  if (!r.ok) throw new Error('Failed to delete task');
}
