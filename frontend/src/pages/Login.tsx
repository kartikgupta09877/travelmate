import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthShell } from "./auth/AuthShell";
import { Button, Field, Input, Label } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { UserRound, ShieldCheck } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) nav("/app", { replace: true });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(email, password);
      nav(loc.state?.from || "/app", { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Sign in failed. Please try again.");
    } finally { setBusy(false); }
  };

  const demo = (em: string) => { setEmail(em); setPassword("password123"); };

  return (
    <AuthShell title="Welcome back" sub="Sign in to find partners and manage your journeys."
      footer={<>New to TravelMate? <Link to="/register" className="font-semibold text-teal hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{err}</div>}
        <Field label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></Field>
        <div>
          <Label>Password</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
        </div>
        <Button type="submit" loading={busy} className="w-full">Sign in</Button>
      </form>

      <div className="mt-6 rounded-xl border border-dashed border-line bg-canvas p-3.5">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Try the demo</div>
        <div className="flex flex-col gap-2">
          <button onClick={() => demo("demo@travelmate.app")} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-teal-wash">
            <UserRound size={15} className="text-teal" /> <span className="flex-1">Member · <b>demo@travelmate.app</b></span>
          </button>
          <button onClick={() => demo("admin@travelmate.app")} className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-teal-wash">
            <ShieldCheck size={15} className="text-verified" /> <span className="flex-1">Admin · <b>admin@travelmate.app</b></span>
          </button>
          <p className="text-xs text-ink-muted">Password for both: <span className="font-mono">password123</span></p>
        </div>
      </div>
    </AuthShell>
  );
}
