import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   ES MODULE __dirname FIX
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (public/js, css, images)
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   IN-MEMORY LINK STORE
   (Production me DB use karo)
================================ */
const links = {}; // { id: originalUrl }

/* ===============================
   PAGE ROUTES
================================ */
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "pages", "index.html"))
);

app.get("/page1.html", (req, res) =>
  res.sendFile(path.join(__dirname, "pages", "page1.html"))
);

app.get("/page2.html", (req, res) =>
  res.sendFile(path.join(__dirname, "pages", "page2.html"))
);

app.get("/play.html", (req, res) =>
  res.sendFile(path.join(__dirname, "pages", "play.html"))
);

/* ===============================
   SHORT LINK HANDLER
   /v/:id
================================ */
app.get("/v/:id", (req, res) => {
  const { id } = req.params;
  const originalUrl = links[id];

  if (!originalUrl) {
    return res.status(404).send("Link not found");
  }

  // Base64 encode original URL
  const token = Buffer.from(originalUrl).toString("base64");

  // Redirect to page1 with token
  res.redirect(`/page1.html?token=${encodeURIComponent(token)}`);
});

/* ===============================
   API: GENERATE SHORT LINK
================================ */
app.post("/api/generate", (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Valid URL required" });
  }

  const id = Math.random().toString(36).substring(2, 8);
  links[id] = url;

  res.json({
    shortLink: `/v/${id}`
  });
});

/* ===============================
   API: FETCH TERABOX STREAM
================================ */
app.post("/api/fetchStream", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.startsWith("http")) {
    return res.status(400).json({ error: "Invalid Terabox URL" });
  }

  if (!process.env.XAPIVERSE_KEY) {
    return res.status(500).json({ error: "API key missing" });
  }

  try {
    const apiRes = await fetch("https://xapiverse.com/api/terabox", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xAPIverse-Key": process.env.XAPIVERSE_KEY
      },
      body: JSON.stringify({ url })
    });

    if (!apiRes.ok) {
      return res.status(502).json({ error: "Terabox API failed" });
    }

    const data = await apiRes.json();

    if (!data || !data.list || data.list.length === 0) {
      return res.status(404).json({ error: "No video found" });
    }

    // Send first video object
    res.json(data.list[0]);
  } catch (err) {
    console.error("FetchStream Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===============================
   404 FALLBACK
================================ */
app.use((req, res) => {
  res.status(404).send("Page not found");
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
