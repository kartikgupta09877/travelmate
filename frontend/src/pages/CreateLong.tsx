import { Route as RouteIcon, Users } from "lucide-react";
import { JourneyForm } from "@/components/JourneyForm";
import { SectionHeading } from "@/components/ui";

export default function CreateLong() {
  return (
    <div className="mx-auto max-w-5xl">
      <SectionHeading eyebrow="Long trip" title="Create a long trip"
        sub="Intercity and group journeys over ~30 km. Set your date, budget and seats, then match with verified travellers going the same way." />
      <div className="mb-5 flex items-center gap-3 rounded-xl bg-signal-wash px-4 py-3 text-sm text-signal">
        <Users size={18} className="shrink-0" />
        <span>Travelling solo or in a group — other verified users can request to join, and costs are shared fairly per person.</span>
      </div>
      <JourneyForm type="long" />
    </div>
  );
}
