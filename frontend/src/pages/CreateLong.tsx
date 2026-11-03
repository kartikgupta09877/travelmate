import { Route as RouteIcon, Users, Sparkles } from "lucide-react";
import { JourneyForm } from "@/components/JourneyForm";
import { SectionHeading } from "@/components/ui";

export default function CreateLong() {
  return (
    <div className="space-y-6 animate-fade">
      <SectionHeading eyebrow="Intercity Trip" title="Create a long-distance trip"
        sub="City-to-city and intercity journeys over ~30 km. Set your travel date, available seats, and budget to find verified partners." />
      <div className="flex items-center gap-3.5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs font-semibold text-amber-800 shadow-2xs">
        <Users size={20} className="shrink-0 text-amber-600" />
        <span>Solo travellers or group rides — verified members can view your route and request to share the travel costs.</span>
      </div>
      <JourneyForm type="long" />
    </div>
  );
}
