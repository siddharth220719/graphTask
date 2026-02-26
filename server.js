"use strict";

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const db = require("./lib/db");

const app = express();
app.use(express.json());

// Upload transcript
app.post("/api/transcripts", (req, res) => {
  const { transcript } = req.body;

  if (!transcript || typeof transcript !== "string") {
    return res.status(400).json({ error: "transcript is required" });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO transcripts (id, transcript) VALUES (?, ?)`,
    [id, transcript],
    function (err) {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: "Failed to save transcript" });
      }

      res.json({
        id,
        message: "Transcript saved successfully"
      });
    }
  );
});

const llmRoutes = require("./llmRouter.js");
app.use(llmRoutes);

app.listen(3000, () => {
  console.log("✅ Server running at http://localhost:3000");
});