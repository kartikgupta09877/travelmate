import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users, BadgeCheck, Route as RouteIcon, CheckCircle2, Flag, Clock, Share2, Wallet,
  ShieldCheck, Ban, Undo2,
} from "lucide-react";
import type { Report, ReportStatus, UserPublic, VerificationChannel } from "@/lib/types";
import { api } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Stars } from "@/components/VerificationBadges";
import { Button, Card, Chip, Segmented, Stat, SectionHeading, Loading, EmptyState, Select, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { inr, relativeTime, statusLabel } from "@/lib/format";

const CHANNELS: VerificationChannel[] = ["email", "phone", "identity", "college", "vehicle"];

function UsersPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "users"], queryFn: api.admin.users });
  const [busy, setBusy] = useState<string | null>(null);

  const toggleV = async (u: UserPublic, ch: VerificationChannel) => {
    setBusy(u.id + ch);
    try { await api.admin.setVerification(u.id, ch, !u.verification[ch]); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }
    catch { toast.push("Update failed.", "error"); } finally { setBusy(null); }
  };

  const suspend = async (u: UserPublic) => {
    const on = (u as any).suspended;
    setBusy(u.id + "susp");
    try { await api.admin.suspend(u.id, !on); toast.push(on ? "User reinstated." : "User suspended.", on ? "info" : "success"); qc.invalidateQueries({ queryKey: ["admin", "users"] }); }
    catch { toast.push("Action failed.", "error"); } finally { setBusy(null); }
  };

  if (isLoading) return <Loading label="Loading member database…" />;
  if (!data?.length) return <EmptyState icon={<Users size={24} />} title="No registered users found" />;
  return (
    <div className="grid gap-4">
      {data.map((u) => {
        const suspended = (u as any).suspended;
        return (
          <Card key={u.id} className="border border-slate-200/80 shadow-xs">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <Avatar name={u.full_name} src={u.photo_url} id={u.id} size={48} verified={u.verification.identity} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display font-800 text-ocean-900 text-base">{u.full_name}</span>
                    {suspended && <Chip tone="danger">Suspended</Chip>}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-0.5">
                    <Stars rating={u.stats.rating} size={11} /> · {u.stats.completed_trips} trips · {u.city}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {CHANNELS.map((ch) => (
                  <button key={ch} disabled={busy === u.id + ch} onClick={() => toggleV(u, ch)}
                    title={`Toggle ${ch}`}
                    className={cx("rounded-xl px-2.5 py-1 text-xs font-bold capitalize transition-all select-none cursor-pointer",
                      u.verification[ch] ? "bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200")}>
                    {ch}
                  </button>
                ))}
                <Button variant={suspended ? "outline" : "ghost"} sm className={cx(!suspended && "text-rose-600 hover:bg-rose-50 font-bold")}
                  loading={busy === u.id + "susp"} onClick={() => suspend(u)}>
                  {suspended ? <><Undo2 size={13} /> Reinstate</> : <><Ban size={13} /> Suspend</>}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function ReportsPanel() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin", "reports"], queryFn: api.admin.reports });
  const update = async (r: Report, status: ReportStatus) => {
    try { await api.admin.updateReport(r.id, status); toast.push(`Report ${statusLabel(status).toLowerCase()}.`, "success"); qc.invalidateQueries({ queryKey: ["admin", "reports"] }); }
    catch { toast.push("Update failed.", "error"); }
  };
  if (isLoading) return <Loading label="Loading community reports…" />;
  if (!data?.length) return <EmptyState icon={<Flag size={24} />} title="No pending reports" sub="Community reports will appear here for admin review." />;
  const tone = (s: string) => s === "resolved" ? "verified" : s === "dismissed" ? "muted" : s === "reviewing" ? "signal" : "danger";
  return (
    <div className="grid gap-4">
      {data.map((r) => (
        <Card key={r.id} className="border border-slate-200/80 shadow-xs">
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <Avatar name={r.reported_user?.full_name} src={r.reported_user?.photo_url} id={r.reported_user_id} size={42} />
                <div>
                  <div className="font-display font-800 text-ocean-900 text-base">{r.reported_user?.full_name || "User"}</div>
                  <div className="text-xs font-semibold text-slate-600">{r.reason} · {relativeTime(r.created_at)}</div>
                </div>
              </div>
              <Chip tone={tone(r.status) as any}>{statusLabel(r.status)}</Chip>
            </div>
            {r.details && <p className="mt-3 rounded-2xl bg-slate-50 border border-slate-200/80 p-3.5 text-xs font-semibold text-slate-700 leading-relaxed">{r.details}</p>}
            <div className="mt-4 flex items-center justify-end gap-2">
              <Select value={r.status} onChange={(e) => update(r, e.target.value as ReportStatus)} className="w-auto py-1.5 text-xs font-bold">
                {(["open", "reviewing", "resolved", "dismissed"] as ReportStatus[]).map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
              </Select>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState<"users" | "reports">("users");
  const { data: s } = useQuery({ queryKey: ["admin", "stats"], queryFn: api.admin.stats });

  return (
    <div className="space-y-6 animate-fade">
      <SectionHeading eyebrow="Administration" title="Community Moderation & Metrics"
        sub="Manage member verification badges, resolve community reports, and monitor system metrics." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total Users" value={s?.total_users ?? "—"} icon={<Users size={18} />} />
        <Stat label="Verified Users" value={s?.verified_users ?? "—"} tone="verified" icon={<BadgeCheck size={18} />} />
        <Stat label="Active Journeys" value={s?.active_journeys ?? "—"} icon={<RouteIcon size={18} />} />
        <Stat label="Completed Trips" value={s?.completed_journeys ?? "—"} icon={<CheckCircle2 size={18} />} />
        <Stat label="Reported Users" value={s?.reported_users ?? "—"} tone="coral" icon={<Flag size={18} />} />
        <Stat label="Pending Review" value={s?.pending_verification ?? "—"} tone="signal" icon={<Clock size={18} />} />
        <Stat label="Shared Rides" value={s?.total_shared_trips ?? "—"} icon={<Share2 size={18} />} />
        <Stat label="Total Saved" value={s ? inr(s.money_saved_total) : "—"} tone="teal" icon={<Wallet size={18} />} />
      </div>

      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <Segmented value={tab} onChange={setTab}
          options={[
            { value: "users", label: <span className="inline-flex items-center gap-2"><ShieldCheck size={16} /> User Moderation</span> },
            { value: "reports", label: <span className="inline-flex items-center gap-2"><Flag size={16} /> Community Reports</span> },
          ]} />
      </div>

      {tab === "users" ? <UsersPanel /> : <ReportsPanel />}
    </div>
  );
}
