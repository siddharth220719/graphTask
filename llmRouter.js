"use strict";

const express = require("express");
const db = require("./lib/db.js");
const messageStore = require(`./messageStore.js`);
const { callApi } = require('./lib/apicaller.js')
const router = express.Router();
const { v4: uuidv4 } = require("uuid");

/**
 * POST /api/transcripts/:id/generate
 * 1. Load transcript from DB
 * 2. Call LLM
 * 3. Return LLM response
 */
router.post("/api/transcripts/:id/generate", async (req, res) => {
    const { id } = req.params;

    // 1️⃣ Load transcript
    db.get(
        "SELECT transcript FROM transcripts WHERE id = ?",
        [id],
        async (err, row) => {
            if (err) {
                console.error("DB error:", err);
                return res.status(500).json({ error: "DB error" });
            }

            if (!row) {
                return res.status(404).json({ error: "Transcript not found" });
            }

            const transcript = row.transcript;

            try {
                // 2️⃣ Call LLM (you will replace logic here)
                const llmResponse = await callLLM(transcript);

                // 3️⃣ Return raw output (later you validate + sanitize)

              const graphId = uuidv4();

              db.run(
                `INSERT INTO task_graphs (id, transcript_id, graph_json) VALUES (?, ?, ?)`,
                [graphId, id, JSON.stringify(llmResponse)],
                function (err) {
                  if (err) {
                    console.error("Failed to save graph:", err);
                    return res.status(500).json({ error: "Failed to save graph" });
                  }

                  return res.json({
                    transcriptId: id,
                    graphId,
                    tasks: llmResponse
                  });
                }
              );

            } catch (e) {
                console.error("LLM error:", e);
                return res.status(500).json({ error: "LLM call failed" });
            }
        }
    );
});

/**
 * Dummy LLM call function
 * Replace this with your OpenAI logic
 */
async function callLLM(transcript) {
    const prompt = `Convert the following meeting transcript into actionable tasks with dependencies:
${transcript}`
    messageStore.resetMessages();
    messageStore.addUser(prompt);
    let llmReply = await callApi(messageStore.getMessages()); // plain string
    llmReply=extractJsonFromText(llmReply)
    llmReply=sanitizeDependencies(llmReply)
    llmReply=markBlockedIfCycle(llmReply)
    return llmReply
    
}

function extractJsonFromText(raw) {
  if (!raw || typeof raw !== "string") {
    throw new Error("Empty or non-string LLM response");
  }

  let text = raw.trim();

  // Remove code fences if present
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  }

  // If wrapped in quotes, unquote
  if (
    (text.startsWith("'") && text.endsWith("'")) ||
    (text.startsWith('"') && text.endsWith('"'))
  ) {
    text = text.slice(1, -1);
  }

  // Try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // continue to heuristic extraction
  }

  // Heuristic: find first JSON array or object in text
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    return JSON.parse(arrayMatch[0]);
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    return JSON.parse(objMatch[0]);
  }

  throw new Error("Could not extract valid JSON from LLM output");
}


function sanitizeDependencies(tasks) {
  if (!Array.isArray(tasks)) {
    throw new Error("tasks must be an array");
  }

  // Collect all valid IDs
  const validIds = new Set(tasks.map(t => t.id));

  // Sanitize dependencies
  const sanitized = tasks.map(task => {
    const deps = Array.isArray(task.dependencies) ? task.dependencies : [];

    const cleanDeps = deps.filter(depId => validIds.has(depId));

    return {
      ...task,
      dependencies: cleanDeps
    };
  });

  return sanitized;
}
function detectCycles(tasks) {
  const graph = new Map();   // id -> dependencies[]
  const ids = new Set(tasks.map(t => t.id));

  // Build adjacency list
  tasks.forEach(t => {
    graph.set(t.id, (t.dependencies || []).filter(d => ids.has(d)));
  });

  const visited = new Set();
  const inStack = new Set();
  const cycleNodes = new Set();

  function dfs(node) {
    if (inStack.has(node)) {
      cycleNodes.add(node);
      return true;
    }

    if (visited.has(node)) return false;

    visited.add(node);
    inStack.add(node);

    const deps = graph.get(node) || [];
    for (const dep of deps) {
      if (dfs(dep)) {
        cycleNodes.add(node);
        return true;
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const id of ids) {
    if (!visited.has(id)) {
      dfs(id);
    }
  }

  return cycleNodes; // Set of task IDs involved in cycles
}
function markBlockedIfCycle(tasks) {
  const cycleNodes = detectCycles(tasks);

  if (cycleNodes.size === 0) return tasks;

  return tasks.map(t => {
    if (cycleNodes.has(t.id)) {
      return { ...t, status: "Blocked/Error" };
    }
    return { ...t, status: "OK" };
  });
}
module.exports = router;