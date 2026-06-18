import { WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || "secret";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const prisma = new PrismaClient();

// Two Redis connections: one to publish, one to subscribe (required by Redis).
const pub = new Redis(REDIS_URL);
const sub = new Redis(REDIS_URL);

const rooms = new Map(); // room -> Set<ws> connected to THIS server instance

// Redis delivers messages from any server instance -> fan out to local clients.
sub.on("message", (channel, message) => {
  const room = channel.replace("room:", "");
  for (const ws of rooms.get(room) || []) ws.send(message);
});

const wss = new WebSocketServer({ port: PORT });

wss.on("connection", (ws, req) => {
  const token = new URL(req.url, "http://x").searchParams.get("token");
  let user;
  try { user = jwt.verify(token, JWT_SECRET).username; }
  catch { return ws.close(); }

  // Verify the user exists in the database; close the socket if not.
  // Runs in parallel so we attach the message handler synchronously and
  // don't drop the client's first "join" message.
  prisma.user.findUnique({ where: { username: user } }).then((found) => {
    if (!found) ws.close();
  });

  let room = null;
  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    if (msg.type === "join") {
      room = msg.room;
      if (!rooms.has(room)) { rooms.set(room, new Set()); sub.subscribe("room:" + room); }
      rooms.get(room).add(ws);
    } else if (msg.type === "message" && room) {
      pub.publish("room:" + room, JSON.stringify({ user, text: msg.text }));
    }
  });

  ws.on("close", () => rooms.get(room)?.delete(ws));
});

console.log(`websocket server listening on ${PORT}`);
