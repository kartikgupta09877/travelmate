import { Link } from "react-router-dom";
import {
  ShieldCheck, MapPin, Star, Flag, Share2, Siren, Phone, Ambulance,
  BadgeCheck, EyeOff, MessageSquareWarning, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { SosButton } from "@/components/SafetyActions";
import { Card, SectionHeading, cx } from "@/components/ui";

const FEATURES = [
  { Icon: BadgeCheck, title: "Multi-Step Verification", desc: "Identity, phone, email, college, and vehicle checks build trust badges without exposing documents." },
  { Icon: MapPin, title: "Public Meeting Checkpoints", desc: "Trips meet at public landmarks. Your exact address is never published or shown." },
  { Icon: EyeOff, title: "Privacy Protection", desc: "Start zones display as approximate areas. Phone numbers stay private — coordinate safely in app." },
  { Icon: Star, title: "Community Ratings", desc: "Every completed trip includes mutual reviews. Ratings and cancellation history affect match score." },
  { Icon: Flag, title: "Instant Reporting", desc: "Report any user or suspicious behavior instantly. Moderation admins act promptly." },
  { Icon: Share2, title: "Live Trip Sharing", desc: "Share a private tracking link with trusted family or friends so someone always knows your route." },
];

const DO = ["Always meet first at a recommended public checkpoint", "Keep initial chat inside TravelMate until comfortable", "Check identity verification badges before accepting rides", "Share trip route links with a trusted emergency contact"];
const DONT = ["Share account passcodes, OTPs, or financial info", "Disclose exact home street address in open chats", "Transfer funds outside fair distance cost splitting", "Ignore pressure or suspicious behavior from a partner"];

export default function SafetyCenter() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade">
      <SectionHeading eyebrow="Safety & Trust" title="Community Safety Standard"
        sub="TravelMate connects verified members travelling along overlapping routes. These tools prioritize your privacy and peace of mind on every journey." />

      {/* SOS Alert Banner */}
      <Card className="border border-rose-200 bg-rose-50/40 shadow-xs">
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-rose-100 text-rose-600 shadow-2xs"><Siren size={24} /></span>
            <div>
              <h3 className="font-display font-800 text-ocean-900 text-lg">Emergency SOS & Incident Log</h3>
              <p className="text-xs text-slate-600 leading-relaxed mt-1">
                Triggering SOS broadcasts your approximate trip location to your trusted emergency contacts and logs the event.
              </p>
            </div>
          </div>
          <div className="shrink-0"><SosButton /></div>
        </div>
        <div className="grid gap-3 border-t border-rose-100 p-5 sm:grid-cols-3">
          {[
            { Icon: Phone, label: "Emergency Helpline", num: "112" },
            { Icon: Phone, label: "Police Control Room", num: "100" },
            { Icon: Ambulance, label: "Medical Ambulance", num: "102" },
          ].map((e) => (
            <a key={e.label} href={`tel:${e.num}`} className="flex items-center justify-between rounded-xl border border-rose-200/80 bg-white px-4 py-3 hover:bg-rose-50 transition-colors">
              <span className="flex items-center gap-2.5 text-xs font-bold text-ocean-900">
                <e.Icon size={16} className="text-rose-600" /> {e.label}
              </span>
              <span className="font-mono font-extrabold text-rose-600 text-xs">{e.num}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Feature cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <Card key={f.title} className="card-hover border border-slate-200/80 shadow-xs">
            <div className="p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-wash/80 text-teal-dark border border-teal/20 shadow-2xs mb-4"><f.Icon size={22} /></span>
              <h3 className="font-display font-700 text-ocean-900 text-base">{f.title}</h3>
              <p className="mt-2 text-xs font-semibold text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Do / Don't */}
      <div className="grid gap-5 sm:grid-cols-2">
        <Card className="border border-slate-200/80 shadow-xs">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2 font-display font-800 text-emerald-700 text-lg"><CheckCircle2 size={20} /> Community Guidelines</div>
            <ul className="space-y-3">{DO.map((d) => <li key={d} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" /> <span>{d}</span></li>)}</ul>
          </div>
        </Card>
        <Card className="border border-slate-200/80 shadow-xs">
          <div className="p-6">
            <div className="mb-4 flex items-center gap-2 font-display font-800 text-rose-700 text-lg"><AlertTriangle size={20} /> Red Flags to Avoid</div>
            <ul className="space-y-3">{DONT.map((d) => <li key={d} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700"><MessageSquareWarning size={16} className="mt-0.5 shrink-0 text-rose-500" /> <span>{d}</span></li>)}</ul>
          </div>
        </Card>
      </div>

      <div className="flex items-center gap-3.5 rounded-2xl bg-teal-wash/80 border border-teal/20 p-4 text-xs font-semibold text-teal-dark shadow-2xs">
        <ShieldCheck size={20} className="shrink-0 text-teal-dark" />
        <span>Complete your <Link to="/app/verify" className="font-bold underline">identity verification</Link> to build trust and increase match priority.</span>
      </div>
    </div>
  );
}
