import { create } from "zustand";
import type { PullRequest, Issue } from "../types";
import { parseLinkedIssues } from "../lib/parseIssues";

/**
 * Debounced IPC call helper. Coalesces rapid calls per key into a single IPC.
 */
const debouncedCalls = new Map<string, ReturnType<typeof setTimeout>>();
function debouncedIPC(key: string, fn: () => void, delay = 100): void {
  const existing = debouncedCalls.get(key);
  if (existing) clearTimeout(existing);
  debouncedCalls.set(
    key,
    setTimeout(() => {
      debouncedCalls.delete(key);
      fn();
    }, delay),
  );
}

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

export interface CanvasArrow {
  fromId: string;
  toId: string;
}

interface CanvasViewport {
  panX: number;
  panY: number;
  zoom: number;
}

interface CanvasStore {
  nodes: CanvasNode[];
  zones: CanvasZone[];
  arrows: CanvasArrow[];
  viewport: CanvasViewport;
  loading: boolean;
  selectedNodeId: string | null;
  searchQuery: string;

  loadCanvas: (repo: string, prs: PullRequest[], issues: Issue[]) => Promise<void>;
  moveNode: (id: string, x: number, y: number) => void;
  moveZone: (id: string, x: number, y: number) => void;
  resizeZone: (id: string, width: number, height: number) => void;
  addZone: (repo: string) => void;
  deleteZone: (id: string) => void;
  renameZone: (id: string, label: string) => void;
  selectNode: (id: string | null) => void;
  setViewport: (viewport: CanvasViewport) => void;
  saveViewport: (repo: string) => void;
  resetLayout: (repo: string, prs: PullRequest[], issues: Issue[]) => Promise<void>;
  setSearch: (query: string) => void;
}

function makeNodeId(type: "pr" | "issue", number: number): string {
  return `${type}-${number}`;
}

/**
 * Relationship-aware auto-layout.
 * Groups linked issues and PRs into clusters, placing the PR card
 * with its linked issues below it. Unlinked items go in a separate grid.
 */
