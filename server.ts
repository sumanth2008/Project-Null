import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "NullMatrix API is online." });
  });

  // Example of a secure API endpoint that could be used for sensitive operations
  // This endpoint is protected and requires authentication (simulated here)
  app.post("/api/secure-operation", (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    // In a real scenario, you would verify the Firebase ID token here
    // using firebase-admin SDK.
    const { action, payload } = req.body;
    
    if (!action) {
      return res.status(400).json({ error: "Action is required" });
    }

    // Process the secure operation
    console.log(`Processing secure action: ${action}`);
    
    res.json({ 
      success: true, 
      message: `Secure operation '${action}' executed successfully.`,
      timestamp: new Date().toISOString()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
