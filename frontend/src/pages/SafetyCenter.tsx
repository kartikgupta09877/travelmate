import { Link } from "react-router-dom";
import {
  ShieldCheck, MapPin, Star, Flag, Share2, Siren, Phone, Ambulance,
  BadgeCheck, EyeOff, MessageSquareWarning, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { SosButton } from "@/components/SafetyActions";
import { Card, SectionHeading, cx } from "@/components/ui";

const FEATURES = [
  { Icon: BadgeCheck, title: "Multi-step verification", desc: "Email, phone, identity, college and vehicle checks build a trust profile — shown as badges, never raw documents." },
  { Icon: MapPin, title: "Safe public checkpoints", desc: "Local trips meet at public landmarks. Your exact location is never shown and is shared only after both accept." },
  { Icon: EyeOff, title: "Privacy by default", desc: "Home areas display as approximate zones. Phone numbers stay private — coordinate through in-app chat." },
  { Icon: Star, title: "Ratings & reliability", desc: "Every trip can be rated. Cancellation and no-show rates feed directly into match quality." },
  { Icon: Flag, title: "Report & moderation", desc: "Report any user in a couple of taps. A moderation team reviews reports and can suspend accounts." },
  { Icon: Share2, title: "Share your trip", desc: "Send a private live link to a trusted contact so someone always knows your route and meeting point." },
];

const DO = ["Meet first at the suggested public checkpoint", "Keep chat inside TravelMate until you're confident", "Check verification badges and ratings before you travel", "Share your trip with a trusted contact"];
const DONT = ["Share OTPs, passwords or payment card details", "Reveal your exact home address in chat", "Send money outside a fair, agreed cost split", "Ignore a partner who pressures or rushes you"];

export default function SafetyCenter() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <SectionHeading eyebrow="Safety center" title="Built as a verified, safety-focused community"
        sub="TravelMate is not a taxi service. It connects people already going the same way. These tools reduce risk — they don't remove it entirely, so always use your judgement." />

      {/* SOS + emergency */}
      <Card className="border-red-200 bg-red-50/50">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-100 text-red-600"><Siren size={22} /></span>
            <div>
              <h3 className="font-display font-700 text-ink">In an emergency</h3>
              <p className="text-sm text-ink-muted">SOS alerts your trusted contacts and logs the incident with your approximate location. It does <b>not</b> contact or replace emergency services.</p>
            </div>
          </div>
          <div className="shrink-0"><SosButton /></div>
        </div>
        <div className="grid gap-2 border-t border-red-100 p-5 sm:grid-cols-3">
          {[
            { Icon: Phone, label: "Emergency (all)", num: "112" },
            { Icon: Phone, label: "Police", num: "100" },
            { Icon: Ambulance, label: "Ambulance", num: "102" },
          ].map((e) => (
            <a key={e.label} href={`tel:${e.num}`} className="flex items-center gap-3 rounded-xl border border-red-100 bg-white px-4 py-3 hover:bg-red-50">
              <e.Icon size={18} className="text-red-600" />
              <span className="flex-1 text-sm text-ink">{e.label}</span>
              <span className="font-mono font-700 text-ink">{e.num}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Feature grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="card-hover">
            <div className="p-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-wash text-teal"><f.Icon size={20} /></span>
              <h3 className="mt-3 font-display font-700 text-ink">{f.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Do / Don't */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 font-display font-700 text-verified"><CheckCircle2 size={18} /> Do</div>
            <ul className="space-y-2">{DO.map((d) => <li key={d} className="flex items-start gap-2 text-sm text-ink-soft"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-verified" /> {d}</li>)}</ul>
          </div>
        </Card>
        <Card>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 font-display font-700 text-red-600"><AlertTriangle size={18} /> Don't</div>
            <ul className="space-y-2">{DONT.map((d) => <li key={d} className="flex items-start gap-2 text-sm text-ink-soft"><MessageSquareWarning size={15} className="mt-0.5 shrink-0 text-red-500" /> {d}</li>)}</ul>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3 rounded-xl bg-teal-wash px-4 py-3 text-sm text-teal-dark">
        <ShieldCheck size={18} className="shrink-0" />
        <span>Complete your <Link to="/app/verify" className="font-semibold underline">verification</Link> to raise your trust level and unlock better matches. Verification is a trust layer, not a guarantee.</span>
      </div>
    </div>
  );
}
