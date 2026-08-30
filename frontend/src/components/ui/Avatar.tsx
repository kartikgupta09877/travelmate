import { avatarColor, initials } from "@/lib/format";
import { cx } from "./index";
import { BadgeCheck } from "lucide-react";

export function Avatar({ name, src, id, size = 40, verified }:
  { name?: string | null; src?: string | null; id?: string; size?: number; verified?: boolean }) {
  const seed = id || name || "u";
  const c = avatarColor(seed);
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={name || ""} width={size} height={size}
          className="h-full w-full rounded-full object-cover ring-2 ring-white" />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full font-display font-600 ring-2 ring-white"
          style={{ background: c.bg, color: c.fg, fontSize: size * 0.4 }}>
          {initials(name)}
        </span>
      )}
      {verified && (
        <span className="absolute -bottom-0.5 -right-0.5 grid place-items-center rounded-full bg-white"
          style={{ width: size * 0.42, height: size * 0.42 }}>
          <BadgeCheck size={size * 0.42} className="text-verified" fill="#EAF7EE" />
        </span>
      )}
    </span>
  );
}
