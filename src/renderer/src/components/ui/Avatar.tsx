import { useState, useEffect } from "react";
import { cn } from "../../lib/cn";

/**
 * In-memory avatar cache with 1-hour TTL.
 * Stores blob URLs to avoid repeated network requests.
 */
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheEntry {
  blobUrl: string;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<string>>();

function fetchAndCache(login: string, size: number): Promise<string> {
  const key = `${login}:${size}`;
  const remoteUrl = `https://avatars.githubusercontent.com/${login}?size=${size}`;

  const existing = pending.get(key);
  if (existing) return existing;

  const promise = fetch(remoteUrl)
    .then((res) => {
      if (!res.ok) throw new Error("fetch failed");
      return res.blob();
    })
    .then((blob) => {
      const old = cache.get(key);
      if (old) URL.revokeObjectURL(old.blobUrl);
      const blobUrl = URL.createObjectURL(blob);
      cache.set(key, { blobUrl, fetchedAt: Date.now() });
      pending.delete(key);
      return blobUrl;
    })
    .catch(() => {
      pending.delete(key);
      return remoteUrl;
    });

  pending.set(key, promise);
  return promise;
}

interface AvatarProps {
  login: string;
  size?: number;
  className?: string;
}

/**
 * GitHub user avatar with in-memory caching.
 * Fetches once per session and caches as blob URL.
 * Refreshes after 1 hour.
 */
export function Avatar({ login, size = 20, className }: AvatarProps) {
  const pixelSize = size * 2;
  const key = `${login}:${pixelSize}`;
  const entry = cache.get(key);
  const isFresh = entry && Date.now() - entry.fetchedAt < CACHE_TTL_MS;

  const [src, setSrc] = useState(
    isFresh ? entry.blobUrl : `https://avatars.githubusercontent.com/${login}?size=${pixelSize}`,
  );

  useEffect(() => {
    if (isFresh) {
      setSrc(entry.blobUrl);
      return;
    }

    let cancelled = false;
    fetchAndCache(login, pixelSize).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [login, pixelSize, isFresh, entry?.blobUrl]);

  return (
    <img
      src={src}
      alt=""
      className={cn("rounded-full shrink-0 bg-[var(--color-bg-overlay)]", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
