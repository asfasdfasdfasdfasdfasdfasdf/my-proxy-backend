const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

// Health check endpoint to help diagnose Render sleep intervals
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

    // Forward the client request mimicking standard desktop configuration footprints
    const response = await fetch(target, {
      method: req.method,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': req.headers['accept'] || '*/*',
        'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9'
      }
    });

    res.status(response.status);

    // Pass safe headers back to the app frame container environment
    response.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (
        lowerKey !== 'content-security-policy' &&
        lowerKey !== 'x-frame-options' &&
        lowerKey !== 'content-encoding' &&
        lowerKey !== 'clear-site-data'
      ) {
        res.set(key, value);
      }
    });

    // Enforce open sharing controls for the application container
    res.set("Access-Control-Allow-Origin", "*");

    const contentType = response.headers.get("content-type") || "";
    
    // Process text formats to inject source redirection strings 
    if (contentType.includes("text/html") || contentType.includes("application/javascript") || contentType.includes("text/css")) {
      let body = await response.text();
      
      // Dynamic link rewrites: intercept references heading to Discord and route them back into our endpoint
      const proxyServerAddress = `${req.protocol}://${req.get('host')}/proxy?url=`;
      
      // Replace hardcoded links pointing directly to Discord endpoints
      body = body.replace(/https:\/\/discord\.com/g, proxyServerAddress + encodeURIComponent('https://discord.com'));
      body = body.replace(/https:\/\/www\.discord\.com/g, proxyServerAddress + encodeURIComponent('https://discord.com'));
      body = body.replace(/https:\/\/discordapp\.com/g, proxyServerAddress + encodeURIComponent('https://discordapp.com'));

      res.send(body);
    } else {
      // Direct stream buffer delivery for graphics and binary components
      const arrayBuffer = await response.arrayBuffer();
      res.send(Buffer.from(arrayBuffer));
    }

  } catch (error) {
    console.error("Backend Proxy Core Exception:", error);
    res.status(500).send("Could not access that URL safely.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy running on port ${PORT}`));
