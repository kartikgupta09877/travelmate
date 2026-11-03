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
      toast.push("Account preferences saved successfully!", "success");
    } catch { toast.push("Could not save settings.", "error"); }
    finally { setSaving(false); }
  };

  const hasVehicle = f.vehicle_type !== "none";

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade">
      <SectionHeading eyebrow="Account Settings" title="Profile & Preferences" />

      {/* Account Info Card */}
      <Card className="border border-slate-200/80 shadow-card">
        <div className="space-y-5 p-6">
          <div className="eyebrow">Personal Information</div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name"><Input value={f.full_name} onChange={(e) => set("full_name", e.target.value)} /></Field>
            <Field label="City"><Input value={f.city} onChange={(e) => set("city", e.target.value)} /></Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 p-3.5 bg-slate-50">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><Mail size={16} className="text-teal" /> {user.email}</span>
              {user.verification.email ? <Chip tone="verified"><CheckCircle2 size={12} /> Verified</Chip> : <Link to="/app/verify" className="text-xs font-bold text-teal-dark hover:underline">Verify</Link>}
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 p-3.5 bg-slate-50">
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700"><Phone size={16} className="text-teal" /> {user.phone}</span>
              {user.verification.phone ? <Chip tone="verified"><CheckCircle2 size={12} /> Verified</Chip> : <Link to="/app/verify" className="text-xs font-bold text-teal-dark hover:underline">Verify</Link>}
            </div>
          </div>
          <Field label="Bio / Travel Motto" hint="optional"><Textarea value={f.bio} onChange={(e) => set("bio", e.target.value)} placeholder="A short bio about how you travel…" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Preferred Travel Mode">
              <Select value={f.preferred_travel_type} onChange={(e) => set("preferred_travel_type", e.target.value)}>
                <option value="">No preference</option><option value="local">Local Commute</option><option value="long">Intercity Trips</option><option value="both">Both</option>
              </Select>
            </Field>
            <Field label="College / Work Affiliation" hint="optional"><Input value={f.college_or_company} onChange={(e) => set("college_or_company", e.target.value)} /></Field>
          </div>
        </div>
      </Card>

      {/* Vehicle Card */}
      <Card className="border border-slate-200/80 shadow-card">
        <div className="space-y-5 p-6">
          <div className="eyebrow">Vehicle Configuration</div>
          <div className="flex gap-3">
            {(["none", "car", "bike"] as VehicleType[]).map((v) => {
              const Icon = v === "bike" ? Bike : v === "car" ? Car : Ban;
              return (
                <button key={v} type="button" onClick={() => set("vehicle_type", v)}
                  className={cx("flex flex-1 items-center justify-center gap-2 rounded-2xl border py-3 text-xs font-bold capitalize transition-all select-none",
                    f.vehicle_type === v ? "border-teal bg-teal-wash text-teal-dark shadow-xs" : "border-slate-200 text-slate-500 hover:border-teal/40")}>
                  <Icon size={18} /> {v}
                </button>
              );
            })}
          </div>
          {hasVehicle && (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Vehicle Model" hint="optional"><Input value={f.vehicle_model} onChange={(e) => set("vehicle_model", e.target.value)} placeholder="e.g. Maruti Swift" /></Field>
              <Field label="Colour" hint="optional"><Input value={f.vehicle_color} onChange={(e) => set("vehicle_color", e.target.value)} placeholder="e.g. White" /></Field>
              {f.vehicle_type === "car" && <Field label="Passenger Seats"><Select value={f.vehicle_seats} onChange={(e) => set("vehicle_seats", Number(e.target.value))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} seats</option>)}</Select></Field>}
            </div>
          )}
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <ShieldCheck size={16} className="text-teal-dark shrink-0" />
            Add vehicle details and verify them under <Link to="/app/verify" className="font-bold text-teal-dark underline ml-1">Verification</Link> to receive a verified driver badge.
          </p>
        </div>
      </Card>

      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" className="text-rose-600 hover:bg-rose-50 font-bold" onClick={() => { logout(); nav("/"); }}><LogOut size={16} /> Sign out</Button>
        <Button lg loading={saving} onClick={save}><Save size={16} /> Save Changes</Button>
      </div>

      {user.blocked_user_ids.length > 0 && (
        <p className="text-center text-xs font-semibold text-slate-600">You have blocked {user.blocked_user_ids.length} member{user.blocked_user_ids.length === 1 ? "" : "s"}. Manage blocks directly from their profiles.</p>
      )}
    </div>
  );
}
