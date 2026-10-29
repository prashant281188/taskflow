"use client";

import {
	Activity,
	ArrowDown,
	ArrowUpRight,
	Check,
	CheckCircle2,
	Circle,
	ClipboardList,
	Clock3,
	ListTodo,
	Plus,
	Search,
	Trash2,
	X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	createTask as createTaskApi,
	deleteTask as deleteTaskApi,
	getTasks,
	updateTask as updateTaskApi,
	type Task,
} from "@/lib/tasks-api";

type Filter = "all" | "pending" | "completed";

const filters: { label: string; value: Filter }[] = [
	{ label: "All tasks", value: "all" },
	{ label: "Pending", value: "pending" },
	{ label: "Completed", value: "completed" },
];

export default function Home() {
	const [tasks, setTasks] = useState<Task[]>([]);
	const [filter, setFilter] = useState<Filter>("all");
	const [search, setSearch] = useState("");
	const [showForm, setShowForm] = useState(false);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState("");
	const [loadAttempt, setLoadAttempt] = useState(0);
	const [notice, setNotice] = useState("");
	const [saving, setSaving] = useState(false);
	const [busyTaskIds, setBusyTaskIds] = useState<string[]>([]);
	const [editingTask, setEditingTask] = useState<Task | null>(null);
	const [editTitle, setEditTitle] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editSaving, setEditSaving] = useState(false);

	useEffect(() => {
		let cancelled = false;

		async function loadTasks() {
			try {
				setLoading(true);
				setLoadError("");

				const data = await getTasks();

				if (!cancelled) {
					setTasks(data);
				}
			} catch (err) {
				if (!cancelled) {
					setLoadError(
						err instanceof Error ? err.message : "Failed to load tasks.",
					);
				}
			} finally {
				if (!cancelled) {
					setLoading(false);
				}
			}
		}

		void loadTasks();

		return () => {
			cancelled = true;
		};
	}, [loadAttempt]);

	useEffect(() => {
		if (!notice) return;
		const timer = window.setTimeout(() => setNotice(""), 3500);
		return () => window.clearTimeout(timer);
	}, [notice]);

	const completedCount = tasks.filter((task) => task.completed).length;
	const pendingCount = tasks.length - completedCount;
	const progress =
		tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

	const visibleTasks = useMemo(() => {
		const query = search.trim().toLowerCase();

		return tasks.filter((task) => {
			const matchesFilter =
				filter === "all" ||
				(filter === "pending" && !task.completed) ||
				(filter === "completed" && task.completed);

			const matchesSearch =
				task.title.toLowerCase().includes(query) ||
				task.description?.toLowerCase().includes(query);

			return matchesFilter && matchesSearch;
		});
	}, [tasks, filter, search]);

	async function addTask(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const trimmedTitle = title.trim();

		if (!trimmedTitle) {
			setError("Please enter a task title.");
			return;
		}

		if (trimmedTitle.length > 200) {
			setError("The title must be 200 characters or fewer.");
			return;
		}

		try {
			setSaving(true);
			setError("");

			const task = await createTaskApi({
				title: trimmedTitle,
				description: description.trim() || undefined,
			});

			setTasks((current) => [task, ...current]);
			setTitle("");
			setDescription("");
			setFilter("all");
			setSearch("");
			setShowForm(false);
			setNotice("Task created successfully.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create task.");
		} finally {
			setSaving(false);
		}
	}

	async function toggleTask(id: string) {
		const task = tasks.find((item) => item.id === id);
		if (!task || busyTaskIds.includes(id)) return;

		setBusyTaskIds((current) => [...current, id]);
		setError("");

		try {
			const updated = await updateTaskApi(id, {
				completed: !task.completed,
			});

			setTasks((current) =>
				current.map((item) => (item.id === id ? updated : item)),
			);
			setNotice(updated.completed ? "Task marked complete." : "Task marked pending.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update task.");
		} finally {
			setBusyTaskIds((current) => current.filter((taskId) => taskId !== id));
		}
	}

	async function deleteTask(id: string) {
		if (busyTaskIds.includes(id)) return;
		const taskToDelete = tasks.find((task) => task.id === id);
		if (!taskToDelete) return;
		if (!window.confirm(`Delete "${taskToDelete.title}"? This cannot be undone.`)) return;

		setBusyTaskIds((current) => [...current, id]);
		setError("");

		try {
			await deleteTaskApi(id);
			setTasks((current) => current.filter((task) => task.id !== id));
			setNotice("Task deleted.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete task.");
		} finally {
			setBusyTaskIds((current) => current.filter((taskId) => taskId !== id));
		}
	}

	function openEditForm(task: Task) {
		setShowForm(false);
		setEditingTask(task);
		setEditTitle(task.title);
		setEditDescription(task.description ?? "");
		setError("");
	}

	async function saveTaskEdit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		if (!editingTask || editSaving) return;

		const trimmedTitle = editTitle.trim();
		const trimmedDescription = editDescription.trim();

		if (!trimmedTitle) {
			setError("Task title is required.");
			return;
		}

		if (trimmedTitle.length > 200) {
			setError("The title must be 200 characters or fewer.");
			return;
		}

		if (trimmedDescription.length > 5000) {
			setError("The description must be 5000 characters or fewer.");
			return;
		}

		try {
			setEditSaving(true);
			setError("");

			const updated = await updateTaskApi(editingTask.id, {
				title: trimmedTitle,
				description: trimmedDescription || null,
			});

			setTasks((current) =>
				current.map((task) => (task.id === updated.id ? updated : task)),
			);

			setEditingTask(null);
			setNotice("Task updated successfully.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update task.");
		} finally {
			setEditSaving(false);
		}
	}
	return (
		<main className="min-h-screen bg-[#f7f7f5] text-zinc-950">
			{notice && <div role="status" className="fixed right-4 top-4 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-emerald-800 shadow-lg"><CheckCircle2 size={18} />{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification" className="ml-2 rounded p-1 hover:bg-emerald-50"><X size={15} /></button></div>}
			<div className="mx-auto flex min-h-screen max-w-[1440px]">
				<aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-200 bg-white p-6 md:flex">
					<a
						href="#"
						className="flex items-center gap-3"
					>
						<span className="flex size-10 items-center justify-center rounded-xl bg-amber-400 text-black">
							<ListTodo size={23} />
						</span>
						<span>
							<span className="block text-lg font-bold tracking-tight">
								TaskFlow
							</span>
							<span className="text-xs text-zinc-500">Personal workspace</span>
						</span>
					</a>

					<div className="mt-10">
						<p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
							Workspace
						</p>
						<div className="flex items-center gap-3 rounded-xl bg-amber-50 px-3 py-3 font-medium text-zinc-900">
							<ClipboardList
								size={19}
								className="text-amber-700"
							/>
							My tasks
							<span className="ml-auto rounded-md bg-amber-200 px-2 py-0.5 text-xs">
								{tasks.length}
							</span>
						</div>
						<button
							onClick={() => setFilter("pending")}
							className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-600 transition hover:bg-zinc-100"
						>
							<Clock3 size={19} />
							Pending
							<span className="ml-auto text-xs">{pendingCount}</span>
						</button>
						<button
							onClick={() => setFilter("completed")}
							className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-zinc-600 transition hover:bg-zinc-100"
						>
							<CheckCircle2 size={19} />
							Completed
							<span className="ml-auto text-xs">{completedCount}</span>
						</button>
					</div>

					<div className="mt-auto rounded-2xl bg-zinc-950 p-4 text-white">
						<div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-amber-400 text-black">
							<Activity size={19} />
						</div>
						<p className="font-semibold">Keep moving forward.</p>
						<p className="mt-1 text-xs leading-5 text-zinc-400">
							Small steps every day lead to big results.
						</p>
						<div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-700">
							<div
								className="h-full rounded-full bg-amber-400 transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
						<p className="mt-2 text-xs text-zinc-400">
							{progress}% of tasks completed
						</p>
					</div>
				</aside>

				<section className="min-w-0 flex-1">
					<header className="flex h-[76px] items-center justify-between border-b border-zinc-200 bg-white px-5 sm:px-8">
						<div>
							<p className="text-xs text-zinc-500">Workspace / My tasks</p>
							<h1 className="mt-1 text-lg font-bold tracking-tight">
								Task dashboard
							</h1>
						</div>
						<button
							onClick={() => {
								setEditingTask(null);
								setShowForm(true);
								setError("");
							}}
							className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
						>
							<Plus size={18} />
							<span className="hidden sm:inline">New task</span>
							<span className="sm:hidden">Add</span>
						</button>
					</header>

					<div className="mx-auto max-w-6xl p-5 sm:p-8 lg:p-10">
						{error && (
							<div role="alert" className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
								<p>{error}</p>
								<button type="button" onClick={() => setError("")} aria-label="Dismiss error" className="shrink-0 rounded-md px-2 text-red-700 hover:bg-red-100">
									<X size={16} />
								</button>
							</div>
						)}
						<div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
							<div>
								<p className="text-sm font-medium text-amber-700">
									YOUR PRODUCTIVITY
								</p>
								<h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
									Make today count.
								</h2>
								<p className="mt-2 text-sm text-zinc-500">
									Organize your work, one task at a time.
								</p>
							</div>
							<div className="text-sm text-zinc-500">
								<span className="font-medium text-zinc-900">
									{completedCount} of {tasks.length}
								</span>{" "}
								tasks completed
							</div>
						</div>

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
							<SummaryCard
								label="Total tasks"
								value={tasks.length}
								detail="All your tasks"
								icon={<ClipboardList size={20} />}
								iconClass="bg-zinc-100 text-zinc-700"
							/>
							<SummaryCard
								label="Completed"
								value={completedCount}
								detail="Tasks finished"
								icon={<CheckCircle2 size={20} />}
								iconClass="bg-emerald-50 text-emerald-700"
							/>
							<SummaryCard
								label="Pending"
								value={pendingCount}
								detail="Still to do"
								icon={<Clock3 size={20} />}
								iconClass="bg-amber-50 text-amber-700"
							/>
							<SummaryCard
								label="Completion rate"
								value={`${progress}%`}
								detail="Overall progress"
								icon={<ArrowUpRight size={20} />}
								iconClass="bg-blue-50 text-blue-700"
							/>
						</div>

						{showForm && (
							<form
								onSubmit={addTask}
								className="mt-8 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm sm:p-6"
							>
								<div className="mb-5 flex items-center justify-between">
									<div>
										<h3 className="font-semibold">Create a new task</h3>
										<p className="mt-1 text-sm text-zinc-500">
											Give your next task a clear title.
										</p>
									</div>
									<button
										type="button"
										aria-label="Close form"
										onClick={() => {
											setShowForm(false);
											setError("");
										}}
										className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
									>
										<X size={19} />
									</button>
								</div>
								<label
									htmlFor="task-title"
									className="mb-2 block text-sm font-medium"
								>
									Task title *
								</label>
								<input
									id="task-title"
									autoFocus
									maxLength={200}
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									placeholder="What do you need to do?"
									className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
								/>
								<label
									htmlFor="task-description"
									className="mb-2 mt-4 block text-sm font-medium"
								>
									Description
								</label>
								<textarea
									id="task-description"
									rows={3}
									maxLength={5000}
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									placeholder="Add details (optional)"
									className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
								/>
								<div className="mt-4 flex justify-end gap-3">
									<button
										type="button"
										onClick={() => {
								setShowForm(false);
								setError("");
							}}
										className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium hover:bg-zinc-50"
									>
										Cancel
									</button>
									<button
										type="submit"
										disabled={saving}
										className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{saving ? "Creating..." : "Create task"}
									</button>
								</div>
							</form>
						)}
						{editingTask && (
							<form
								onSubmit={saveTaskEdit}
								className="mt-6 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
							>
								<div className="mb-5 flex items-center justify-between">
									<h3 className="font-semibold">Edit task</h3>

									<button
										type="button"
										onClick={() => {
											setEditingTask(null);
											setError("");
										}}
										className="rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
									>
										Cancel
									</button>
								</div>

								<label
									htmlFor="edit-task-title"
									className="mb-2 block text-sm font-medium"
								>
									Task title *
								</label>

								<input
									id="edit-task-title"
									value={editTitle}
									onChange={(event) => setEditTitle(event.target.value)}
									maxLength={200}
									required
									className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
								/>

								<label
									htmlFor="edit-task-description"
									className="mb-2 mt-4 block text-sm font-medium"
								>
									Description
								</label>

								<textarea
									id="edit-task-description"
									value={editDescription}
									onChange={(event) => setEditDescription(event.target.value)}
									maxLength={5000}
									rows={3}
									className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
								/>

								<div className="mt-4 flex justify-end">
									<button
										type="submit"
										disabled={editSaving}
										className="rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
									>
										{editSaving ? "Saving..." : "Save changes"}
									</button>
								</div>
							</form>
						)}

						<section className="mt-9">
							<div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
								<div>
									<h3 className="text-xl font-bold tracking-tight">
										Your tasks
									</h3>
									<p className="mt-1 text-sm text-zinc-500">
										Manage and track your daily work.
									</p>
								</div>
								<div className="relative w-full sm:max-w-xs">
									<Search
										size={18}
										className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
									/>
									<input
										value={search}
										onChange={(event) => setSearch(event.target.value)}
										placeholder="Search tasks..."
										aria-label="Search tasks"
										className="h-11 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
									/>
								</div>
							</div>

							<div className="mt-5 flex gap-2 overflow-x-auto pb-1">
								{filters.map((item) => (
									<button
										key={item.value}
										onClick={() => setFilter(item.value)}
										className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition ${
											filter === item.value ?
												"bg-zinc-950 text-white"
											:	"border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100"
										}`}
									>
										{item.label}
										<span className="ml-2 text-xs opacity-70">
											{item.value === "all" ?
												tasks.length
											: item.value === "pending" ?
												pendingCount
											:	completedCount}
										</span>
									</button>
								))}
							</div>

							<div className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
								<div className="hidden grid-cols-[minmax(0,1fr)_120px_100px_auto] items-center gap-4 border-b border-zinc-100 bg-zinc-50/80 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 sm:grid">
									<span>Task</span>
									<span>Created</span>
									<span>Status</span>
									<span />
								</div>
								{loading ? (
									<p className="px-5 py-8 text-sm text-zinc-500">Loading tasks from the database...</p>
								) : loadError ? (
									<div className="px-5 py-10 text-center">
										<p className="font-semibold text-zinc-900">Could not load tasks</p>
										<p className="mt-2 text-sm text-zinc-500">{loadError}. Check the backend connection and retry.</p>
										<button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)} className="mt-4 rounded-xl bg-zinc-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">Retry</button>
									</div>
								) : visibleTasks.length === 0 ?
									<div className="flex flex-col items-center px-5 py-14 text-center">
										<div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
											<Search size={22} />
										</div>
										<h4 className="mt-4 font-semibold">No tasks found</h4>
										<p className="mt-1 text-sm text-zinc-500">
											Try a different search or create a new task.
										</p>
										<button
											onClick={() => {
												setSearch("");
												setFilter("all");
												setShowForm(true);
											}}
											className="mt-4 text-sm font-semibold text-amber-800 hover:underline"
										>
											Create a task
										</button>
									</div>
								:	visibleTasks.map((task) => (
										<article
											key={task.id}
											className="grid gap-3 border-b border-zinc-100 px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_120px_100px_auto] sm:items-center sm:gap-4 sm:px-5"
										>
											<div className="flex min-w-0 items-start gap-3">
												<button
													onClick={() => toggleTask(task.id)}
													aria-label={
														task.completed ?
															`Mark ${task.title} incomplete`
														:	`Mark ${task.title} complete`
													}
													className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border transition ${
														task.completed ?
															"border-emerald-600 bg-emerald-600 text-white"
														:	"border-zinc-300 text-transparent hover:border-amber-500"
													}`}
												>
													{task.completed && <Check size={13} />}
												</button>
												<div className="min-w-0">
													<p
														className={`break-words text-sm font-semibold ${
															task.completed ?
																"text-zinc-400 line-through"
															:	"text-zinc-900"
														}`}
													>
														{task.title}
													</p>
													{task.description && (
														<p className="mt-1 break-words text-xs leading-5 text-zinc-500">
															{task.description}
														</p>
													)}
												</div>
											</div>

											<span className="pl-8 text-xs text-zinc-500 sm:pl-0">
												{Number.isNaN(Date.parse(task.created_at))
									? "—"
									: new Date(task.created_at).toLocaleDateString(undefined, {
										month: "short",
										day: "numeric",
										year: "numeric",
									})}
											</span>

											<span
												className={`ml-8 inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:ml-0 ${
													task.completed ?
														"bg-emerald-50 text-emerald-700"
													:	"bg-amber-50 text-amber-800"
												}`}
											>
												{task.completed ?
													<CheckCircle2 size={13} />
												:	<Circle size={13} />}
												{task.completed ? "Completed" : "Pending"}
											</span>

							<div className="flex items-center gap-1 pl-8 sm:pl-0">
								<button
									type="button"
									onClick={() => openEditForm(task)}
									disabled={busyTaskIds.includes(task.id)}
									className="rounded-lg px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
								>
									Edit
								</button>
								<button
									type="button"
									onClick={() => deleteTask(task.id)}
									disabled={busyTaskIds.includes(task.id)}
									aria-label={`Delete ${task.title}`}
									className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
								>
									<Trash2 size={16} />
								</button>
							</div>
										</article>
									))
								}
							</div>

							<div className="mt-4 flex items-center justify-between text-xs text-zinc-500">
								<span>
									Showing {visibleTasks.length} of {tasks.length} tasks
								</span>
								<button
									onClick={() => {
										setSearch("");
										setFilter("all");
									}}
									className="inline-flex items-center gap-1 font-medium hover:text-zinc-900"
								>
									Reset filters <ArrowDown size={13} />
								</button>
							</div>
						</section>

						<footer className="mt-10 border-t border-zinc-200 pt-5 text-xs text-zinc-400">
							TaskFlow · Built with Next.js, React and TypeScript
						</footer>
					</div>
				</section>
			</div>
		</main>
	);
}

function SummaryCard({
	label,
	value,
	detail,
	icon,
	iconClass,
}: {
	label: string;
	value: string | number;
	detail: string;
	icon: React.ReactNode;
	iconClass: string;
}) {
	return (
		<div className="rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300">
			<div className="flex items-start justify-between">
				<p className="text-sm text-zinc-500">{label}</p>
				<div
					className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}
				>
					{icon}
				</div>
			</div>
			<p className="mt-4 text-3xl font-bold tracking-tight">{value}</p>
			<p className="mt-1 text-xs text-zinc-500">{detail}</p>
		</div>
	);
}
