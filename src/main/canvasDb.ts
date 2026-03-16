import { readFile, writeFile, mkdir } from "node:fs/promises";
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
  nodes: CanvasNode[];
  zones: CanvasZone[];
  viewport: CanvasViewport;
}

function repoFileName(repo: string): string {
  return repo.replace("/", "__") + ".json";
}

async function ensureDir(): Promise<void> {
  await mkdir(DB_DIR, { recursive: true });
}

async function readRepoData(repo: string): Promise<CanvasData> {
  try {
    const raw = await readFile(join(DB_DIR, repoFileName(repo)), "utf-8");
    return JSON.parse(raw) as CanvasData;
  } catch {
    return { nodes: [], zones: [], viewport: { pan_x: 0, pan_y: 0, zoom: 1 } };
  }
}

async function writeRepoData(repo: string, data: CanvasData): Promise<void> {
  await ensureDir();
  await writeFile(join(DB_DIR, repoFileName(repo)), JSON.stringify(data, null, 2), "utf-8");
}

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
    await writeRepoData(repo, data);
  }
}

export async function batchUpsertNodes(repo: string, nodes: CanvasNode[]): Promise<void> {
  const data = await readRepoData(repo);
  for (const node of nodes) {
    const idx = data.nodes.findIndex((n) => n.id === node.id);
    if (idx >= 0) data.nodes[idx] = node;
    else data.nodes.push(node);
  }
  await writeRepoData(repo, data);
}

export async function deleteNode(repo: string, id: string): Promise<void> {
  const data = await readRepoData(repo);
  data.nodes = data.nodes.filter((n) => n.id !== id);
  await writeRepoData(repo, data);
}

export async function getZones(repo: string): Promise<CanvasZone[]> {
  return (await readRepoData(repo)).zones;
}

export async function upsertZone(repo: string, zone: CanvasZone): Promise<void> {
  const data = await readRepoData(repo);
  const idx = data.zones.findIndex((z) => z.id === zone.id);
  if (idx >= 0) data.zones[idx] = zone;
  else data.zones.push(zone);
  await writeRepoData(repo, data);
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
    await writeRepoData(repo, data);
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
    await writeRepoData(repo, data);
  }
}

export async function updateZoneLabel(repo: string, id: string, label: string): Promise<void> {
  const data = await readRepoData(repo);
  const zone = data.zones.find((z) => z.id === id);
  if (zone) {
    zone.label = label;
    await writeRepoData(repo, data);
  }
}

export async function deleteZone(repo: string, id: string): Promise<void> {
  const data = await readRepoData(repo);
  data.zones = data.zones.filter((z) => z.id !== id);
  data.nodes = data.nodes.map((n) => (n.zone_id === id ? { ...n, zone_id: null } : n));
  await writeRepoData(repo, data);
}

export async function getViewport(repo: string): Promise<CanvasViewport> {
  return (await readRepoData(repo)).viewport;
}

export async function saveViewport(repo: string, viewport: CanvasViewport): Promise<void> {
  const data = await readRepoData(repo);
  data.viewport = viewport;
  await writeRepoData(repo, data);
}
