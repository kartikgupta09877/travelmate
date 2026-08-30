import { useState } from "react";
import { Siren, Share2, Flag, Copy, Check, Phone, Ambulance, ShieldAlert, UserX } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Modal } from "./ui/Modal";
import { Button, Field, Select, Textarea, Input, cx } from "./ui";
import { useToast } from "./ui/Toast";

// ---- SOS ----
export function SosButton({ tripId, className, block }: { tripId?: string; className?: string; block?: boolean }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Awaited<ReturnType<typeof api.safety.sos>> | null>(null);

  const trigger = async () => {
    setOpen(true); setLoading(true);
    try {
      const loc = await new Promise<{ lat?: number; lng?: number }>((resolve) => {
        if (!navigator.geolocation) return resolve({});
        navigator.geolocation.getCurrentPosition(
          (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
          () => resolve({}), { timeout: 4000 });
      });
      setRes(await api.safety.sos({ trip_id: tripId, ...loc }));
    } catch { toast.push("Could not raise the alert. Call emergency services directly.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Button variant="danger" className={cx(block && "w-full", className)} onClick={trigger}>
        <Siren size={16} /> Emergency / SOS
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Emergency SOS" size="sm">
        <div className="space-y-4">
          <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
            <div className="flex items-center gap-2 font-semibold"><ShieldAlert size={16} /> This does not replace emergency services.</div>
            <p className="mt-1 text-red-600/90">If you are in danger, call your local emergency number immediately. TravelMate alerts your trusted contacts and logs the alert — it cannot dispatch help.</p>
          </div>
          {loading ? <p className="text-sm text-ink-muted">Raising alert and sharing your approximate location…</p> : res && (
            <>
              <p className="text-sm text-ink-soft">{res.message}</p>
              <div className="grid gap-2">
                {[
                  { Icon: Phone, label: "Police", num: res.emergency_numbers.police },
                  { Icon: Ambulance, label: "Ambulance", num: res.emergency_numbers.ambulance },
                  { Icon: Phone, label: "Women's helpline", num: res.emergency_numbers.women_helpline },
                ].map((e) => (
                  <a key={e.label} href={`tel:${e.num}`}
                    className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 hover:bg-canvas">
                    <e.Icon size={18} className="text-red-600" />
                    <span className="flex-1 text-sm font-medium text-ink">{e.label}</span>
                    <span className="font-mono font-700 text-ink">{e.num}</span>
                  </a>
                ))}
              </div>
              <p className="text-[11px] text-ink-muted">{res.disclaimer}</p>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}

// ---- Share trip with trusted contact ----
export function ShareTripButton({ tripId, variant = "outline", block }: { tripId: string; variant?: "outline" | "ghost"; block?: boolean }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const share = async () => {
    setLoading(true);
    try {
      const r = await api.safety.share({ trip_id: tripId, contact_name: name || undefined });
      setUrl(r.share_url);
    } catch { toast.push("Could not create a share link.", "error"); }
    finally { setLoading(false); }
  };
  const copy = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* */ }
  };

  return (
    <>
      <Button variant={variant} className={cx(block && "w-full")} onClick={() => { setOpen(true); setUrl(null); }}>
        <Share2 size={16} /> Share trip
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Share trip with a trusted contact" size="sm"
        footer={url ? <Button onClick={() => setOpen(false)}>Done</Button>
          : <><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={loading} onClick={share}>Create link</Button></>}>
        {url ? (
          <div className="space-y-3">
            <p className="text-sm text-ink-soft">Send this private link to someone you trust. They can follow your trip status and meeting point without signing in.</p>
            <div className="flex items-center gap-2 rounded-xl border border-line bg-canvas p-2">
              <span className="flex-1 truncate font-mono text-xs text-ink-soft">{url}</span>
              <button onClick={copy} className="rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white">
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        ) : (
          <Field label="Contact name" hint="optional">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mom, roommate" />
          </Field>
        )}
      </Modal>
    </>
  );
}

// ---- Report user ----
const REASONS = ["Unsafe driving", "No-show", "Harassment or misconduct", "Fake profile", "Payment dispute", "Other"];
export function ReportButton({ userId, tripId, label = "Report", block }: { userId: string; tripId?: string; label?: string; block?: boolean }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await api.safety.report({ reported_user_id: userId, trip_id: tripId, reason, details: details || undefined });
      toast.push("Report submitted. Our moderation team will review it.", "success");
      setOpen(false); setDetails("");
    } catch (e) { toast.push(e instanceof ApiError ? e.message : "Could not submit report.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <Button variant="ghost" className={cx("text-red-600 hover:bg-red-50", block && "w-full")} onClick={() => setOpen(true)}>
        <Flag size={16} /> {label}
      </Button>
      <Modal open={open} onClose={() => setOpen(false)} title="Report a user" size="sm"
        footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button variant="danger" loading={loading} onClick={submit}>Submit report</Button></>}>
        <div className="space-y-4">
          <Field label="Reason"><Select value={reason} onChange={(e) => setReason(e.target.value)}>{REASONS.map((r) => <option key={r}>{r}</option>)}</Select></Field>
          <Field label="What happened?" hint="optional"><Textarea value={details} onChange={(e) => setDetails(e.target.value)} placeholder="Share any details that help us review this." /></Field>
          <p className="text-[11px] text-ink-muted">Reports are confidential. Misuse of reporting may affect your own trust level.</p>
        </div>
      </Modal>
    </>
  );
}

// ---- Block / unblock ----
export function BlockButton({ userId, blocked, onChange, block }: { userId: string; blocked: boolean; onChange?: (b: boolean) => void; block?: boolean }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const toggle = async () => {
    setLoading(true);
    try {
      if (blocked) { await api.users.unblock(userId); toast.push("User unblocked.", "info"); onChange?.(false); }
      else { await api.users.block(userId); toast.push("User blocked. They can no longer match or message you.", "success"); onChange?.(true); }
    } catch { toast.push("Action failed.", "error"); }
    finally { setLoading(false); }
  };
  return (
    <Button variant="outline" className={cx(block && "w-full")} loading={loading} onClick={toggle}>
      <UserX size={16} /> {blocked ? "Unblock user" : "Block user"}
    </Button>
  );
}
