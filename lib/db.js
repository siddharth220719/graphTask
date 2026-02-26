const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(path.join(process.cwd(), "/db/data.db"));

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS transcripts (
      id TEXT PRIMARY KEY,
      transcript TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});
db.run(`
  CREATE TABLE IF NOT EXISTS task_graphs (
    id TEXT PRIMARY KEY,
    transcript_id TEXT NOT NULL,
    graph_json TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id)
  )
`);

module.exports = db;