function autoLayout(
  items: { id: string; type: string; number: number }[],
  arrows: CanvasArrow[],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const nodeW = 260;
  const nodeH = 110;
  const gapX = 32;
  const gapY = 28;
  const clusterGap = 60;
  const margin = 60;

  // Build adjacency: PR -> linked issue IDs
  const prToIssues = new Map<string, string[]>();
  const linkedIssueIds = new Set<string>();
  for (const arrow of arrows) {
    const existing = prToIssues.get(arrow.toId) ?? [];
    existing.push(arrow.fromId);
    prToIssues.set(arrow.toId, existing);
    linkedIssueIds.add(arrow.fromId);
  }

  // Build clusters: each cluster is a PR + its linked issues
  type Cluster = { prId: string; issueIds: string[] };
  const clusters: Cluster[] = [];
  const assignedItems = new Set<string>();

  // PRs with linked issues form clusters
  for (const item of items) {
    if (item.type !== "pr") continue;
    const linkedIds = prToIssues.get(item.id);
    if (linkedIds && linkedIds.length > 0) {
      const validIssues = linkedIds.filter((id) => items.some((i) => i.id === id));
      if (validIssues.length > 0) {
        clusters.push({ prId: item.id, issueIds: validIssues });
        assignedItems.add(item.id);
        for (const iid of validIssues) assignedItems.add(iid);
      }
    }
  }

  // Unlinked items
  const unlinkedPRs = items.filter((i) => i.type === "pr" && !assignedItems.has(i.id));
  const unlinkedIssues = items.filter((i) => i.type === "issue" && !assignedItems.has(i.id));

  let cursorX = margin;
  let cursorY = margin;
  let rowMaxHeight = 0;
  const maxRowWidth = Math.max(2400, (nodeW + gapX) * 6);

  // Layout clusters: PR on top, linked issues below
  for (const cluster of clusters) {
    const issueCount = cluster.issueIds.length;
    const clusterWidth = Math.max(nodeW, issueCount * (nodeW + gapX) - gapX);
    const clusterHeight = nodeH + gapY + nodeH; // PR row + issue row

    if (cursorX + clusterWidth > maxRowWidth && cursorX > margin) {
      cursorX = margin;
      cursorY += rowMaxHeight + clusterGap;
      rowMaxHeight = 0;
    }

    // PR centered above its issues
    const prX = cursorX + (clusterWidth - nodeW) / 2;
    positions.set(cluster.prId, { x: prX, y: cursorY });

    // Issues in a row below the PR
    cluster.issueIds.forEach((issueId, i) => {
      positions.set(issueId, {
        x: cursorX + i * (nodeW + gapX),
        y: cursorY + nodeH + gapY,
      });
    });

    rowMaxHeight = Math.max(rowMaxHeight, clusterHeight);
    cursorX += clusterWidth + clusterGap;
  }

  // Add gap before unlinked items
  if (clusters.length > 0 && (unlinkedPRs.length > 0 || unlinkedIssues.length > 0)) {
    cursorX = margin;
    cursorY += rowMaxHeight + clusterGap * 2;
    rowMaxHeight = 0;
  }

  // Layout unlinked PRs in a grid
  const unlinkedCols = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(unlinkedPRs.length))));
  unlinkedPRs.forEach((item, i) => {
    const col = i % unlinkedCols;
    const row = Math.floor(i / unlinkedCols);
    positions.set(item.id, {
      x: cursorX + col * (nodeW + gapX),
      y: cursorY + row * (nodeH + gapY),
    });
  });

  // Unlinked issues below unlinked PRs
  const unlinkedPRRows = Math.ceil(unlinkedPRs.length / unlinkedCols);
  const issueStartY =
    cursorY + (unlinkedPRs.length > 0 ? unlinkedPRRows * (nodeH + gapY) + clusterGap : 0);
  const issueCols = Math.max(1, Math.min(6, Math.ceil(Math.sqrt(unlinkedIssues.length))));
  unlinkedIssues.forEach((item, i) => {
    const col = i % issueCols;
    const row = Math.floor(i / issueCols);
    positions.set(item.id, {
      x: cursorX + col * (nodeW + gapX),
      y: issueStartY + row * (nodeH + gapY),
    });
  });

  return positions;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  nodes: [],
  zones: [],
  arrows: [],
  viewport: { panX: 0, panY: 0, zoom: 1 },
  loading: false,
  selectedNodeId: null,
  searchQuery: "",

  loadCanvas: async (repo, prs, issues) => {
    // Only show loading spinner on first load, not on updates
    if (get().nodes.length === 0) {
      set({ loading: true });
    }

    try {
      // Load saved state from DB
      const [savedNodes, savedZones, savedViewport] = await Promise.all([
        window.api.canvasGetNodes(repo),
        window.api.canvasGetZones(repo),
        window.api.canvasGetViewport(repo),
      ]);

      const existingNodeMap = new Map<string, CanvasNode>();
      if (Array.isArray(savedNodes)) {
        for (const n of savedNodes as CanvasNode[]) existingNodeMap.set(n.id, n);
      }

      // Build all items (PRs + issues)
      const allItems: { id: string; type: "pr" | "issue"; number: number }[] = [];
      for (const pr of prs)
        allItems.push({ id: makeNodeId("pr", pr.number), type: "pr", number: pr.number });
      for (const issue of issues)
        allItems.push({
          id: makeNodeId("issue", issue.number),
          type: "issue",
          number: issue.number,
        });

      // Compute arrows BEFORE layout so we can group linked items
      const allItemIds = new Set(allItems.map((i) => i.id));
      const arrowSet: CanvasArrow[] = [];
      for (const pr of prs) {
        const linked = parseLinkedIssues(pr.body);
        for (const issue of linked) {
          const fromId = makeNodeId("issue", issue.number);
          const toId = makeNodeId("pr", pr.number);
          if (allItemIds.has(fromId) && allItemIds.has(toId)) {
            arrowSet.push({ fromId, toId });
          }
        }
      }

      // Find items that need positions (not in DB)
      const newItems = allItems.filter((item) => !existingNodeMap.has(item.id));
      const newPositions = autoLayout(newItems, arrowSet);

      // Build final node list
      const nodes: CanvasNode[] = allItems.map((item) => {
        const saved = existingNodeMap.get(item.id);
        if (saved) return saved;
        const pos = newPositions.get(item.id) ?? { x: 0, y: 0 };
        return {
          id: item.id,
          repo,
          type: item.type,
          number: item.number,
          x: pos.x,
          y: pos.y,
          width: 260,
          height: 110,
          zone_id: null,
        };
      });

      // Save new nodes to DB
      if (newItems.length > 0) {
        const toSave = nodes.filter((n) => !existingNodeMap.has(n.id));
        await window.api.canvasBatchUpsertNodes({ repo, nodes: toSave });
      }

      const vp = savedViewport as { pan_x?: number; pan_y?: number; zoom?: number } | null;

      set({
        nodes,
        zones: Array.isArray(savedZones) ? (savedZones as CanvasZone[]) : [],
        arrows: arrowSet,
        viewport: vp
          ? { panX: vp.pan_x ?? 0, panY: vp.pan_y ?? 0, zoom: vp.zoom ?? 1 }
          : { panX: 0, panY: 0, zoom: 1 },
        loading: false,
      });
    } catch (err) {
      console.error("Canvas loadCanvas failed:", err);
      set({ loading: false });
    }
  },

  moveNode: (id, x, y) => {
    const node = get().nodes.find((n) => n.id === id);
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
    if (node) {
      debouncedIPC(`node-pos-${id}`, () => {
        window.api.canvasUpdateNodePos({
          repo: node.repo,
          id,
          x: get().nodes.find((n) => n.id === id)?.x ?? x,
          y: get().nodes.find((n) => n.id === id)?.y ?? y,
        });

        // Check zone containment after move settles
        const currentNode = get().nodes.find((n) => n.id === id);
        if (!currentNode) return;
        const cx = currentNode.x + currentNode.width / 2;
        const cy = currentNode.y + 50;
        const containingZone = get().zones.find(
          (z) => cx >= z.x && cx <= z.x + z.width && cy >= z.y && cy <= z.y + z.height,
        );
        const newZoneId = containingZone?.id ?? null;
        if (newZoneId !== currentNode.zone_id) {
          set((s) => ({
            nodes: s.nodes.map((n) => (n.id === id ? { ...n, zone_id: newZoneId } : n)),
          }));
          window.api.canvasUpdateNodeZone({ repo: currentNode.repo, id, zoneId: newZoneId });
        }
      });
    }
  },

  moveZone: (id, x, y) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, x, y } : z)),
    }));
    if (zone) {
      debouncedIPC(`zone-pos-${id}`, () => {
        const current = get().zones.find((z) => z.id === id);
        if (current)
          window.api.canvasUpdateZonePos({ repo: current.repo, id, x: current.x, y: current.y });
      });
    }
  },

  resizeZone: (id, width, height) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, width, height } : z)),
    }));
    if (zone) {
      debouncedIPC(`zone-size-${id}`, () => {
        const current = get().zones.find((z) => z.id === id);
        if (current)
          window.api.canvasUpdateZoneSize({
            repo: current.repo,
            id,
            width: current.width,
            height: current.height,
          });
      });
    }
  },

  addZone: (repo) => {
    const { viewport } = get();
    const zone: CanvasZone = {
      id: `zone-${Date.now()}`,
      repo,
      label: "New group",
      color: "#3b82f6",
      x: -viewport.panX / viewport.zoom + 100,
      y: -viewport.panY / viewport.zoom + 100,
      width: 400,
      height: 300,
    };
    set((s) => ({ zones: [...s.zones, zone] }));
    window.api.canvasUpsertZone({ repo, zone });
  },

  deleteZone: (id) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.filter((z) => z.id !== id),
      nodes: s.nodes.map((n) => (n.zone_id === id ? { ...n, zone_id: null } : n)),
    }));
    if (zone) window.api.canvasDeleteZone({ repo: zone.repo, id });
  },

  renameZone: (id, label) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, label } : z)),
    }));
    if (zone) window.api.canvasUpdateZoneLabel({ repo: zone.repo, id, label });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  setViewport: (viewport) => set({ viewport }),

  saveViewport: (repo) => {
    const { viewport } = get();
    window.api.canvasSaveViewport({
      repo,
      viewport: { pan_x: viewport.panX, pan_y: viewport.panY, zoom: viewport.zoom },
    });
  },

  setSearch: (searchQuery) => set({ searchQuery }),

  resetLayout: async (repo, prs, issues) => {
    // Clear saved positions from DB and re-layout everything
    set({ loading: true });
    try {
      // Delete all saved nodes for this repo
      const currentNodes = get().nodes;
      for (const node of currentNodes) {
        await window.api.canvasDeleteNode({ repo, id: node.id });
      }
      // Force fresh load with no saved positions
      set({ nodes: [], zones: get().zones, arrows: [] });
      await get().loadCanvas(repo, prs, issues);
    } catch {
      set({ loading: false });
    }
  },
}));
