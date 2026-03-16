import { useEffect, useRef, useCallback, useMemo, useState } from "react";
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Loader2,
  Trash2,
  Palette,
  GitMerge,
  XCircle,
  CircleDot,
} from "lucide-react";
import { useCanvasStore, type CanvasNode, type CanvasZone } from "../../stores/canvasStore";
import { usePRStore } from "../../stores/prStore";
import { useIssueStore } from "../../stores/issueStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { CanvasCard } from "./CanvasCard";
import type { PullRequest, Issue } from "../../types";

interface CanvasViewProps {
  repo: string;
  filteredPRs?: PullRequest[];
  filteredIssues?: Issue[];
}

const ZONE_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#64748b",
];

/* ── Zone component ───────────────────────────────── */

function ZoneRect({ zone, zoom }: { zone: CanvasZone; zoom: number }) {
  const moveZone = useCanvasStore((s) => s.moveZone);
  const resizeZone = useCanvasStore((s) => s.resizeZone);
  const renameZone = useCanvasStore((s) => s.renameZone);
  const deleteZoneAction = useCanvasStore((s) => s.deleteZone);
  const [showColors, setShowColors] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; zoneX: number; zoneY: number } | null>(
    null,
  );
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0 || (e.target as HTMLElement).tagName === "INPUT") return;
      e.stopPropagation();
      dragRef.current = { startX: e.clientX, startY: e.clientY, zoneX: zone.x, zoneY: zone.y };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        moveZone(
          zone.id,
          dragRef.current.zoneX + (ev.clientX - dragRef.current.startX) / zoom,
          dragRef.current.zoneY + (ev.clientY - dragRef.current.startY) / zoom,
        );
      };
      const onUp = () => {
        dragRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [zone.id, zone.x, zone.y, zoom, moveZone],
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      resizeRef.current = { startX: e.clientX, startY: e.clientY, w: zone.width, h: zone.height };

      const onMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        resizeZone(
          zone.id,
          Math.max(150, resizeRef.current.w + (ev.clientX - resizeRef.current.startX) / zoom),
          Math.max(100, resizeRef.current.h + (ev.clientY - resizeRef.current.startY) / zoom),
        );
      };
      const onUp = () => {
        resizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [zone.id, zone.width, zone.height, zoom, resizeZone],
  );

  const setZoneColor = useCallback(
    (color: string) => {
      useCanvasStore.setState((s) => ({
        zones: s.zones.map((z) => (z.id === zone.id ? { ...z, color } : z)),
      }));
      window.api.canvasUpsertZone({ repo: zone.repo, zone: { ...zone, color } });
      setShowColors(false);
    },
    [zone],
  );

  return (
    <section
      aria-label={zone.label || "Zone"}
      className="absolute rounded-xl border-2 border-dashed group/zone"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        borderColor: `${zone.color}50`,
        backgroundColor: `${zone.color}08`,
      }}
    >
      {/* Title bar - drag handle */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        role="toolbar"
        onMouseDown={handleDragStart}
        className="flex items-center gap-1 px-3 py-1.5 cursor-grab active:cursor-grabbing"
      >
        <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: zone.color }} />
        <input
          type="text"
          value={zone.label}
          onChange={(e) => renameZone(zone.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-transparent text-[11px] font-semibold uppercase tracking-wider outline-none flex-1 min-w-0"
          style={{ color: zone.color }}
        />
        <div className="opacity-0 group-hover/zone:opacity-100 flex items-center gap-0.5 transition-opacity">
          {/* Color picker */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowColors(!showColors);
              }}
              className="p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)]"
            >
              <Palette className="size-3" />
            </button>
            {showColors && (
              <div className="absolute left-0 top-full mt-1 z-50 flex gap-1 p-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-raised)] shadow-xl">
                {ZONE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoneColor(c);
                    }}
                    className="size-5 rounded-full cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              deleteZoneAction(zone.id);
            }}
            className="p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-red)]"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
      {/* Resize handle */}
      <button
        type="button"
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover/zone:opacity-50 transition-opacity"
        aria-label="Resize zone"
        style={{
          borderBottom: `2px solid ${zone.color}`,
          borderRight: `2px solid ${zone.color}`,
        }}
      />
    </section>
  );
}

