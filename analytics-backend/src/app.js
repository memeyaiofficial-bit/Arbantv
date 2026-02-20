import express from "express";
import analyticsRoutes from "./routes/analytics.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

app.use(express.json());
app.use("/api/analytics", analyticsRoutes);

// Global error handler (must be last)
app.use(errorHandler);

export default app;