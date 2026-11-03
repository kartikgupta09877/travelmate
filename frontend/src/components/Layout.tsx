import { useState, type ReactNode } from "react";
import { NavLink, useNavigate, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Route as RouteIcon, MapPin, Search, CalendarCheck,
  MessageSquare, User, ShieldAlert, Settings, Sparkles, LogOut, Menu, X,
  ShieldCheck, Plus, ChevronRight, Bell, Sparkle, SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Logo } from "./Logo";
import { Avatar } from "./ui/Avatar";
import { cx } from "./ui";

interface Item { to: string; label: string; Icon: typeof MapPin; end?: boolean; badge?: string }

const NAV: Item[] = [
  { to: "/app", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/app/local", label: "Local Commute", Icon: MapPin },
  { to: "/app/long", label: "Long Trips", Icon: RouteIcon },
  { to: "/app/find", label: "Find Partners", Icon: Search },
  { to: "/app/assistant", label: "Match Assistant", Icon: Sparkles, badge: "AI" },
  { to: "/app/trips", label: "My Trips", Icon: CalendarCheck },
  { to: "/app/messages", label: "Messages", Icon: MessageSquare },
  { to: "/app/profile", label: "Profile", Icon: User },
  { to: "/app/safety", label: "Safety Center", Icon: ShieldAlert },
  { to: "/app/trust-lab", label: "Trust Lab", Icon: SlidersHorizontal, badge: "NEW" },
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
        "group relative flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-all duration-200 select-none",
        isActive
          ? "bg-teal-dark text-white shadow-sm"
          : "text-slate-700 hover:bg-slate-100 hover:text-ocean-900"
      )}>
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3">
            <item.Icon size={19} className={cx("transition-colors duration-200", isActive ? "text-white" : "text-slate-500 group-hover:text-teal-dark")} />
            <span>{item.label}</span>
          </div>
          {item.badge && (
            <span className="rounded-full bg-gradient-to-r from-teal to-coral-warm px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-xs">
              {item.badge}
            </span>
          )}
          {isActive && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-teal-dark shadow-xs" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  if (!user) return null;

  const rating = user.stats?.rating ?? 0;

  const currentNav = NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)));

  const userCard = (
    <button onClick={() => { nav("/app/profile"); setMoreOpen(false); }}
      className="group flex w-full items-center gap-3.5 rounded-2xl bg-slate-50 p-3 text-left transition-all hover:bg-slate-100 border border-slate-200 hover:border-slate-300 shadow-xs">
      <Avatar name={user.full_name} src={user.photo_url} id={user.id} size={42}
        verified={user.verification?.identity} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-slate-900 group-hover:text-teal-dark transition-colors">{user.full_name}</div>
        <div className="truncate text-xs text-slate-600 font-bold mt-0.5">{rating ? `★ ${rating.toFixed(1)}` : "New traveller"} · {user.city}</div>
      </div>
      <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
    </button>
  );

  return (
    <div className="min-h-screen bg-canvas text-ocean-900">
      {/* Desktop sidebar - High contrast light sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-white p-4 border-r border-slate-200 lg:flex shadow-xs">
        <div className="px-2 py-3 mb-2">
          <Logo tone="light" />
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
          {NAV.map((i) => <SideLink key={i.to} item={i} />)}
          {user.role === "admin" && (
            <SideLink item={{ to: "/app/admin", label: "Admin Panel", Icon: ShieldCheck }} />
          )}
        </nav>

        <div className="space-y-2.5 pt-4 border-t border-slate-200">
          {userCard}
          <button onClick={logout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-600">
            <LogOut size={17} className="text-slate-500 group-hover:text-rose-600" /> Sign out
          </button>
        </div>
      </aside>

      {/* Top Header Bar for Desktop */}
      <header className="fixed top-0 inset-x-0 lg:left-64 z-20 hidden lg:flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-slate-200 px-8 py-3.5 shadow-xs">
        <div className="flex items-center gap-3">
          <h1 className="font-display font-extrabold text-lg text-ocean-900">
            {currentNav?.label || "TravelMate"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => nav("/app/find")} className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-3.5 py-2 text-xs font-bold text-ocean-900 transition-colors border border-slate-300">
            <Search size={14} className="text-teal-dark" /> Quick Route Search
          </button>

          <button onClick={() => nav("/app/safety")} className="p-2 rounded-xl text-slate-700 hover:text-teal-dark hover:bg-teal-wash transition-colors" title="Safety Center">
            <ShieldAlert size={20} />
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <button onClick={() => nav("/app/profile")} className="flex items-center gap-2 text-xs font-extrabold text-ocean-900 hover:text-teal-dark transition-colors">
            <Avatar name={user.full_name} src={user.photo_url} id={user.id} size={30} verified={user.verification?.identity} />
            <span className="truncate max-w-[120px]">{user.full_name}</span>
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 backdrop-blur-md lg:hidden shadow-xs">
        <Logo tone="light" />
        <div className="flex items-center gap-2">
          <button onClick={() => nav("/app/local")} className="rounded-xl bg-teal-wash p-2 text-teal-dark hover:bg-teal/20 transition-colors" aria-label="Create journey">
            <Plus size={20} />
          </button>
          <button onClick={() => setMoreOpen(true)} className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition-colors" aria-label="Menu">
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="lg:pl-64 lg:pt-16">
        <div className="container-app py-6 pb-28 sm:py-8 lg:pb-12 animate-fade">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-slate-200 bg-white backdrop-blur-md lg:hidden shadow-lg">
        {MOBILE_PRIMARY.map((i) => (
          <NavLink key={i.to} to={i.to} end={i.end}
            className={({ isActive }) => cx(
              "flex flex-col items-center gap-1 py-2 text-[11px] font-extrabold transition-colors select-none",
              isActive ? "text-teal-dark" : "text-slate-600 hover:text-ocean-900"
            )}>
            <i.Icon size={20} /> {i.label}
          </NavLink>
        ))}
        <button onClick={() => setMoreOpen(true)}
          className="flex flex-col items-center gap-1 py-2 text-[11px] font-extrabold text-slate-600 hover:text-ocean-900 transition-colors">
          <Menu size={20} /> More
        </button>
      </nav>

      {/* Mobile "More" sheet drawer */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ocean-950/60 backdrop-blur-xs animate-fade" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[90vh] overflow-y-auto rounded-t-3xl bg-white p-5 text-slate-900 shadow-2xl animate-slide-up border-t border-slate-200">
            <div className="mb-4 flex items-center justify-between">
              <Logo tone="light" />
              <button onClick={() => setMoreOpen(false)} className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            {userCard}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {NAV.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} onClick={() => setMoreOpen(false)}
                  className={({ isActive }) => cx(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold transition-all",
                    isActive ? "bg-teal-dark text-white shadow-xs" : "text-slate-700 hover:bg-slate-100 hover:text-ocean-900"
                  )}>
                  {({ isActive }) => (
                    <>
                      <i.Icon size={18} className={isActive ? "text-white" : "text-teal-dark"} /> {i.label}
                    </>
                  )}
                </NavLink>
              ))}
              {user.role === "admin" && (
                <NavLink to="/app/admin" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100">
                  <ShieldCheck size={18} className="text-teal-dark" /> Admin
                </NavLink>
              )}
            </div>
            <button onClick={() => { logout(); setMoreOpen(false); }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3.5 text-sm font-extrabold text-rose-700 hover:bg-rose-100 transition-colors border border-rose-200">
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      )}

      {/* Floating create button (desktop) */}
      <button onClick={() => nav("/app/local")}
        className="fixed bottom-8 right-8 z-20 hidden items-center gap-2.5 rounded-full bg-gradient-to-r from-teal-dark via-teal to-teal-light px-6 py-4 font-display font-800 text-white shadow-glow transition-all duration-200 hover:scale-105 active:scale-95 lg:flex cursor-pointer">
        <Plus size={20} strokeWidth={2.5} /> Create journey
      </button>
    </div>
  );
}