/* ── Arrow SVG ────────────────────────────────────── */

function ArrowLayer({ nodes }: { nodes: CanvasNode[] }) {
  const arrows = useCanvasStore((s) => s.arrows);
  const nodeMap = useMemo(() => {
    const m = new Map<string, CanvasNode>();
    for (const n of nodes) m.set(n.id, n);
    return m;
  }, [nodes]);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="var(--color-blue)" opacity="0.6" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const from = nodeMap.get(arrow.fromId);
        const to = nodeMap.get(arrow.toId);
        if (!from || !to) return null;
        // Connect from issue (bottom center) to PR (top center)
        const x1 = from.x + from.width / 2;
        const y1 = from.y + (from.type === "issue" ? from.height : from.height / 2);
        const x2 = to.x + to.width / 2;
        const y2 = to.y + (to.type === "pr" ? 0 : to.height / 2);
        // Smooth bezier with vertical bias
        const dy = y2 - y1;
        const cy1 = y1 + dy * 0.4;
        const cy2 = y2 - dy * 0.4;
        return (
          <path
            key={`${arrow.fromId}-${arrow.toId}`}
            d={`M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`}
            fill="none"
            stroke="var(--color-blue)"
            strokeWidth="1.5"
            opacity="0.3"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}

/* ── Minimap ──────────────────────────────────────── */

function Minimap({
  nodes,
  zones,
  viewport,
  containerWidth,
  containerHeight,
}: {
  nodes: CanvasNode[];
  zones: CanvasZone[];
  viewport: { panX: number; panY: number; zoom: number };
  containerWidth: number;
  containerHeight: number;
}) {
  if (nodes.length === 0) return null;

  const allX = [...nodes.map((n) => n.x), ...zones.map((z) => z.x)];
  const allY = [...nodes.map((n) => n.y), ...zones.map((z) => z.y)];
  const allMaxX = [...nodes.map((n) => n.x + n.width), ...zones.map((z) => z.x + z.width)];
  const allMaxY = [...nodes.map((n) => n.y + 100), ...zones.map((z) => z.y + z.height)];

  const minX = Math.min(...allX) - 50;
  const minY = Math.min(...allY) - 50;
  const maxX = Math.max(...allMaxX) + 50;
  const maxY = Math.max(...allMaxY) + 50;
  const contentW = maxX - minX;
  const contentH = maxY - minY;

  const mapW = 140;
  const mapH = 90;
  const scale = Math.min(mapW / contentW, mapH / contentH);

  // Visible area rectangle
  const visX = (-viewport.panX / viewport.zoom - minX) * scale;
  const visY = (-viewport.panY / viewport.zoom - minY) * scale;
  const visW = (containerWidth / viewport.zoom) * scale;
  const visH = (containerHeight / viewport.zoom) * scale;

  return (
    <div className="absolute bottom-3 left-3 z-20 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)]/90 backdrop-blur-sm overflow-hidden">
      <svg width={mapW} height={mapH} className="block" role="img" aria-label="Canvas minimap">
        <title>Canvas minimap</title>
        {/* Zones */}
        {zones.map((z) => (
          <rect
            key={z.id}
            x={(z.x - minX) * scale}
            y={(z.y - minY) * scale}
            width={z.width * scale}
            height={z.height * scale}
            fill={`${z.color}20`}
            stroke={`${z.color}40`}
            strokeWidth="0.5"
          />
        ))}
        {/* Nodes */}
        {nodes.map((n) => (
          <rect
            key={n.id}
            x={(n.x - minX) * scale}
            y={(n.y - minY) * scale}
            width={Math.max(2, n.width * scale)}
            height={Math.max(1, 60 * scale)}
            fill={n.type === "pr" ? "var(--color-green)" : "var(--color-blue)"}
            opacity="0.6"
            rx="1"
          />
        ))}
        {/* Viewport rect */}
        <rect
          x={Math.max(0, visX)}
          y={Math.max(0, visY)}
          width={Math.min(mapW, visW)}
          height={Math.min(mapH, visH)}
          fill="none"
          stroke="var(--color-fg-secondary)"
          strokeWidth="1"
          opacity="0.6"
        />
      </svg>
    </div>
  );
}

/* ── Visibility Filters ───────────────────────────── */

function CanvasFilters() {
  const showMergedPRs = useSettingsStore((s) => s.showMergedPRs);
  const showClosedPRs = useSettingsStore((s) => s.showClosedPRs);
  const showClosedIssues = useSettingsStore((s) => s.showClosedIssues);
  const setShowMergedPRs = useSettingsStore((s) => s.setShowMergedPRs);
  const setShowClosedPRs = useSettingsStore((s) => s.setShowClosedPRs);
  const setShowClosedIssues = useSettingsStore((s) => s.setShowClosedIssues);

  return (
    <div className="flex items-center gap-0.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-1 py-0.5">
      <button
        type="button"
        onClick={() => setShowMergedPRs(!showMergedPRs)}
        className={`p-1.5 rounded-sm cursor-pointer transition-colors ${showMergedPRs ? "" : "opacity-30"}`}
        style={{ color: "var(--color-purple)" }}
        title={`${showMergedPRs ? "Hide" : "Show"} merged PRs`}
      >
        <GitMerge className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setShowClosedPRs(!showClosedPRs)}
        className={`p-1.5 rounded-sm cursor-pointer transition-colors ${showClosedPRs ? "" : "opacity-30"}`}
        style={{ color: "var(--color-red)" }}
        title={`${showClosedPRs ? "Hide" : "Show"} closed PRs`}
      >
        <XCircle className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => setShowClosedIssues(!showClosedIssues)}
        className={`p-1.5 rounded-sm cursor-pointer transition-colors ${showClosedIssues ? "" : "opacity-30"}`}
        style={{ color: "var(--color-fg-muted)" }}
        title={`${showClosedIssues ? "Hide" : "Show"} closed issues`}
      >
        <CircleDot className="size-3.5" />
      </button>
    </div>
  );
}

