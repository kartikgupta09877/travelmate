import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthShell } from "./auth/AuthShell";
import { Button, Field, Input, Label, Select } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { ShieldCheck } from "lucide-react";
import type { VehicleType } from "@/lib/types";

const CITIES = ["New Delhi", "Gurugram", "Noida", "Ghaziabad", "Faridabad", "Other"];

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({
    full_name: "", email: "", phone: "", password: "", city: "New Delhi", date_of_birth: "",
    vehicle_type: "none" as VehicleType, vehicle_seats: 4,
  });
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
    <AuthShell title="Create your account" sub="It takes a minute. You can verify your identity next."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-teal hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        {err && <div className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{err}</div>}
        <Field label="Full name"><Input required minLength={2} value={f.full_name} onChange={set("full_name")} placeholder="Your name" /></Field>
        <Field label="Email"><Input type="email" required value={f.email} onChange={set("email")} placeholder="you@example.com" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone"><Input required value={f.phone} onChange={set("phone")} placeholder="+91 …" /></Field>
          <div>
            <Label>City</Label>
            <Select value={f.city} onChange={set("city")}>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Do you have a vehicle?">
            <Select value={f.vehicle_type} onChange={(e) => setF({ ...f, vehicle_type: e.target.value as VehicleType })}>
              <option value="none">No vehicle — looking for a partner</option>
              <option value="car">Car — can share seats</option>
              <option value="bike">Bike</option>
            </Select>
          </Field>
          {f.vehicle_type === "car" && (
            <Field label="Available passenger seats">
              <Select value={f.vehicle_seats} onChange={(e) => setF({ ...f, vehicle_seats: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5, 6].map((seats) => <option key={seats} value={seats}>{seats} seat{seats === 1 ? "" : "s"}</option>)}
              </Select>
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Password</Label>
            <Input type="password" required minLength={6} value={f.password} onChange={set("password")} placeholder="6+ characters" />
          </div>
          <Field label="Date of birth" hint="optional"><Input type="date" value={f.date_of_birth} onChange={set("date_of_birth")} /></Field>
        </div>
        <Button type="submit" loading={busy} className="w-full">Create account</Button>
      </form>
      <p className="mt-4 flex items-start gap-2 text-xs text-ink-muted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-verified" />
        We never store raw identity documents — only your verification status. Your exact address is never shown to other members.
      </p>
    </AuthShell>
  );
}
