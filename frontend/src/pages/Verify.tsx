import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Phone, Fingerprint, GraduationCap, Car, ShieldCheck, CheckCircle2, ArrowRight, Info } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Button, Card, Input, SectionHeading, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import type { VerificationChannel } from "@/lib/types";

interface Row {
  key: VerificationChannel; label: string; Icon: typeof Mail; kind: "otp" | "review"; desc: string;
}
const ROWS: Row[] = [
  { key: "email", label: "Email", Icon: Mail, kind: "otp", desc: "We'll send a 6-digit code to your email." },
  { key: "phone", label: "Phone (OTP)", Icon: Phone, kind: "otp", desc: "Verify your number with a one-time code." },
  { key: "identity", label: "Identity", Icon: Fingerprint, kind: "review", desc: "Submit for review. We store only your status — never the document." },
  { key: "college", label: "College / Company", Icon: GraduationCap, kind: "review", desc: "Confirm your student or work affiliation." },
  { key: "vehicle", label: "Vehicle (for drivers)", Icon: Car, kind: "review", desc: "Add your vehicle for a driver badge." },
];

export default function Verify() {
  const { user, refresh } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const [openKey, setOpenKey] = useState<VerificationChannel | null>(null);
  const [demoCode, setDemoCode] = useState<Record<string, string>>({});
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const send = async (row: Row) => {
    setBusy(true);
    try {
      const res = await api.auth.sendCode(row.key);
      if (row.kind === "otp") {
        setOpenKey(row.key);
        setCodeInput("");
        if (res.demo_code) setDemoCode((d) => ({ ...d, [row.key]: res.demo_code! }));
        toast.push(res.message || "Code sent.", "info");
      } else {
        toast.push(res.message || "Submitted for review.", "success");
        await refresh();
      }
    } catch { toast.push("Could not start verification.", "error"); }
    finally { setBusy(false); }
  };

  const confirm = async (row: Row) => {
    setBusy(true);
    try {
      await api.auth.confirm(row.key, codeInput.trim());
      toast.push(`${row.label} verified.`, "success");
      setOpenKey(null);
      await refresh();
    } catch { toast.push("Incorrect or expired code.", "error"); }
    finally { setBusy(false); }
  };

  const doneCount = ROWS.filter((r) => user.verification[r.key]).length;

  return (
    <div className="mx-auto max-w-2xl">
      <SectionHeading eyebrow="Trust & safety" title="Verify your account"
        sub="Each verification adds a badge and improves your matches. Complete them in any order." />

      <div className="mb-5 flex items-center gap-3 rounded-xl bg-teal-wash px-4 py-3 text-sm text-teal-dark">
        <ShieldCheck size={18} />
        <span>{doneCount} of {ROWS.length} verifications complete. Verification is a trust layer — it reduces risk but doesn't guarantee it.</span>
      </div>

      <div className="space-y-3">
        {ROWS.map((row) => {
          const done = user.verification[row.key];
          const pending = openKey === row.key;
          return (
            <Card key={row.key} className={cx(done && "ring-1 ring-verified/30")}>
              <div className="flex items-center gap-4 p-4">
                <span className={cx("grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                  done ? "bg-verified-wash text-verified" : "bg-ink/5 text-ink-muted")}>
                  {done ? <CheckCircle2 size={20} /> : <row.Icon size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-600 text-ink">{row.label}</div>
                  <div className="text-xs text-ink-muted">{done ? "Verified" : row.desc}</div>
                </div>
                {done ? (
                  <span className="chip-verified">Verified</span>
                ) : row.kind === "review" ? (
                  <Button variant="outline" sm loading={busy} onClick={() => send(row)}>Submit</Button>
                ) : (
                  <Button variant="outline" sm loading={busy && !pending} onClick={() => send(row)}>Send code</Button>
                )}
              </div>

              {pending && !done && (
                <div className="border-t border-line bg-canvas/60 p-4">
                  {demoCode[row.key] && (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-signal-wash px-3 py-2 text-xs text-signal">
                      <Info size={14} /> Demo mode: your code is <span className="font-mono font-700">{demoCode[row.key]}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} className="font-mono" />
                    <Button loading={busy} onClick={() => confirm(row)}>Verify</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        <Button onClick={() => nav("/app")}>Continue to dashboard <ArrowRight size={16} /></Button>
      </div>
    </div>
  );
}
