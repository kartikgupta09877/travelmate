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
  { key: "email", label: "Email Address", Icon: Mail, kind: "otp", desc: "Verify your email via a 6-digit one-time passcode." },
  { key: "phone", label: "Phone Number (OTP)", Icon: Phone, kind: "otp", desc: "Verify your phone number with instant SMS passcode." },
  { key: "identity", label: "Government ID", Icon: Fingerprint, kind: "review", desc: "Submit for encrypted status review. Document data is never stored." },
  { key: "college", label: "College / Work Org", Icon: GraduationCap, kind: "review", desc: "Confirm student or organizational badge." },
  { key: "vehicle", label: "Driver & Vehicle", Icon: Car, kind: "review", desc: "Add driver license and vehicle details for seat sharing." },
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
        toast.push(res.message || "Passcode sent.", "info");
      } else {
        toast.push(res.message || "Submitted for review.", "success");
        await refresh();
      }
    } catch { toast.push("Could not initiate verification.", "error"); }
    finally { setBusy(false); }
  };

  const confirm = async (row: Row) => {
    setBusy(true);
    try {
      await api.auth.confirm(row.key, codeInput.trim());
      toast.push(`${row.label} verified successfully!`, "success");
      setOpenKey(null);
      await refresh();
    } catch { toast.push("Incorrect or expired passcode.", "error"); }
    finally { setBusy(false); }
  };

  const doneCount = ROWS.filter((r) => user.verification[r.key]).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade">
      <SectionHeading eyebrow="Trust & Security" title="Identity & Trust Checklist"
        sub="Complete verification badges to boost your candidate match score and build community trust." />

      <div className="flex items-center gap-3.5 rounded-2xl bg-teal-wash/80 border border-teal/20 p-4 text-xs font-semibold text-teal-dark shadow-xs">
        <ShieldCheck size={22} className="shrink-0 text-teal-dark" />
        <span>{doneCount} of {ROWS.length} verifications completed. Complete all badges for maximum match visibility.</span>
      </div>

      <div className="space-y-4">
        {ROWS.map((row) => {
          const done = user.verification[row.key];
          const pending = openKey === row.key;
          return (
            <Card key={row.key} className={cx("border border-slate-200/80 shadow-xs", done && "border-emerald-200 bg-emerald-50/20")}>
              <div className="flex items-center gap-4 p-5">
                <span className={cx("grid h-12 w-12 shrink-0 place-items-center rounded-2xl shadow-xs",
                  done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {done ? <CheckCircle2 size={22} /> : <row.Icon size={22} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-700 text-ocean-900 text-base">{row.label}</div>
                  <div className="text-xs font-semibold text-slate-600">{done ? "Verified & Active" : row.desc}</div>
                </div>
                {done ? (
                  <span className="chip-verified">Verified</span>
                ) : row.kind === "review" ? (
                  <Button variant="outline" sm loading={busy} onClick={() => send(row)}>Submit Review</Button>
                ) : (
                  <Button variant="outline" sm loading={busy && !pending} onClick={() => send(row)}>Send Code</Button>
                )}
              </div>

              {pending && !done && (
                <div className="border-t border-slate-200/80 bg-slate-50 p-5 rounded-b-2xl space-y-3">
                  {demoCode[row.key] && (
                    <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3.5 py-2 text-xs font-bold text-amber-800">
                      <Info size={15} /> Demo Mode Code: <span className="font-mono text-sm tracking-wider">{demoCode[row.key]}</span>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)}
                      placeholder="Enter 6-digit code" inputMode="numeric" maxLength={6} className="font-mono text-center tracking-widest text-base" />
                    <Button loading={busy} onClick={() => confirm(row)}>Verify Code</Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button lg onClick={() => nav("/app")}>Continue to Dashboard <ArrowRight size={18} /></Button>
      </div>
    </div>
  );
}
