import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("msg_classifier.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    text TEXT,
    sender TEXT,
    phoneNumber TEXT,
    result TEXT,
    timestamp INTEGER,
    isRead INTEGER
  );

  CREATE TABLE IF NOT EXISTS contacts (
    phone TEXT PRIMARY KEY,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    phone TEXT
  );

  INSERT OR IGNORE INTO profile (id, name, phone) VALUES (1, 'Me', '+1 (000) 000-0000');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/messages", (req, res) => {
    const messages = db.prepare("SELECT * FROM messages ORDER BY timestamp DESC").all();
    res.json(messages.map(m => ({
      ...m,
      result: m.result ? JSON.parse(m.result as string) : null,
      isRead: !!m.isRead
    })));
  });

  app.post("/api/messages", (req, res) => {
    const { id, text, sender, phoneNumber, result, timestamp, isRead } = req.body;
    db.prepare(`
      INSERT INTO messages (id, text, sender, phoneNumber, result, timestamp, isRead)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, text, sender, phoneNumber, JSON.stringify(result), timestamp, isRead ? 1 : 0);
    res.status(201).json({ status: "ok" });
  });

  app.delete("/api/messages", (req, res) => {
    db.prepare("DELETE FROM messages").run();
    res.json({ status: "ok" });
  });

  app.get("/api/contacts", (req, res) => {
    const contacts = db.prepare("SELECT * FROM contacts").all();
    res.json(contacts);
  });

  app.post("/api/contacts", (req, res) => {
    const { name, phone } = req.body;
    db.prepare("INSERT OR REPLACE INTO contacts (name, phone) VALUES (?, ?)").run(name, phone);
    res.status(201).json({ status: "ok" });
  });

  app.delete("/api/contacts/:phone", (req, res) => {
    db.prepare("DELETE FROM contacts WHERE phone = ?").run(req.params.phone);
    res.json({ status: "ok" });
  });

  app.get("/api/profile", (req, res) => {
    const profile = db.prepare("SELECT * FROM profile WHERE id = 1").get();
    res.json(profile);
  });

  app.post("/api/profile", (req, res) => {
    const { name, phone } = req.body;
    db.prepare("UPDATE profile SET name = ?, phone = ? WHERE id = 1").run(name, phone);
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
