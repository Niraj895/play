// Simple in-memory mapping (for demo)
// For production, use DB like SQLite / Supabase / MongoDB
const links = {};

/**
 * Generate a short link
 * POST /api/generate
 * Body: { url: "original Terabox URL" }
 */
export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  // Generate 6-character short ID
  const id = Math.random().toString(36).substring(2, 8);
  links[id] = url;

  // Return the short link path
  res.status(200).json({ shortLink: `/v/${id}` });
}

/**
 * Fetch original URL by short ID
 * Used for redirecting / opening ads or play page
 */
export function getUrlById(id) {
  return links[id] || null;
}

/**
 * Optional: handler for short link redirect
 * Example usage: GET /v/:id
 * Redirects user to ads page or directly to play page
 */
export function shortLinkRedirectHandler(req, res) {
  const id = req.params.id;
  const originalUrl = getUrlById(id);

  if (!originalUrl) {
    return res.status(404).send("Short link not found");
  }

  // Example: redirect to ads page with token
  // Token is Base64 of original URL
  const token = Buffer.from(originalUrl).toString("base64");
  res.redirect(`/ads.html?token=${token}`);
}
