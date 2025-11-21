// server/src/app.js
import "dotenv/config";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { corsMiddleware } from "./config/cors.js";
import routes from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/", routes);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`API listening on :${port}`);
  console.log(`CORS origin: ${process.env.WEB_ORIGIN || "http://localhost:5173"}`);
});

export default app;
