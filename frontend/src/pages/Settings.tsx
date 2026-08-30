import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Car, Bike, Ban, LogOut, ShieldCheck, Mail, Phone, Save, CheckCircle2 } from "lucide-react";
import type { VehicleType } from "@/lib/types";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button, Card, Field, Input, Select, Textarea, SectionHeading, Chip, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    full_name: user?.full_name || "", city: user?.city || "", bio: user?.bio || "",
    preferred_travel_type: user?.preferred_travel_type || "",
    college_or_company: user?.college_or_company || "",
    vehicle_type: user?.vehicle.type || "none",
    vehicle_model: user?.vehicle.model || "", vehicle_color: user?.vehicle.color || "",
    vehicle_seats: user?.vehicle.seats ?? 4,
  });
  if (!user) return null;
  const set = (k: keyof typeof f, v: any) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const updated = await api.users.updateMe({
        full_name: f.full_name, city: f.city, bio: f.bio,
        preferred_travel_type: f.preferred_travel_type || null,
        college_or_company: f.college_or_company || null,
        vehicle: {
          type: f.vehicle_type as VehicleType,
          model: f.vehicle_model || null,
          color: f.vehicle_color || null,
          seats: f.vehicle_type === "car" ? Number(f.vehicle_seats) : f.vehicle_type === "bike" ? 1 : 0,
        },
      });
      setUser(updated);
      toast.push("Profile saved.", "success");
    } catch { toast.push("Could not save changes.", "error"); }
    finally { setSaving(false); }
  };

  const hasVehicle = f.vehicle_type !== "none";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <SectionHeading eyebrow="Settings" title="Account & preferences" />

      {/* Account */}
      <Card>
        <div className="space-y-4 p-5">
          <div className="eyebrow">Account</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
            <Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft"><Mail size={15} /> {user.email}</span>
              {user.verification.email ? <Chip tone="verified"><CheckCircle2 size={12} /> Verified</Chip> : <Link to="/app/verify" className="text-xs font-semibold text-teal">Verify</Link>}
            </div>
            <div className="flex items-center justify-between rounded-xl border border-line px-3.5 py-2.5">
              <span className="inline-flex items-center gap-2 text-sm text-ink-soft"><Phone size={15} /> {user.phone}</span>
              {user.verification.phone ? <Chip tone="verified"><CheckCircle2 size={12} /> Verified</Chip> : <Link to="/app/verify" className="text-xs font-semibold text-teal">Verify</Link>}
            </div>
          </div>
          <Field label="Bio" hint="optional"><Textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A line about how you like to travel." /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred travel">
              <Select value={f.preferred_travel_type} onChange={(e) => set("preferred_travel_type", e.target.value)}>
                <option value="">No preference</option><option value="local">Local commute</option><option value="long">Long trips</option><option value="both">Both</option>
              </Select>
            </Field>
            <Field label="College / company" hint="optional"><Input value={f.college_or_company} onChange={(e) => set("college_or_company", e.target.value)} /></Field>
          </div>
        </div>
      </Card>

      {/* Vehicle */}
      <Card>
        <div className="space-y-4 p-5">
          <div className="eyebrow">Vehicle</div>
          <div className="flex gap-2">
            {(["none", "car", "bike"] as VehicleType[]).map((v) => {
              const Icon = v === "bike" ? Bike : v === "car" ? Car : Ban;
              return (
                <button key={v} type="button" onClick={() => set("vehicle_type", v)}
                  className={cx("flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm font-medium capitalize transition-colors",
                    f.vehicle_type === v ? "border-teal bg-teal-wash text-teal-dark" : "border-line text-ink-muted hover:border-teal/40")}>
                  <Icon size={16} /> {v}
                </button>
              );
            })}
          </div>
          {hasVehicle && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Model" hint="optional"><Input value={f.vehicle_model} onChange={(e) => set("vehicle_model", e.target.value)} placeholder="e.g. Swift" /></Field>
              <Field label="Colour" hint="optional"><Input value={f.vehicle_color} onChange={(e) => set("vehicle_color", e.target.value)} placeholder="e.g. White" /></Field>
              {f.vehicle_type === "car" && <Field label="Available passenger seats"><Select value={f.vehicle_seats} onChange={(e) => set("vehicle_seats", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}</Select></Field>}
            </div>
          )}
          <p className="flex items-center gap-1.5 text-xs text-ink-muted"><ShieldCheck size={13} /> Add vehicle details, then verify it from the <Link to="/app/verify" className="font-semibold text-teal">verification page</Link> to earn a driver badge.</p>
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => { logout(); nav("/"); }}><LogOut size={16} /> Log out</Button>
        <Button loading={saving} onClick={save}><Save size={16} /> Save changes</Button>
      </div>

      {user.blocked_user_ids.length > 0 && (
        <p className="text-center text-xs text-ink-muted">You have blocked {user.blocked_user_ids.length} user{user.blocked_user_ids.length === 1 ? "" : "s"}. Unblock them from their profile.</p>
      )}
    </div>
  );
}
