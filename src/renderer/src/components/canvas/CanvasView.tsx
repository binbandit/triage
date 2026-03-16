import { useEffect, useRef, useCallback, useMemo } from "react";
import { Plus, Search, X, ZoomIn, ZoomOut, Maximize2, Loader2, Trash2 } from "lucide-react";
import { useCanvasStore, type CanvasNode, type CanvasZone } from "../../stores/canvasStore";
import { usePRStore } from "../../stores/prStore";
import { useIssueStore } from "../../stores/issueStore";
import { CanvasCard } from "./CanvasCard";
import type { PullRequest, Issue } from "../../types";

interface CanvasViewProps {
  repo: string;
}

/* ── Zone component ───────────────────────────────── */

function ZoneRect({ zone, zoom }: { zone: CanvasZone; zoom: number }) {
  const moveZone = useCanvasStore((s) => s.moveZone);
  const resizeZone = useCanvasStore((s) => s.resizeZone);
  const renameZone = useCanvasStore((s) => s.renameZone);
  const deleteZoneAction = useCanvasStore((s) => s.deleteZone);
  const dragRef = useRef<{ startX: number; startY: number; zoneX: number; zoneY: number } | null>(
    null,
  );
  const resizeRef = useRef<{ startX: number; startY: number; w: number; h: number } | null>(null);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      dragRef.current = { startX: e.clientX, startY: e.clientY, zoneX: zone.x, zoneY: zone.y };

      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (ev.clientX - dragRef.current.startX) / zoom;
        const dy = (ev.clientY - dragRef.current.startY) / zoom;
        moveZone(zone.id, dragRef.current.zoneX + dx, dragRef.current.zoneY + dy);
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
        const dw = (ev.clientX - resizeRef.current.startX) / zoom;
        const dh = (ev.clientY - resizeRef.current.startY) / zoom;
        resizeZone(
          zone.id,
          Math.max(150, resizeRef.current.w + dw),
          Math.max(100, resizeRef.current.h + dh),
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

  return (
    <div
      className="absolute rounded-xl border-2 border-dashed group/zone"
      style={{
        left: zone.x,
        top: zone.y,
        width: zone.width,
        height: zone.height,
        borderColor: `${zone.color}60`,
        backgroundColor: `${zone.color}08`,
      }}
    >
      {/* Title bar - draggable */}
      <div
        onMouseDown={handleDragStart}
        className="flex items-center justify-between px-3 py-1.5 cursor-grab active:cursor-grabbing"
      >
        <input
          type="text"
          value={zone.label}
          onChange={(e) => renameZone(zone.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="bg-transparent text-[11px] font-semibold uppercase tracking-wider outline-none w-full"
          style={{ color: zone.color }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            deleteZoneAction(zone.id);
          }}
          className="opacity-0 group-hover/zone:opacity-100 p-0.5 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-red)] transition-all shrink-0"
        >
          <Trash2 className="size-3" />
        </button>
      </div>
      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize opacity-0 group-hover/zone:opacity-50 transition-opacity"
        style={{ borderBottom: `2px solid ${zone.color}`, borderRight: `2px solid ${zone.color}` }}
      />
    </div>
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
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="var(--color-fg-dim)" opacity="0.5" />
        </marker>
      </defs>
      {arrows.map((arrow) => {
        const from = nodeMap.get(arrow.fromId);
        const to = nodeMap.get(arrow.toId);
        if (!from || !to) return null;
        const x1 = from.x + from.width / 2;
        const y1 = from.y + 50;
        const x2 = to.x + to.width / 2;
        const y2 = to.y + 50;
        const cx = (x1 + x2) / 2;
        return (
          <path
            key={`${arrow.fromId}-${arrow.toId}`}
            d={`M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`}
            fill="none"
            stroke="var(--color-fg-dim)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.35"
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
}

/* ── Canvas View (main) ───────────────────────────── */

export function CanvasView({ repo }: CanvasViewProps) {
  const nodes = useCanvasStore((s) => s.nodes);
  const zones = useCanvasStore((s) => s.zones);
  const viewport = useCanvasStore((s) => s.viewport);
  const loading = useCanvasStore((s) => s.loading);
  const searchQuery = useCanvasStore((s) => s.searchQuery);
  const setViewport = useCanvasStore((s) => s.setViewport);
  const saveViewport = useCanvasStore((s) => s.saveViewport);
  const addZone = useCanvasStore((s) => s.addZone);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const setSearch = useCanvasStore((s) => s.setSearch);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);

  const prs = usePRStore((s) => s.prs);
  const issues = useIssueStore((s) => s.issues);
  const fetchIssues = useIssueStore((s) => s.fetchIssues);
  const issuesLoading = useIssueStore((s) => s.loading);

  const containerRef = useRef<HTMLDivElement>(null);
  const panRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  );

  // Load issues + canvas on mount
  useEffect(() => {
    if (repo && issues.length === 0 && !issuesLoading) {
      fetchIssues(repo);
    }
  }, [repo, issues.length, issuesLoading, fetchIssues]);

  useEffect(() => {
    if (repo && prs.length > 0) {
      loadCanvas(repo, prs, issues);
    }
  }, [repo, prs, issues, loadCanvas]);

  // Build lookup maps
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

  // Search highlights
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

  // Pan handling
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
        saveViewport(repo);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [viewport, setViewport, saveViewport, selectNode, repo],
  );

  // Zoom handling
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(3, viewport.zoom * delta));
      setViewport({ ...viewport, zoom: newZoom });
      saveViewport(repo);
    },
    [viewport, setViewport, saveViewport, repo],
  );

  const zoomTo = (z: number) => {
    setViewport({ ...viewport, zoom: z });
    saveViewport(repo);
  };

  const fitToView = () => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map((n) => n.x));
    const minY = Math.min(...nodes.map((n) => n.y));
    const maxX = Math.max(...nodes.map((n) => n.x + n.width));
    const maxY = Math.max(...nodes.map((n) => n.y + 100));
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
    saveViewport(repo);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="size-5 animate-spin text-[var(--color-fg-dim)]" />
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden bg-[var(--color-bg)]" ref={containerRef}>
      {/* Toolbar */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 pointer-events-none text-[var(--color-fg-dim)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search canvas..."
            className="w-44 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] pl-7 pr-7 py-1.5 text-[11px] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] outline-none focus:border-[var(--color-blue)]/40"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--color-fg-dim)] hover:text-[var(--color-fg-secondary)]"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        {highlightedIds.size > 0 && (
          <span className="text-[10px] text-[var(--color-fg-dim)] tabular-nums">
            {highlightedIds.size} found
          </span>
        )}
      </div>

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

      {/* Add zone button */}
      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={() => addZone(repo)}
          className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-raised)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--color-fg-muted)] cursor-pointer hover:bg-[var(--color-bg-overlay)] hover:text-[var(--color-fg-secondary)] transition-colors"
        >
          <Plus className="size-3" />
          Add zone
        </button>
      </div>

      {/* Canvas surface */}
      <div
        className="absolute inset-0 cursor-grab active:cursor-grabbing"
        onMouseDown={handleCanvasMouseDown}
        onWheel={handleWheel}
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
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
