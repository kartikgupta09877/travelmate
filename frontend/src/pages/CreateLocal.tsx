import { MapPin, ShieldCheck } from "lucide-react";
import { JourneyForm } from "@/components/JourneyForm";
import { SectionHeading } from "@/components/ui";

export default function CreateLocal() {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading eyebrow="Local travel" title="Create a local journey"
        sub="Daily commutes up to ~30 km. We match you on route overlap — not identical start points — and suggest a safe public checkpoint to meet." />
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-teal-wash px-4 py-3 text-sm text-teal-dark">
        <ShieldCheck size={18} className="shrink-0" />
        <span>Your start is stored as an approximate zone. The exact meeting point is only shared after both travellers accept.</span>
      </div>
      <JourneyForm type="local" />
    </div>
  );
}
