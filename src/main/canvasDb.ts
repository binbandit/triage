import Database from "better-sqlite3";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { app } from "electron";

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath("userData");
  const dbDir = join(userDataPath, "canvas");
  mkdirSync(dbDir, { recursive: true });
  const dbPath = join(dbDir, "canvas.db");

  db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      repo TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('pr', 'issue')),
      number INTEGER NOT NULL,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 240,
      height REAL NOT NULL DEFAULT 100,
      zone_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(repo, type, number)
    );

    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY,
      repo TEXT NOT NULL,
      label TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#3b82f6',
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 400,
      height REAL NOT NULL DEFAULT 300,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS viewport (
      repo TEXT PRIMARY KEY,
      pan_x REAL NOT NULL DEFAULT 0,
      pan_y REAL NOT NULL DEFAULT 0,
      zoom REAL NOT NULL DEFAULT 1
    );

    CREATE INDEX IF NOT EXISTS idx_nodes_repo ON nodes(repo);
    CREATE INDEX IF NOT EXISTS idx_zones_repo ON zones(repo);
  `);

  return db;
}

// ── Node operations ──────────────────────────────────

export interface CanvasNode {
  id: string;
  repo: string;
  type: "pr" | "issue";
  number: number;
  x: number;
  y: number;
  width: number;
  height: number;
  zone_id: string | null;
}

export function getNodes(repo: string): CanvasNode[] {
  return getDb().prepare("SELECT * FROM nodes WHERE repo = ?").all(repo) as CanvasNode[];
}

export function upsertNode(node: CanvasNode): void {
  getDb()
    .prepare(
      `INSERT INTO nodes (id, repo, type, number, x, y, width, height, zone_id)
       VALUES (@id, @repo, @type, @number, @x, @y, @width, @height, @zone_id)
       ON CONFLICT(id) DO UPDATE SET x=@x, y=@y, width=@width, height=@height, zone_id=@zone_id`,
    )
    .run(node);
}

export function updateNodePosition(id: string, x: number, y: number): void {
  getDb().prepare("UPDATE nodes SET x = ?, y = ? WHERE id = ?").run(x, y, id);
}

export function updateNodeZone(id: string, zoneId: string | null): void {
  getDb().prepare("UPDATE nodes SET zone_id = ? WHERE id = ?").run(zoneId, id);
}

export function deleteNode(id: string): void {
  getDb().prepare("DELETE FROM nodes WHERE id = ?").run(id);
}

export function deleteNodesForRepo(repo: string): void {
  getDb().prepare("DELETE FROM nodes WHERE repo = ?").run(repo);
}

// ── Zone operations ──────────────────────────────────

export interface CanvasZone {
  id: string;
  repo: string;
  label: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function getZones(repo: string): CanvasZone[] {
  return getDb().prepare("SELECT * FROM zones WHERE repo = ?").all(repo) as CanvasZone[];
}

export function upsertZone(zone: CanvasZone): void {
  getDb()
    .prepare(
      `INSERT INTO zones (id, repo, label, color, x, y, width, height)
       VALUES (@id, @repo, @label, @color, @x, @y, @width, @height)
       ON CONFLICT(id) DO UPDATE SET label=@label, color=@color, x=@x, y=@y, width=@width, height=@height`,
    )
    .run(zone);
}

export function updateZonePosition(id: string, x: number, y: number): void {
  getDb().prepare("UPDATE zones SET x = ?, y = ? WHERE id = ?").run(x, y, id);
}

export function updateZoneSize(id: string, width: number, height: number): void {
  getDb().prepare("UPDATE zones SET width = ?, height = ? WHERE id = ?").run(width, height, id);
}

export function updateZoneLabel(id: string, label: string): void {
  getDb().prepare("UPDATE zones SET label = ? WHERE id = ?").run(label, id);
}

export function deleteZone(id: string): void {
  getDb().prepare("UPDATE nodes SET zone_id = NULL WHERE zone_id = ?").run(id);
  getDb().prepare("DELETE FROM zones WHERE id = ?").run(id);
}

// ── Viewport operations ──────────────────────────────

export interface CanvasViewport {
  pan_x: number;
  pan_y: number;
  zoom: number;
}

export function getViewport(repo: string): CanvasViewport {
  const row = getDb().prepare("SELECT * FROM viewport WHERE repo = ?").get(repo) as
    | CanvasViewport
    | undefined;
  return row ?? { pan_x: 0, pan_y: 0, zoom: 1 };
}

export function saveViewport(repo: string, viewport: CanvasViewport): void {
  getDb()
    .prepare(
      `INSERT INTO viewport (repo, pan_x, pan_y, zoom)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(repo) DO UPDATE SET pan_x=?, pan_y=?, zoom=?`,
    )
    .run(
      repo,
      viewport.pan_x,
      viewport.pan_y,
      viewport.zoom,
      viewport.pan_x,
      viewport.pan_y,
      viewport.zoom,
    );
}

// ── Batch operations ─────────────────────────────────

export function batchUpsertNodes(nodes: CanvasNode[]): void {
  const stmt = getDb().prepare(
    `INSERT INTO nodes (id, repo, type, number, x, y, width, height, zone_id)
     VALUES (@id, @repo, @type, @number, @x, @y, @width, @height, @zone_id)
     ON CONFLICT(id) DO UPDATE SET x=@x, y=@y, width=@width, height=@height, zone_id=@zone_id`,
  );
  const tx = getDb().transaction((items: CanvasNode[]) => {
    for (const item of items) stmt.run(item);
  });
  tx(nodes);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
