import express from "express";
import { createServer } from "node:http";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import wisp from "wisp-server-node";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

// Serve your frontend interface from the 'public' sub-directory
app.use(express.static(join(__dirname, "public")));

// Serve internal pre-built Ultraviolet scripts directly out of node_modules
app.use("/uv/", express.static(uvPath));

// Fallback routing: safely bounce fallback navigation loops to index
app.use((req, res) => {
  res.status(404).sendFile(join(__dirname, "public", "index.html"));
});

// Mount the Wisp real-time WebSocket protocol router to process frame data streams
server.on("upgrade", (req, socket, head) => {
  if (req.url.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.end();
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Ultraviolet engine successfully initialized on port ${PORT}`);
});
