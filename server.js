const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Proxy backend is running!");
});

app.get("/proxy", async (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send("Missing URL");

  try {
    const target = new URL(url);
    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return res.status(400).send("Only HTTP and HTTPS URLs are allowed");
    }

    // Forward request mimicking a standard desktop browsing client profile
    const response = await fetch(target, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    res.status(response.status);

    // Filter headers to neutralize frame blockers & strict security policies
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-security-policy' &&
        lowerKey !== 'x-frame-options' &&
        lowerKey !== 'content-encoding' // Let Express handle transfer payloads natively
      ) {
        res.set(key, value);
      }
    });

    // Enforce open sharing controls for the sandbox environment
    res.set("Access-Control-Allow-Origin", "*");

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") || contentType.includes("application/javascript")) {
      let body = await response.text();
      res.send(body);
    } else {
      // Direct stream buffer delivery for image assets/avatars
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }

  } catch (error) {
    console.error(error);
    res.status(500).send("Could not access that URL");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
