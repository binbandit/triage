import { cn } from "../../lib/cn";

interface AvatarProps {
  login: string;
  size?: number;
  className?: string;
}

/**
 * GitHub user avatar. Uses avatars.githubusercontent.com
 * which resolves for both users and bots.
 */
export function Avatar({ login, size = 20, className }: AvatarProps) {
  return (
    <img
      src={`https://avatars.githubusercontent.com/${login}?size=${size * 2}`}
      alt=""
      className={cn("rounded-full shrink-0 bg-[var(--color-bg-overlay)]", className)}
      style={{ width: size, height: size }}
      loading="lazy"
    />
  );
}
