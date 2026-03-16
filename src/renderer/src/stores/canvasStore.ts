import { create } from "zustand";
import type { PullRequest, Issue } from "../types";
import { parseLinkedIssues } from "../lib/parseIssues";

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
  setSearch: (query: string) => void;
}

function makeNodeId(type: "pr" | "issue", number: number): string {
  return `${type}-${number}`;
}

function autoLayout(items: { id: string; type: string }[]): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();
  const cols = Math.max(4, Math.ceil(Math.sqrt(items.length)));
  const spacingX = 280;
  const spacingY = 140;
  const margin = 60;

  // Separate PRs and issues, PRs on left, issues on right
  const prs = items.filter((i) => i.type === "pr");
  const issues = items.filter((i) => i.type === "issue");

  prs.forEach((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.set(item.id, { x: margin + col * spacingX, y: margin + row * spacingY });
  });

  const issueOffset = margin + (prs.length > 0 ? (Math.min(prs.length, cols) + 1) * spacingX : 0);
  const issueCols = Math.max(3, Math.ceil(Math.sqrt(issues.length)));
  issues.forEach((item, i) => {
    const col = i % issueCols;
    const row = Math.floor(i / issueCols);
    positions.set(item.id, { x: issueOffset + col * spacingX, y: margin + row * spacingY });
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

      // Find items that need positions (not in DB)
      const newItems = allItems.filter((item) => !existingNodeMap.has(item.id));
      const newPositions = autoLayout(newItems);

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
          width: 240,
          height: 100,
          zone_id: null,
        };
      });

      // Save new nodes to DB
      if (newItems.length > 0) {
        const toSave = nodes.filter((n) => !existingNodeMap.has(n.id));
        await window.api.canvasBatchUpsertNodes({ repo, nodes: toSave });
      }

      // Compute arrows: issue -> PR links
      const arrowSet: CanvasArrow[] = [];
      const nodeIds = new Set(nodes.map((n) => n.id));

      for (const pr of prs) {
        const linked = parseLinkedIssues(pr.body);
        for (const issue of linked) {
          const fromId = makeNodeId("issue", issue.number);
          const toId = makeNodeId("pr", pr.number);
          if (nodeIds.has(fromId) && nodeIds.has(toId)) {
            arrowSet.push({ fromId, toId });
          }
        }
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
    } catch {
      set({ loading: false });
    }
  },

  moveNode: (id, x, y) => {
    const node = get().nodes.find((n) => n.id === id);
    set((s) => ({
      nodes: s.nodes.map((n) => (n.id === id ? { ...n, x, y } : n)),
    }));
    if (node) window.api.canvasUpdateNodePos({ repo: node.repo, id, x, y });
  },

  moveZone: (id, x, y) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, x, y } : z)),
    }));
    if (zone) window.api.canvasUpdateZonePos({ repo: zone.repo, id, x, y });
  },

  resizeZone: (id, width, height) => {
    const zone = get().zones.find((z) => z.id === id);
    set((s) => ({
      zones: s.zones.map((z) => (z.id === id ? { ...z, width, height } : z)),
    }));
    if (zone) window.api.canvasUpdateZoneSize({ repo: zone.repo, id, width, height });
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
}));
