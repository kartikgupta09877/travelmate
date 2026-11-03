import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthShell } from "./auth/AuthShell";
import { Button, Field, Input, Label } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { UserRound, ShieldCheck, Eye, EyeOff, Lock, Mail } from "lucide-react";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as { state?: { from?: string } };
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
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
    <AuthShell title="Welcome back" sub="Sign in to find travel partners and manage your trips."
      footer={<>New to TravelMate? <Link to="/register" className="font-bold text-teal-dark hover:underline">Create a free account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 animate-fade">
            {err}
          </div>
        )}

        <Field label="Email address">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className="pl-10" />
          </div>
        </Field>

        <div>
          <Label>Password</Label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type={showPw ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" className="pl-10 pr-10" />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <Button type="submit" loading={busy} lg className="w-full mt-2">
          Sign in to TravelMate
        </Button>
      </form>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">Quick Demo Sign-In</div>
        <div className="flex flex-col gap-2">
          <button onClick={() => demo("demo@travelmate.app")} className="flex items-center gap-3 rounded-xl bg-white p-3 text-left text-xs font-medium shadow-xs border border-slate-200 hover:border-teal hover:bg-teal-wash/30 transition-all cursor-pointer">
            <span className="p-2 rounded-lg bg-teal-wash text-teal-dark"><UserRound size={15} /></span>
            <span className="flex-1">
              <strong className="block text-ocean-900 font-extrabold">Standard Traveller</strong>
              <span className="text-slate-600 font-mono font-semibold">demo@travelmate.app</span>
            </span>
          </button>
          <button onClick={() => demo("admin@travelmate.app")} className="flex items-center gap-3 rounded-xl bg-white p-3 text-left text-xs font-medium shadow-xs border border-slate-200 hover:border-emerald-500 hover:bg-emerald-wash/30 transition-all cursor-pointer">
            <span className="p-2 rounded-lg bg-emerald-wash text-emerald-dark"><ShieldCheck size={15} /></span>
            <span className="flex-1">
              <strong className="block text-ocean-900 font-extrabold">Platform Admin</strong>
              <span className="text-slate-600 font-mono font-semibold">admin@travelmate.app</span>
            </span>
          </button>
          <p className="mt-1 text-[11px] text-center text-slate-600 font-semibold">Demo Password: <span className="font-mono font-extrabold text-slate-900">password123</span></p>
        </div>
      </div>
    </AuthShell>
  );
}
