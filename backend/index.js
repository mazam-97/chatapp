import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const PORT = process.env.PORT || 3001;

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

app.post("/signup", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "username and password required" });
  if (await prisma.user.findUnique({ where: { username } })) return res.status(409).json({ error: "user already exists" });
  await prisma.user.create({ data: { username, password } });
  res.json({ token: jwt.sign({ username }, JWT_SECRET) });
});

app.post("/signin", async (req, res) => {
  const { username, password } = req.body;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || user.password !== password) return res.status(401).json({ error: "invalid credentials" });
  res.json({ token: jwt.sign({ username }, JWT_SECRET) });
});

app.listen(PORT, () => console.log(`backend listening on ${PORT}`));
