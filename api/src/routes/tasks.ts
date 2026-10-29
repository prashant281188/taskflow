import { Router } from "express";
import { z } from "zod";
import { pool } from "../db";

export const tasksRouter = Router();
const idSchema = z.string().regex(/^[1-9]\d*$/, "Invalid task ID");
const createSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().max(5000).optional() }).strict();
const updateSchema = z.object({ title: z.string().trim().min(1).max(200).optional(), description: z.string().trim().max(5000).nullable().optional(), completed: z.boolean().optional() }).strict().refine((value) => Object.keys(value).length > 0, "Provide at least one field to update");
const fields = "id::text AS id, title, description, completed, created_at, updated_at";

tasksRouter.get("/", async (_req, res, next) => {
  try { const result = await pool.query(`SELECT ${fields} FROM tasks ORDER BY created_at DESC, id DESC`); res.json({ data: result.rows }); } catch (error) { next(error); }
});
tasksRouter.get("/:id", async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id); if (!id.success) return res.status(400).json({ error: "Invalid task ID" });
  try { const result = await pool.query(`SELECT ${fields} FROM tasks WHERE id = $1`, [id.data]); if (!result.rowCount) return res.status(404).json({ error: "Task not found" }); res.json({ data: result.rows[0] }); } catch (error) { next(error); }
});
tasksRouter.post("/", async (req, res, next) => {
  const input = createSchema.safeParse(req.body); if (!input.success) return res.status(400).json({ error: input.error.issues[0]?.message ?? "Invalid task data" });
  try { const result = await pool.query(`INSERT INTO tasks (title, description) VALUES ($1, $2) RETURNING ${fields}`, [input.data.title, input.data.description || null]); res.status(201).json({ data: result.rows[0] }); } catch (error) { next(error); }
});
tasksRouter.patch("/:id", async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id); if (!id.success) return res.status(400).json({ error: "Invalid task ID" });
  const input = updateSchema.safeParse(req.body); if (!input.success) return res.status(400).json({ error: input.error.issues[0]?.message ?? "Invalid task data" });
  const data = input.data; const sets: string[] = []; const values: unknown[] = [];
  if (data.title !== undefined) { values.push(data.title); sets.push(`title = $${values.length}`); }
  if (data.description !== undefined) { values.push(data.description || null); sets.push(`description = $${values.length}`); }
  if (data.completed !== undefined) { values.push(data.completed); sets.push(`completed = $${values.length}`); }
  sets.push("updated_at = NOW()"); values.push(id.data);
  try { const result = await pool.query(`UPDATE tasks SET ${sets.join(", ")} WHERE id = $${values.length} RETURNING ${fields}`, values); if (!result.rowCount) return res.status(404).json({ error: "Task not found" }); res.json({ data: result.rows[0] }); } catch (error) { next(error); }
});
tasksRouter.delete("/:id", async (req, res, next) => {
  const id = idSchema.safeParse(req.params.id); if (!id.success) return res.status(400).json({ error: "Invalid task ID" });
  try { const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id.data]); if (!result.rowCount) return res.status(404).json({ error: "Task not found" }); res.status(204).end(); } catch (error) { next(error); }
});
