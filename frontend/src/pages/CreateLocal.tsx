import { MapPin, ShieldCheck } from "lucide-react";
import { JourneyForm } from "@/components/JourneyForm";
import { SectionHeading } from "@/components/ui";

export default function CreateLocal() {
  return (
    <div className="space-y-6 animate-fade">
      <SectionHeading eyebrow="Local Commute" title="Create a local journey route"
        sub="Daily commutes up to ~30 km. We match overlapping routes — start points don't need to match — and recommend safe public checkpoints." />
      <div className="flex items-center gap-3.5 rounded-2xl bg-teal-wash/80 border border-teal/20 p-4 text-xs font-semibold text-teal-dark shadow-2xs">
        <ShieldCheck size={20} className="shrink-0 text-teal-dark" />
        <span>Your exact home location is never displayed. Only approximate zones and mutually agreed public meeting checkpoints are shown.</span>
      </div>
      <JourneyForm type="local" />
    </div>
  );
}
