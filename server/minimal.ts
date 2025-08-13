import express from "express";
import { registerRoutes } from "./routes";

const app = express();
app.use(express.json());

// Test just the routes without vite
registerRoutes(app).then(server => {
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    console.log(`Minimal server running on port ${port}`);
  });
}).catch(error => {
  console.error("Error starting server:", error);
});