import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BadgeCheck, CheckCircle2, Clock3, Eye, Info, LockKeyhole,
  MapPin, ShieldCheck, Sparkles, Users,
} from "lucide-react";
import { Button, Card, Chip, SectionHeading, cx } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";

type PrivacyLevel = 1 | 2 | 3;

const PRIVACY_OPTIONS: { value: PrivacyLevel; title: string; detail: string; exposure: string }[] = [
  { value: 1, title: "Precise zone", detail: "Show a small area around your start point", exposure: "Higher route accuracy" },
  { value: 2, title: "Neighbourhood", detail: "Share only your broader locality", exposure: "Recommended balance" },
  { value: 3, title: "District", detail: "Keep your start area intentionally broad", exposure: "Maximum location privacy" },
];

const STORAGE_KEY = "travelmate_route_policy";

/**
 * A client-side simulation deliberately keeps the model legible: people can see
 * the trade-off before a journey is ever published. No address or live location
 * is sent by this tool.
 */
export default function TrustLab() {
  const toast = useToast();
  const [privacy, setPrivacy] = useState<PrivacyLevel>(2);
  const [timeFlex, setTimeFlex] = useState(20);
  const [shareVerification, setShareVerification] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const policy = JSON.parse(raw) as { privacy?: PrivacyLevel; timeFlex?: number; shareVerification?: boolean };
      if (policy.privacy && [1, 2, 3].includes(policy.privacy)) setPrivacy(policy.privacy);
      if (typeof policy.timeFlex === "number") setTimeFlex(Math.min(45, Math.max(10, policy.timeFlex)));
      if (typeof policy.shareVerification === "boolean") setShareVerification(policy.shareVerification);
      setSaved(true);
    } catch { /* A broken local preference should never interrupt route planning. */ }
  }, []);

  const outcome = useMemo(() => {
    // This is an explainable heuristic, not a claim of predictive accuracy.
    const timeLift = (timeFlex - 10) / 5;
    const privacyLift = (privacy - 1) * 1.8;
    const verificationLift = shareVerification ? 1 : 0;
    const candidates = Math.max(2, Math.round(4 + timeLift + privacyLift + verificationLift));
    const compatibility = Math.min(96, Math.round(70 + timeFlex * 0.32 - (privacy - 1) * 3 + (shareVerification ? 8 : 0)));
    const exposure = Math.round(64 - (privacy - 1) * 22 - (shareVerification ? 4 : 0));
    const trustSignals = shareVerification ? 5 : 2;
    return { candidates, compatibility, exposure: Math.max(12, exposure), trustSignals };
  }, [privacy, timeFlex, shareVerification]);

  const savePolicy = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ privacy, timeFlex, shareVerification }));
      setSaved(true);
      toast.push("Route policy saved on this device.", "success");
    } catch {
      toast.push("We couldn't save this preference in your browser.", "error");
    }
  };

  const selectedPrivacy = PRIVACY_OPTIONS[privacy - 1];

  return (
    <div className="mx-auto max-w-6xl space-y-6 animate-fade">
      <SectionHeading
        eyebrow="Trust Lab · Interactive demo"
        title="Design your match before you share your route"
        sub="A privacy-first simulator that makes the safety–convenience trade-off visible before a journey goes live. It never uses or reveals an exact address."
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <Card className="overflow-hidden border border-slate-200/90 shadow-card lg:col-span-7">
          <div className="border-b border-slate-200 bg-gradient-to-r from-teal-wash via-white to-sky-50 px-6 py-5">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-dark text-white shadow-md"><LockKeyhole size={19} /></span>
              <div>
                <h2 className="font-display text-lg font-extrabold text-ocean-900">Your route-sharing policy</h2>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">Move the controls and watch the matching explanation update in real time.</p>
              </div>
            </div>
          </div>

          <div className="space-y-7 p-6">
            <fieldset>
              <legend className="label flex items-center gap-2"><Eye size={14} className="text-teal-dark" /> Location precision</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {PRIVACY_OPTIONS.map((option) => {
                  const active = privacy === option.value;
                  return (
                    <button key={option.value} type="button" onClick={() => { setPrivacy(option.value); setSaved(false); }}
                      className={cx(
                        "rounded-2xl border p-3.5 text-left transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal/20",
                        active ? "border-teal bg-teal-wash shadow-sm" : "border-slate-200 bg-white hover:border-teal/50 hover:bg-slate-50",
                      )}>
                      <span className={cx("mb-2 grid h-8 w-8 place-items-center rounded-lg", active ? "bg-teal-dark text-white" : "bg-slate-100 text-slate-600")}><MapPin size={16} /></span>
                      <span className="block text-sm font-extrabold text-ocean-900">{option.title}</span>
                      <span className="mt-1 block text-[11px] font-semibold leading-relaxed text-slate-600">{option.detail}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <div className="flex items-end justify-between gap-4">
                <legend className="label flex items-center gap-2"><Clock3 size={14} className="text-teal-dark" /> Departure flexibility</legend>
                <span className="font-mono text-sm font-extrabold text-teal-dark">± {timeFlex} min</span>
              </div>
              <input aria-label="Departure flexibility in minutes" type="range" min="10" max="45" step="5" value={timeFlex}
                onChange={(event) => { setTimeFlex(Number(event.target.value)); setSaved(false); }}
                className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-teal" />
              <div className="mt-2 flex justify-between text-[11px] font-bold text-slate-500"><span>10 min · tighter plan</span><span>45 min · more options</span></div>
            </fieldset>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors hover:border-teal/40">
              <input type="checkbox" checked={shareVerification} onChange={(event) => { setShareVerification(event.target.checked); setSaved(false); }}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-teal" />
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-extrabold text-ocean-900"><BadgeCheck size={16} className="text-teal-dark" /> Use my verification badges in matching</span>
                <span className="mt-1 block text-xs font-semibold leading-relaxed text-slate-600">Only verification status is considered—never documents, phone number, or home address.</span>
              </span>
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600"><Info size={14} /> A preference, not a safety guarantee.</span>
              <Button onClick={savePolicy}><ShieldCheck size={16} /> {saved ? "Policy saved" : "Save route policy"}</Button>
            </div>
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-5">
          <div className="relative overflow-hidden rounded-3xl bg-ocean-900 p-6 text-white shadow-lift">
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-teal/30 blur-3xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <Chip tone="teal">Live explanation</Chip>
                <Sparkles size={19} className="text-amber-300" />
              </div>
              <h2 className="mt-4 font-display text-2xl font-extrabold leading-tight">Your match envelope</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-300">With a {selectedPrivacy.title.toLowerCase()} and ±{timeFlex}-minute window, TravelMate looks for safe overlap—not identical home locations.</p>

              <div className="mt-6 grid grid-cols-3 gap-2">
                <Metric label="Likely matches" value={`${outcome.candidates}`} icon={<Users size={15} />} />
                <Metric label="Best fit" value={`${outcome.compatibility}%`} icon={<Sparkles size={15} />} />
                <Metric label="Location exposed" value={`${outcome.exposure}%`} icon={<Eye size={15} />} />
              </div>

              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-center justify-between text-xs font-bold text-slate-200"><span>Privacy protection</span><span>{100 - outcome.exposure}% retained</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-teal-light transition-all duration-300" style={{ width: `${100 - outcome.exposure}%` }} /></div>
                <p className="mt-3 text-[11px] font-semibold leading-relaxed text-slate-300">{selectedPrivacy.exposure}. Exact location remains hidden until both travellers accept a public checkpoint.</p>
              </div>
            </div>
          </div>

          <Card className="border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center gap-2"><ShieldCheck size={18} className="text-teal-dark" /><h2 className="font-display text-base font-extrabold text-ocean-900">Why this is different</h2></div>
            <ul className="mt-4 space-y-3">
              {[
                `${outcome.trustSignals} trust signals used without revealing documents`,
                "Public checkpoints are proposed before direct contact is needed",
                "Every recommendation explains its safety and convenience trade-off",
              ].map((item) => <li key={item} className="flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-700"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />{item}</li>)}
            </ul>
          </Card>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-teal/25 bg-teal-wash/60 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div><div className="font-display text-base font-extrabold text-ocean-900">Ready to turn your policy into a real journey?</div><p className="mt-1 text-xs font-semibold text-slate-600">Publish a commute and use the same principles to find compatible partners.</p></div>
        <a href="/app/local"><Button variant="outline">Create a private commute <ArrowRight size={15} /></Button></a>
      </div>
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <div className="rounded-xl border border-white/10 bg-white/10 p-3"><div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-slate-300">{icon}{label}</div><div className="mt-1 font-mono text-lg font-extrabold text-white">{value}</div></div>;
}
