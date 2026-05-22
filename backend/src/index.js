import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import appointmentRoutes from "./routes/appointments.js";
import queueRoutes from "./routes/queue.js";
import anamneseRoutes from "./routes/anamnese.js";
import prontuarioRoutes from "./routes/prontuarios.js";
import userRoutes from "./routes/users.js";
import reportRoutes from "./routes/reports.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";

const app = express();

app.use(cors({
  origin: isProd ? process.env.FRONTEND_URL || true : "http://localhost:5173",
  credentials: true,
}));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/anamnese", anamneseRoutes);
app.use("/api/prontuarios", prontuarioRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);

if (isProd) {
  const distPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => res.sendFile(path.join(distPath, "index.html")));
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Erro interno do servidor." });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
