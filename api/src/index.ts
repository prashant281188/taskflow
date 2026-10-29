import "dotenv/config";
import express, { type ErrorRequestHandler } from "express";
import helmet from "helmet";
import cors from "cors";
import { pool } from "./db";
import { tasksRouter } from "./routes/tasks";

const app = express();
const port = Number(process.env.PORT || 3000);
app.disable("x-powered-by");
app.use(helmet());
app.use(
	cors({
		origin:
			process.env.CORS_ORIGIN ?
				process.env.CORS_ORIGIN.split(",").map((item) => item.trim())
			:	true,
	}),
);
app.use(express.json({ limit: "32kb" }));
app.get("/health", (_req, res) =>
	res.json({ status: "ok", service: "taskflow-api" }),
);
app.get("/ready", async (_req, res) => {
	try {
		await pool.query("SELECT 1");
		res.json({ status: "ready", database: "connected" });
	} catch {
		res.status(503).json({ status: "not_ready", database: "disconnected" });
	}
});
app.use("/api/tasks", tasksRouter);
app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
	console.error(error);
	if (res.headersSent) return;
	res.status(500).json({ error: "Internal server error" });
};
app.use(errorHandler);
const server = app.listen(port, () =>
	console.log(`TaskFlow API listening on port ${port}`),
);
async function shutdown(signal: string) {
	console.log(`${signal} received; shutting down`);
	server.close(async () => {
		await pool.end();
		process.exit(0);
	});
	setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
