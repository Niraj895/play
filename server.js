import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = 3000;

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Body parser + static files
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ====== In-memory shortlink storage ======
const links = {}; // id => Terabox URL

// ====== Pages ======
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "pages", "index.html")));
app.get("/page1.html", (req, res) => res.sendFile(path.join(__dirname, "pages", "page1.html")));
app.get("/page2.html", (req, res) => res.sendFile(path.join(__dirname, "pages", "page2.html")));
app.get("/play.html", (req, res) => res.sendFile(path.join(__dirname, "pages", "play.html")));

// ====== Shortlink redirect with ad flow ======
app.get("/v/:id", (req, res) => {
  const { id } = req.params;
  const url = links[id];
  if (!url) return res.status(404).send("Link not found");

  const token = Buffer.from(url).toString("base64");
  const short = `/v/${id}`;
  // Redirect to page1 with token + short
  res.redirect(`/page1.html?token=${token}&short=${encodeURIComponent(short)}`);
});

// ====== API: /api/generate ======
app.post("/api/generate", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  const id = Math.random().toString(36).substring(2, 8);
  links[id] = url;

  res.json({ shortLink: `/v/${id}` });
});

// ====== API: /api/fetchStream ======
app.post("/api/fetchStream", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Terabox URL required" });

  try {
    const response = await fetch("https://xapiverse.com/api/terabox", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xAPIverse-Key": process.env.XAPIVERSE_KEY,
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (!data.list || data.list.length === 0)
      return res.status(404).json({ error: "No files found" });

    res.json(data.list[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch stream" });
  }
});

// ====== Start server ======
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));