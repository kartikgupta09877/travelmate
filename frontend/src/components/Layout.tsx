import { useState, type ReactNode } from "react";
import { NavLink, useNavigate, Outlet } from "react-router-dom";
import {
  LayoutDashboard, Route as RouteIcon, MapPin, Search, CalendarCheck,
  MessageSquare, User, ShieldAlert, Settings, Sparkles, LogOut, Menu, X,
  ShieldCheck, Plus, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { TrustLevel } from "./VerificationBadges";
import { cx } from "./ui";

interface Item { to: string; label: string; Icon: typeof MapPin; end?: boolean }

const NAV: Item[] = [
  { to: "/app", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/app/local", label: "Local Travel", Icon: MapPin },
  { to: "/app/long", label: "Long Trips", Icon: RouteIcon },
  { to: "/app/find", label: "Find Partners", Icon: Search },
  { to: "/app/assistant", label: "Match Assistant", Icon: Sparkles },
  { to: "/app/trips", label: "My Trips", Icon: CalendarCheck },
  { to: "/app/messages", label: "Messages", Icon: MessageSquare },
  { to: "/app/profile", label: "Profile", Icon: User },
  { to: "/app/safety", label: "Safety Center", Icon: ShieldAlert },
  { to: "/app/settings", label: "Settings", Icon: Settings },
];

const MOBILE_PRIMARY: Item[] = [
  { to: "/app", label: "Home", Icon: LayoutDashboard, end: true },
  { to: "/app/find", label: "Find", Icon: Search },
  { to: "/app/trips", label: "Trips", Icon: CalendarCheck },
  { to: "/app/messages", label: "Chat", Icon: MessageSquare },
];

function SideLink({ item, onClick }: { item: Item; onClick?: () => void }) {
  return (
    <NavLink to={item.to} end={item.end} onClick={onClick}
      className={({ isActive }) => cx(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
        isActive ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
      )}>
      {({ isActive }) => (
        <>
          <item.Icon size={18} className={isActive ? "text-teal-light" : ""} />
          {item.label}
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [moreOpen, setMoreOpen] = useState(false);
  if (!user) return null;

  const n4 = user.stats?.rating ?? 0;

  const userCard = (
    <button onClick={() => { nav("/app/profile"); setMoreOpen(false); }}
      className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2.5 text-left hover:bg-white/10">
      <Avatar name={user.full_name} src={user.photo_url} id={user.id} size={40}
        verified={user.verification?.identity} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-600 text-white">{user.full_name}</div>
        <div className="truncate text-xs text-white/50">{n4 ? `★ ${n4.toFixed(1)}` : "New member"} · {user.city}</div>
      </div>
      <ChevronRight size={16} className="text-white/40" />
    </button>
  );

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-ink p-4 lg:flex">
        <div className="px-2 py-2"><Logo tone="dark" /></div>
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto">
          {NAV.map((i) => <SideLink key={i.to} item={i} />)}
          {user.role === "admin" && (
            <SideLink item={{ to: "/app/admin", label: "Admin", Icon: ShieldCheck }} />
          )}
        </nav>
        <div className="space-y-2 pt-3">
          {userCard}
          <button onClick={logout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/50 hover:bg-white/5 hover:text-white">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <Logo />
        <button onClick={() => setMoreOpen(true)} className="rounded-lg p-2 text-ink-muted hover:bg-ink/5" aria-label="Menu">
          <Menu size={22} />
        </button>
      </header>

      {/* Main */}
      <main className="lg:pl-64">
        <div className="container-app py-5 pb-28 sm:py-7 lg:pb-10">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-white/95 backdrop-blur lg:hidden">
        {MOBILE_PRIMARY.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end}
            className={({ isActive }) => cx(
              "flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium",
              isActive ? "text-teal" : "text-ink-muted"
            )}>
            <i.Icon size={20} /> {i.label}
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-ink-muted">
          <Menu size={20} /> More
        </button>
      </nav>

      {/* Mobile "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-ink p-4 animate-fade">
            <div className="mb-3 flex items-center justify-between">
              <Logo tone="dark" />
              <button onClick={() => setMoreOpen(false)} className="rounded-lg p-2 text-white/60 hover:bg-white/10"><X size={20} /></button>
            </div>
            {userCard}
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {NAV.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => cx(
                    "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium",
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                  )}>
                  <i.Icon size={18} /> {i.label}
                </NavLink>
              ))}
              {user.role === "admin" && (
                <NavLink to="/app/admin" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm font-medium text-white/70 hover:bg-white/5">
                  <ShieldCheck size={18} /> Admin
                </NavLink>
              )}
            </div>
            <button onClick={() => { logout(); setMoreOpen(false); }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 py-3 text-sm text-white/70 hover:bg-white/10">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Floating create button (desktop) */}
      <button onClick={() => nav("/app/local")}
        className="fixed bottom-6 right-6 z-20 hidden items-center gap-2 rounded-full bg-teal px-5 py-3.5 font-display font-600 text-white shadow-lift transition-transform hover:scale-105 lg:flex">
        <Plus size={18} /> Create journey
      </button>
    </div>
  );
}
