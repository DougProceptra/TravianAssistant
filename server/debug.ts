import express from "express";

const app = express();
app.use(express.json());

// Simple test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Test successful", timestamp: new Date().toISOString() });
});

const port = parseInt(process.env.PORT || '5000', 10);
app.listen(port, "0.0.0.0", () => {
  console.log(`Debug server running on port ${port}`);
});