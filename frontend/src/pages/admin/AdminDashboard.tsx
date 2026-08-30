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

  if (isLoading) return <Loading />;
  if (!data?.length) return <EmptyState icon={<Users size={20} />} title="No users" />;
  return (
    <div className="grid gap-3">
      {data.map((u) => {
        const suspended = (u as any).suspended;
        return (
          <Card key={u.id}>
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Avatar name={u.full_name} src={u.photo_url} id={u.id} size={44} verified={u.verification.identity} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-display font-600 text-ink">{u.full_name}</span>
                    {suspended && <Chip tone="danger">Suspended</Chip>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-muted"><Stars rating={u.stats.rating} size={11} /> · {u.stats.completed_trips} trips · {u.city}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {CHANNELS.map((ch) => (
                  <button key={ch} disabled={busy === u.id + ch} onClick={() => toggleV(u, ch)}
                    title={`Toggle ${ch}`}
                    className={cx("rounded-lg px-2 py-1 text-[11px] font-semibold capitalize transition-colors",
                      u.verification[ch] ? "bg-verified-wash text-verified" : "bg-ink/5 text-ink-muted hover:bg-ink/10")}>
                    {ch}
                  </button>
                ))}
                <Button variant={suspended ? "outline" : "ghost"} sm className={cx(!suspended && "text-red-600 hover:bg-red-50")}
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
  if (isLoading) return <Loading />;
  if (!data?.length) return <EmptyState icon={<Flag size={20} />} title="No reports" sub="Nothing needs review right now." />;
  const tone = (s: string) => s === "resolved" ? "verified" : s === "dismissed" ? "muted" : s === "reviewing" ? "signal" : "danger";
  return (
    <div className="grid gap-3">
      {data.map((r) => (
        <Card key={r.id}>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={r.reported_user?.full_name} src={r.reported_user?.photo_url} id={r.reported_user_id} size={40} />
                <div>
                  <div className="font-display font-600 text-ink">{r.reported_user?.full_name || "User"}</div>
                  <div className="text-xs text-ink-muted">{r.reason} · {relativeTime(r.created_at)}</div>
                </div>
              </div>
              <Chip tone={tone(r.status) as any}>{statusLabel(r.status)}</Chip>
            </div>
            {r.details && <p className="mt-2.5 rounded-lg bg-canvas p-3 text-sm text-ink-soft">{r.details}</p>}
            <div className="mt-3 flex items-center justify-end gap-2">
              <Select value={r.status} onChange={(e) => update(r, e.target.value as ReportStatus)} className="w-auto py-1.5 text-sm">
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
    <div className="space-y-6">
      <SectionHeading eyebrow="Admin" title="Platform moderation & analytics"
        sub="Manage verification, review reports and monitor community health." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total users" value={s?.total_users ?? "—"} icon={<Users size={16} />} />
        <Stat label="Verified users" value={s?.verified_users ?? "—"} tone="verified" icon={<BadgeCheck size={16} />} />
        <Stat label="Active journeys" value={s?.active_journeys ?? "—"} icon={<RouteIcon size={16} />} />
        <Stat label="Completed" value={s?.completed_journeys ?? "—"} icon={<CheckCircle2 size={16} />} />
        <Stat label="Reported users" value={s?.reported_users ?? "—"} tone="signal" icon={<Flag size={16} />} />
        <Stat label="Pending verification" value={s?.pending_verification ?? "—"} tone="signal" icon={<Clock size={16} />} />
        <Stat label="Shared trips" value={s?.total_shared_trips ?? "—"} icon={<Share2 size={16} />} />
        <Stat label="Money saved" value={s ? inr(s.money_saved_total) : "—"} tone="teal" icon={<Wallet size={16} />} />
      </div>

      <Segmented value={tab} onChange={setTab}
        options={[
          { value: "users", label: <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> Users</span> },
          { value: "reports", label: <span className="inline-flex items-center gap-1.5"><Flag size={14} /> Reports</span> },
        ]} />

      {tab === "users" ? <UsersPanel /> : <ReportsPanel />}
    </div>
  );
}