/* ── Canvas View (main) ───────────────────────────── */

export function CanvasView({ repo, filteredPRs, filteredIssues }: CanvasViewProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const zones = useCanvasStore((s) => s.zones);
  const viewport = useCanvasStore((s) => s.viewport);
  const loading = useCanvasStore((s) => s.loading);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const saveViewport = useCanvasStore((s) => s.saveViewport);
  const addZone = useCanvasStore((s) => s.addZone);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const resetLayout = useCanvasStore((s) => s.resetLayout);

  // Use the shared search from prStore (same as header search bar)
  const searchQuery = usePRStore((s) => s.search);

  const storePrs = usePRStore((s) => s.prs);
  const storeIssues = useIssueStore((s) => s.issues);
  const fetchIssues = useIssueStore((s) => s.fetchIssues);
  const issuesLoading = useIssueStore((s) => s.loading);

  // Use filtered data from parent if provided, otherwise fall back to store
  const prs = filteredPRs ?? storePrs;
  const issues = filteredIssues ?? storeIssues;

  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  // Track container size for minimap
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Clear canvas state when repo changes
  const prevRepoRef = useRef(repo);
  useEffect(() => {
    if (prevRepoRef.current !== repo) {
      prevRepoRef.current = repo;
      useCanvasStore.setState({
        nodes: [],
        zones: [],
        arrows: [],
        loading: false,
        selectedNodeId: null,
        searchQuery: "",
      });
    }
  }, [repo]);

  // Debounced viewport save
  const debouncedSaveViewport = useCallback(
    (r: string) => {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => saveViewport(r), 300);
    },
    [saveViewport],
  );

  useEffect(() => {
    return () => clearTimeout(saveTimeoutRef.current);
  }, []);

  // Load issues on mount
  useEffect(() => {
    if (repo && storeIssues.length === 0 && !issuesLoading) {
      fetchIssues(repo);
    }
  }, [repo, storeIssues.length, issuesLoading, fetchIssues]);

  // Load canvas when data is available
  const canvasDataKey = `${repo}:${prs.length}:${issues.length}`;
  const loadedKeyRef = useRef("");
  useEffect(() => {
    if (!repo || prs.length === 0) return;
    if (loadedKeyRef.current === canvasDataKey) return;
    loadedKeyRef.current = canvasDataKey;
    loadCanvas(repo, prs, issues);
  }, [canvasDataKey, repo, prs, issues, loadCanvas]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        selectNode(null);
      }
      if (e.key === "+" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setViewport({ ...viewport, zoom: Math.min(3, viewport.zoom * 1.2) });
        debouncedSaveViewport(repo);
      }
      if (e.key === "-" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setViewport({ ...viewport, zoom: Math.max(0.1, viewport.zoom * 0.8) });
        debouncedSaveViewport(repo);
      }
      if (e.key === "0" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setViewport({ ...viewport, zoom: 1 });
        debouncedSaveViewport(repo);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [viewport, setViewport, debouncedSaveViewport, selectNode, repo]);

  // Lookup maps
  const prMap = useMemo(() => {
    const m = new Map<number, PullRequest>();
    for (const pr of prs) m.set(pr.number, pr);
    return m;
  }, [prs]);

  const issueMap = useMemo(() => {
    const m = new Map<number, Issue>();
    for (const issue of issues) m.set(issue.number, issue);
    return m;
  }, [issues]);

  // Search
  const highlightedIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>();
    const q = searchQuery.toLowerCase();
    const ids = new Set<string>();
    for (const node of nodes) {
      const data = node.type === "pr" ? prMap.get(node.number) : issueMap.get(node.number);
      if (!data) continue;
      if (
        data.title.toLowerCase().includes(q) ||
        data.author.login.toLowerCase().includes(q) ||
        `#${data.number}`.includes(q)
      ) {
        ids.add(node.id);
      }
    }
    return ids;
  }, [searchQuery, nodes, prMap, issueMap]);

  // Pan
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      selectNode(null);
      panRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: viewport.panX,
        panY: viewport.panY,
      };

      const onMove = (ev: MouseEvent) => {
        if (!panRef.current) return;
        setViewport({
          panX: panRef.current.panX + (ev.clientX - panRef.current.startX),
          panY: panRef.current.panY + (ev.clientY - panRef.current.startY),
          zoom: viewport.zoom,
        });
      };
      const onUp = () => {
        panRef.current = null;
        debouncedSaveViewport(repo);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [viewport, setViewport, debouncedSaveViewport, selectNode, repo],
  );

  // Zoom via native wheel listener (non-passive for preventDefault)
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const vp = viewportRef.current;
      const delta = e.deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Math.max(0.1, Math.min(3, vp.zoom * delta));
      const rect = el.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const newPanX = cx - ((cx - vp.panX) / vp.zoom) * newZoom;
      const newPanY = cy - ((cy - vp.panY) / vp.zoom) * newZoom;
      setViewport({ panX: newPanX, panY: newPanY, zoom: newZoom });
      debouncedSaveViewport(repo);
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [setViewport, debouncedSaveViewport, repo]);

  const zoomTo = (z: number) => {
    setViewport({ ...viewport, zoom: z });
    debouncedSaveViewport(repo);
  };

  const fitToView = () => {
    if (nodes.length === 0) return;
    const allItems = [
      ...nodes,
      ...zones.map((z) => ({ x: z.x, y: z.y, width: z.width, height: z.height })),
    ];
    const minX = Math.min(...allItems.map((n) => n.x));
    const minY = Math.min(...allItems.map((n) => n.y));
    const maxX = Math.max(...allItems.map((n) => n.x + n.width));
    const maxY = Math.max(...allItems.map((n) => n.y + ("height" in n ? n.height : 100)));
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const contentW = maxX - minX + 120;
    const contentH = maxY - minY + 120;
    const zoom = Math.min(cw / contentW, ch / contentH, 1.5);
    setViewport({
      panX: (cw - contentW * zoom) / 2 - minX * zoom + 60 * zoom,
      panY: (ch - contentH * zoom) / 2 - minY * zoom + 60 * zoom,
      zoom,
    });
    debouncedSaveViewport(repo);
  };

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-[var(--color-fg-dim)]" />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--color-bg)]" ref={containerRef}>
      {/* Dot grid background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle, var(--color-fg-dim) 0.75px, transparent 0.75px),
            radial-gradient(circle, var(--color-fg-dim) 0.4px, transparent 0.4px)
          `,
          backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px, ${6 * viewport.zoom}px ${6 * viewport.zoom}px`,
          backgroundPosition: `${viewport.panX % (24 * viewport.zoom)}px ${viewport.panY % (24 * viewport.zoom)}px, ${viewport.panX % (6 * viewport.zoom)}px ${viewport.panY % (6 * viewport.zoom)}px`,
          opacity: 0.15,
        }}
      />

      {/* Search match indicator (search is in the header bar) */}
      {highlightedIds.size > 0 && (
        <div className="absolute top-3 left-3 z-20 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)]/90 backdrop-blur-sm px-2.5 py-1">
          <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums">
            {highlightedIds.size} match{highlightedIds.size !== 1 ? "es" : ""}
          </span>
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] p-0.5">
        <button
          type="button"
          onClick={() => zoomTo(viewport.zoom * 1.2)}
          className="p-1.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <ZoomIn className="size-3.5" />
        </button>
        <span className="text-[10px] font-mono text-[var(--color-fg-dim)] tabular-nums w-10 text-center">
          {Math.round(viewport.zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => zoomTo(viewport.zoom * 0.8)}
          className="p-1.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <ZoomOut className="size-3.5" />
        </button>
        <div className="w-px h-4 bg-[var(--color-border)]" />
        <button
          type="button"
          onClick={fitToView}
          className="p-1.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <Maximize2 className="size-3.5" />
        </button>
      </div>

      {/* Canvas actions */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        {/* Visibility filters */}
        <CanvasFilters />
        <button
          type="button"
          onClick={() => resetLayout(repo, prs, issues)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-fg-dim)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
          title="Re-arrange all cards using auto-layout"
        >
          Reset layout
        </button>
        <button
          type="button"
          onClick={() => addZone(repo)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <Plus className="size-3" />
          Add zone
        </button>
      </div>

      {/* Minimap */}
      <Minimap
        nodes={nodes}
        zones={zones}
        viewport={viewport}
        containerWidth={containerWidth}
        containerHeight={containerHeight}
      />

      {/* Canvas surface */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        role="application"
        aria-label="Canvas"
        tabIndex={-1}
      >
        <div
          className="absolute origin-top-left"
          style={{
            transform: `translate(${viewport.panX}px, ${viewport.panY}px) scale(${viewport.zoom})`,
            willChange: "transform",
          }}
        >
          {/* Zones (behind cards) */}
          {zones.map((zone) => (
            <ZoneRect key={zone.id} zone={zone} zoom={viewport.zoom} />
          ))}

          {/* Arrows */}
          <ArrowLayer nodes={nodes} />

          {/* Cards */}
          {nodes.map((node) => {
            const data =
              node.type === "pr"
                ? ((prMap.get(node.number) as PullRequest | undefined) ?? null)
                : ((issueMap.get(node.number) as Issue | undefined) ?? null);
            return (
              <CanvasCard
                key={node.id}
                node={node}
                data={data}
                zoom={viewport.zoom}
                highlighted={highlightedIds.has(node.id)}
                repo={repo}
              />
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)]/90 backdrop-blur-sm px-3 py-1">
        <span className="text-[10px] text-[var(--color-fg-dim)]">
          <span className="text-[var(--color-green)]">
            {nodes.filter((n) => n.type === "pr").length}
          </span>{" "}
          PRs
        </span>
        <span className="text-[10px] text-[var(--color-fg-dim)]">
          <span className="text-[var(--color-blue)]">
            {nodes.filter((n) => n.type === "issue").length}
          </span>{" "}
          Issues
        </span>
        <span className="text-[10px] text-[var(--color-fg-dim)]">{zones.length} zones</span>
      </div>
    </div>
  );
}
