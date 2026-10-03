const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("Proxy backend is running!");
});

app.get("/proxy", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  try {
    const target = new URL(url);

    if (target.protocol !== "http:" && target.protocol !== "https:") {
      return res.status(400).send("Only HTTP and HTTPS URLs are allowed");
    }

    const response = await fetch(target);

    res.status(response.status);

    const contentType = response.headers.get("content-type");

    if (contentType) {
      res.set("Content-Type", contentType);
    }

    const body = await response.text();

    res.send(body);
  } catch (error) {
    console.error(error);
    res.status(500).send("Could not access that URL");
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Proxy running on port ${PORT}`);
});
