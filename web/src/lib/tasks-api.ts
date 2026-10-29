const API_BASE = "/api/backend";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};

type ApiResponse<T> = { data: T };
type CreateTaskInput = { title: string; description?: string };
type UpdateTaskInput = { title?: string; description?: string | null; completed?: boolean };

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body: unknown = await response.json();
      if (body && typeof body === "object" && "error" in body && typeof body.error === "string") message = body.error;
    } catch { /* use fallback */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function getTasks(): Promise<Task[]> {
  const response = await request<ApiResponse<Task[]>>("/tasks");
  return response.data;
}
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await request<ApiResponse<Task>>("/tasks", { method: "POST", body: JSON.stringify(input) });
  return response.data;
}
export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const response = await request<ApiResponse<Task>>(`/tasks/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  return response.data;
}
export async function deleteTask(id: string): Promise<void> {
  await request<void>(`/tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}
