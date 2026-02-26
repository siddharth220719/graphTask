
# InsightBoard – Dependency Engine (Level 1)

**Live API:**
[https://graphtask.onrender.com](https://graphtask.onrender.com)

**GitHub Repo:**
https://github.com/siddharth220719/graphTask.git

---

## ✅ Level Completed

**Level 1 — The Robust Backend**

This project implements a backend service that converts raw meeting transcripts into a structured **Dependency Graph of actionable tasks**, ensures logical consistency (no invalid dependencies or cycles), and persists both the original transcript and the generated graph.

---

## 🧠 Tech Stack

* **Backend:** Node.js + Express (JavaScript)
* **LLM API:** OpenAI GPT-4.1-mini (via API gateway)
* **Database:** SQLite
* **Hosting:** Render (Free Tier)
* **HTTP Client:** Axios

---

## 🔌 API Endpoints

### 1️⃣ Save Transcript

**POST** `/api/transcripts`

**Request Body**

```json
{
  "transcript": "Full meeting transcript here..."
}
```

**Response**

```json
{
  "id": "2323c658-9da1-4c20-9bb9-68596447904d",
  "message": "Transcript saved successfully"
}
```

---

### 2️⃣ Generate Dependency Graph from Transcript

**POST**
`/api/transcripts/:id/generate`

Example:

```
POST https://graphtask.onrender.com/api/transcripts/2323c658-9da1-4c20-9bb9-68596447904d/generate
```

**Request Body**

```json
{}
```

**Response (example)**

```json
{
  "transcriptId": "2323c658-9da1-4c20-9bb9-68596447904d",
  "graphId": "b28e192b-4804-4286-b961-323fe1e0b9f1",
  "tasks": [
    [
      {
        "id": 1,
        "description": "Fix the race condition causing intermittent Stripe payment gateway failures under load and redeploy a patched build",
        "priority": "P0",
        "dependencies": []
      },
      {
        "id": 2,
        "description": "Provide a stable build to QA by Monday morning for full regression testing",
        "priority": "P0",
        "dependencies": [1]
      }
    ]
  ]
}
```

---

## 🧩 Output Schema

Each task follows this strict schema:

```json
{
  "id": <number>,
  "description": <string>,
  "priority": "P0" | "High" | "Medium" | "Low",
  "dependencies": [<task_id>, ...]
}
```

---

## 🛡️ Data Integrity & Validation

### ✔ Dependency Validation (Sanitization)

LLMs may hallucinate dependency IDs.
The backend automatically:

* Collects all valid task IDs
* Removes any dependency IDs that do not exist

```js
function sanitizeDependencies(tasks) {
  const validIds = new Set(tasks.map(t => t.id));
  return tasks.map(task => ({
    ...task,
    dependencies: (task.dependencies || []).filter(d => validIds.has(d))
  }));
}
```

---

### 🔁 Cycle Detection (Logic Test)

Circular dependencies are invalid (e.g., A → B → A).
The backend detects cycles using DFS and marks tasks as `"Blocked/Error"` if found.

```js
function detectCycles(tasks) { /* DFS-based cycle detection */ }
function markBlockedIfCycle(tasks) { /* marks tasks if cycles exist */ }
```

This ensures the graph is logically executable.

---

## 💾 Data Persistence (Level 1 Requirement)

The backend stores:

* ✅ Original transcript
* ✅ Generated dependency graph

### Tables

**transcripts**

* `id`
* `transcript`
* `created_at`

**task_graphs**

* `id`
* `transcript_id`
* `graph_json`
* `created_at`

Each generation creates a new graph record (idempotency is handled in Level 2, not required for Level 1).

---

## 🧪 Robust JSON Extraction

Since LLMs may return text instead of raw JSON, the backend safely extracts JSON from text responses:

```js
function extractJsonFromText(raw) {
  // removes code fences, quotes, extracts JSON array/object
}
```

This ensures the API never crashes on malformed LLM output.

---

## 🚀 Deployment

The backend is deployed on **Render (Free Tier)**.

**Public URL:**
[https://graphtask.onrender.com](https://graphtask.onrender.com)

> Note: Render free tier may restart services on inactivity. SQLite persistence may reset on redeploy. This is acceptable for the assignment demo.

---

## 🧠 LLM Configuration

* **Model:** GPT-4.1-mini
* **Prompting Strategy:**
  System prompt enforces structured task extraction
* **Backend Safety:**
  All LLM outputs are validated, sanitized, and cycle-checked before saving

---

## 🛠️ How to Run Locally

```bash
git clone <YOUR_REPO_URL>
cd <repo>
npm install
node server.js
```

Set environment variables:

```bash
API_KEY=your_openai_key
AI_MODEL=gpt-4.1-mini
MODEL_PROTOCOL=https
MODEL_HOST=api.openai.com
MODEL_PORT=443
MODEL_ENDPOINT=/v1/chat/completions
```

---

## 📋 Submission Checklist (From PDF)

* ✅ GitHub Repo Link
* ✅ Live Hosted App Link
* ✅ Level Completed Mentioned (Level 1)
* ✅ LLM API & Tech Stack Mentioned
* ✅ Cycle Detection Explained
* ❌ Idempotency (Level 2 – Not implemented)
* ❌ Visualization (Level 3 – Not implemented)
* ✅ Setup Instructions

---

## 🧩 Future Work (Not Required for Level 1)

* Level 2: Async job processing + idempotency
* Level 3: Visual graph UI (React Flow / Mermaid.js)

---

If you want, I can also:

* Clean up the nested `tasks: [[...]]` shape into a flat array (small improvement),
* Or help you add a `/health` endpoint for reviewers.
