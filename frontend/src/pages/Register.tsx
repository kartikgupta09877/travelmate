import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./auth/AuthShell";
import { Button, Field, Input, Label, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff, Car, Calendar } from "lucide-react";
import type { VehicleType } from "@/lib/types";

const CITIES = ["New Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad", "Other"];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    full_name: "", email: "", phone: "", password: "", city: "New Delhi", date_of_birth: "",
    vehicle_type: "none" as VehicleType, vehicle_seats: 4,
  });
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const vehicle = f.vehicle_type === "car"
        ? { type: "car" as const, seats: Number(f.vehicle_seats) }
        : f.vehicle_type === "bike"
          ? { type: "bike" as const, seats: 1 }
          : { type: "none" as const, seats: 0 };
      await register({
        full_name: f.full_name, email: f.email, phone: f.phone, password: f.password,
        city: f.city, date_of_birth: f.date_of_birth || undefined, vehicle,
      });
      nav("/app/verify", { replace: true });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create account.");
    } finally { setBusy(false); }
  };

  return (
    <AuthShell title="Create your account" sub="Join verified commuters & travellers in under a minute."
      footer={<>Already registered? <Link to="/login" className="font-bold text-teal-dark hover:underline">Sign in instead</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700 animate-fade">
            {err}
          </div>
        )}

        <Field label="Full name">
          <div className="relative">
            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input required minLength={2} value={f.full_name} onChange={set("full_name")} placeholder="John Doe" className="pl-10" />
          </div>
        </Field>

        <Field label="Email address">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input type="email" required value={f.email} onChange={set("email")} placeholder="you@example.com" className="pl-10" />
          </div>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone number">
            <div className="relative">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input required value={f.phone} onChange={set("phone")} placeholder="+91 …" className="pl-10" />
            </div>
          </Field>
          <div>
            <Label>City</Label>
            <Select value={f.city} onChange={set("city")}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Vehicle status">
            <Select value={f.vehicle_type} onChange={(e) => setF({ ...f, vehicle_type: e.target.value as VehicleType })}>
              <option value="none">No vehicle — passenger</option>
              <option value="car">Car — offering seats</option>
              <option value="bike">Bike — passenger/rider</option>
            </Select>
          </Field>
          {f.vehicle_type === "car" && (
            <Field label="Available seats">
              <Select value={f.vehicle_seats} onChange={(e) => setF({ ...f, vehicle_seats: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6].map((seats) => <option key={seats} value={seats}>{seats} seat{seats === 1 ? "" : "s"}</option>)}
              </Select>
            </Field>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input type={showPw ? "text" : "password"} required minLength={6} value={f.password} onChange={set("password")} placeholder="6+ chars" className="pl-10 pr-9" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <Field label="Date of birth" hint="optional">
            <Input type="date" value={f.date_of_birth} onChange={set("date_of_birth")} />
          </Field>
        </div>

        <Button type="submit" loading={busy} lg className="w-full mt-2">
          Create Account & Verify
        </Button>
      </form>

      <p className="mt-5 flex items-start gap-2.5 text-xs font-semibold text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
        We prioritize privacy: your exact home address is never published to other members, only verified public meeting checkpoints.
      </p>
    </AuthShell>
  );
}
