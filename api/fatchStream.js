import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      return res.status(404).json({ error: "No video found" });

    const video = data.list[0];

    res.status(200).json({
      title: video.name,
      thumbnail: video.thumbnail,
      duration: video.duration,
      streams: video.fast_stream_url,
      download: video.fast_download_link,
      subtitle: video.subtitle_url,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch stream" });
  }
}