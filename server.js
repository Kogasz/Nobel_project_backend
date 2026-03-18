import express from "express";
import cors from "cors";
import { connectDB } from "./db.js";
import laureaciRoutes from "./routes/laureaci.js";

const app = express();
const port = 3001;

app.use(cors());
await connectDB();

app.use("/api/", laureaciRoutes);

app.listen(port, () => {
  console.log(`Server działa na http://localhost:${port}`);
});