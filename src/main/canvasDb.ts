import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";

const DB_DIR = join(homedir(), ".config", "triage", "db");

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

export interface CanvasViewport {
  pan_x: number;
  pan_y: number;
  zoom: number;
}

interface CanvasData {
  version: number;
  nodes: CanvasNode[];
  zones: CanvasZone[];
  viewport: CanvasViewport;
}

const CURRENT_VERSION = 1;

function repoFileName(repo: string): string {
  return repo.replace(/\//g, "__") + ".json";
}

async function ensureDir(): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
}

/**
 * In-memory cache per repo to avoid reading from disk on every operation.
 * The cache is authoritative during the app session.
 */
const dataCache = new Map<string, CanvasData>();

async function readRepoData(repo: string): Promise<CanvasData> {
  const cached = dataCache.get(repo);
  if (cached) return cached;

  try {
    const raw = await readFile(join(DB_DIR, repoFileName(repo)), "utf-8");
    const data = JSON.parse(raw) as CanvasData;
    data.version = data.version ?? CURRENT_VERSION;
    dataCache.set(repo, data);
    return data;
  } catch {
    const fresh: CanvasData = {
      version: CURRENT_VERSION,
      nodes: [],
      zones: [],
      viewport: { pan_x: 0, pan_y: 0, zoom: 1 },
    };
    dataCache.set(repo, fresh);
    return fresh;
  }
}

/**
 * Debounced write: coalesces rapid writes into a single disk flush.
 * Uses atomic write (write to .tmp then rename) to prevent corruption.
 */
const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

function scheduleWrite(repo: string): void {
  const existing = pendingWrites.get(repo);
  if (existing) clearTimeout(existing);

  pendingWrites.set(
    repo,
    setTimeout(async () => {
      pendingWrites.delete(repo);
      const data = dataCache.get(repo);
      if (!data) return;
      try {
        await ensureDir();
        const filePath = join(DB_DIR, repoFileName(repo));
        const tmpPath = filePath + ".tmp";
        await writeFile(tmpPath, JSON.stringify(data, null, 2), "utf-8");
        await rename(tmpPath, filePath);
      } catch {
        // Silent write failure - in-memory cache is still authoritative
      }
    }, 500),
  );
}

// ── Node operations ──────────────────────────────────

export async function getNodes(repo: string): Promise<CanvasNode[]> {
  return (await readRepoData(repo)).nodes;
}

export async function updateNodePosition(
  repo: string,
  id: string,
  x: number,
  y: number,
): Promise<void> {
  const data = await readRepoData(repo);
  const node = data.nodes.find((n) => n.id === id);
  if (node) {
    node.x = x;
    node.y = y;
    scheduleWrite(repo);
  }
}

export async function updateNodeZone(
  repo: string,
  id: string,
  zoneId: string | null,
): Promise<void> {
  const data = await readRepoData(repo);
  const node = data.nodes.find((n) => n.id === id);
  if (node) {
    node.zone_id = zoneId;
    scheduleWrite(repo);
  }
}

export async function batchUpsertNodes(repo: string, nodes: CanvasNode[]): Promise<void> {
  const data = await readRepoData(repo);
  for (const node of nodes) {
    const idx = data.nodes.findIndex((n) => n.id === node.id);
    if (idx >= 0) data.nodes[idx] = node;
    else data.nodes.push(node);
  }
  scheduleWrite(repo);
}

export async function deleteNode(repo: string, id: string): Promise<void> {
  const data = await readRepoData(repo);
  data.nodes = data.nodes.filter((n) => n.id !== id);
  scheduleWrite(repo);
}

// ── Zone operations ──────────────────────────────────

export async function getZones(repo: string): Promise<CanvasZone[]> {
  return (await readRepoData(repo)).zones;
}

export async function upsertZone(repo: string, zone: CanvasZone): Promise<void> {
  const data = await readRepoData(repo);
  const idx = data.zones.findIndex((z) => z.id === zone.id);
  if (idx >= 0) data.zones[idx] = zone;
  else data.zones.push(zone);
  scheduleWrite(repo);
}

export async function updateZonePosition(
  repo: string,
  id: string,
  x: number,
  y: number,
): Promise<void> {
  const data = await readRepoData(repo);
  const zone = data.zones.find((z) => z.id === id);
  if (zone) {
    zone.x = x;
    zone.y = y;
    scheduleWrite(repo);
  }
}

export async function updateZoneSize(
  repo: string,
  id: string,
  w: number,
  h: number,
): Promise<void> {
  const data = await readRepoData(repo);
  const zone = data.zones.find((z) => z.id === id);
  if (zone) {
    zone.width = w;
    zone.height = h;
    scheduleWrite(repo);
  }
}

export async function updateZoneLabel(repo: string, id: string, label: string): Promise<void> {
  const data = await readRepoData(repo);
  const zone = data.zones.find((z) => z.id === id);
  if (zone) {
    zone.label = label;
    scheduleWrite(repo);
  }
}

export async function deleteZone(repo: string, id: string): Promise<void> {
  const data = await readRepoData(repo);
  data.zones = data.zones.filter((z) => z.id !== id);
  data.nodes = data.nodes.map((n) => (n.zone_id === id ? { ...n, zone_id: null } : n));
  scheduleWrite(repo);
}

// ── Viewport operations ──────────────────────────────

export async function getViewport(repo: string): Promise<CanvasViewport> {
  return (await readRepoData(repo)).viewport;
}

export async function saveViewport(repo: string, viewport: CanvasViewport): Promise<void> {
  const data = await readRepoData(repo);
  data.viewport = viewport;
  scheduleWrite(repo);
}

// ── Cleanup ──────────────────────────────────────────

/** Flush all pending writes immediately (call before app quit) */
export async function flushAll(): Promise<void> {
  for (const [repo, timer] of pendingWrites) {
    clearTimeout(timer);
    pendingWrites.delete(repo);
    const data = dataCache.get(repo);
    if (!data) continue;
    try {
      await ensureDir();
      const filePath = join(DB_DIR, repoFileName(repo));
      await writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch {
      // Best effort
    }
  }
}
