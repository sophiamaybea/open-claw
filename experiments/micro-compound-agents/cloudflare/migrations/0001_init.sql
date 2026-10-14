-- Cloudflare D1, read-only public dashboard / paper-only research
CREATE TABLE IF NOT EXISTS agent_documents (
  name TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_documents_updated
  ON agent_documents(updated_at);