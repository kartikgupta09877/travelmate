import { Link } from "react-router-dom";
import {
  MapPin, Route as RouteIcon, ShieldCheck, Search, Users, Leaf, IndianRupee,
  ArrowRight, BadgeCheck, LocateFixed, MessagesSquare,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { RouteLine } from "@/components/RouteLine";
import { MatchScore } from "@/components/MatchScore";
import { useAuth } from "@/lib/auth";

function Header() {
  const { user } = useAuth();
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="container-app flex items-center justify-between py-5">
        <Logo />
        <nav className="flex items-center gap-2">
          {user ? (
            <Link to="/app" className="btn-primary btn-sm">Go to dashboard <ArrowRight size={14} /></Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm">Sign in</Link>
              <Link to="/register" className="btn-primary btn-sm">Get started</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const STEPS = [
  { n: 1, title: "Tell us your route", body: "Set your start area, destination and time — for a daily commute or an intercity trip.", Icon: LocateFixed },
  { n: 2, title: "See ranked matches", body: "We score partners on route overlap, timing, destination, checkpoint distance and reliability.", Icon: Search },
  { n: 3, title: "Meet at a safe checkpoint", body: "Agree on a public meeting point. Exact locations are shared only after you both accept.", Icon: ShieldCheck },
  { n: 4, title: "Travel & split fairly", body: "Chat, share your trip with a trusted contact, travel together and split the cost per person.", Icon: MessagesSquare },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <div className="container-app relative grid gap-12 pb-16 pt-32 lg:grid-cols-2 lg:items-center lg:pb-24 lg:pt-40">
          <div>
            <span className="chip bg-white/10 text-teal-light">Verified community · Safety-focused</span>
            <h1 className="mt-5 font-display font-800 leading-[1.05] tracking-tight text-4xl sm:text-5xl lg:text-[3.4rem]">
              Travel together.<br />Spend less.<br /><span className="text-teal-light">Enjoy the journey.</span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-white/70">
              Find verified travel partners going your way, share travel costs, and make every journey easier — from the daily commute to the weekend road trip.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/register" className="btn-primary">Find a travel partner <Search size={16} /></Link>
              <Link to="/register" className="btn bg-white/10 text-white hover:bg-white/15">Create a journey</Link>
            </div>
            <div className="mt-7 flex items-center gap-5 text-sm text-white/60">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={16} className="text-verified" /> Identity checks</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-verified" /> Safe checkpoints</span>
              <span className="inline-flex items-center gap-1.5"><Users size={16} className="text-verified" /> Trust-based matching</span>
            </div>
          </div>

          {/* Hero card: a live-looking match */}
          <div className="relative">
            <div className="mx-auto max-w-sm rounded-2xl bg-white p-5 text-ink shadow-lift">
              <div className="flex items-center justify-between">
                <span className="eyebrow">Local match</span>
                <MatchScore score={92} size={64} />
              </div>
              <div className="mt-3">
                <RouteLine from="Tagore Garden" to="Connaught Place" checkpoint="Tilak Nagar Metro" animate />
              </div>
              <div className="mt-4 space-y-1.5 text-sm">
                {["91% route overlap", "Departs within 10 minutes", "Same destination area", "Both identity-verified", "Rated 4.8★ traveller"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-ink-muted">
                    <BadgeCheck size={15} className="text-verified" /> {t}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between rounded-xl bg-canvas px-4 py-3">
                <span className="text-xs uppercase tracking-wide text-ink-muted">Est. share</span>
                <span className="font-mono font-700 text-teal">₹58 / person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two sections */}
      <section className="container-app py-16 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <SectionCard tone="teal" Icon={MapPin} title="Local travel"
            tag="Daily journeys · ~20–30 km"
            body="Home to college, office or the metro. We match overlapping routes and suggest a safe public checkpoint so you never share your exact address."
            points={["Route-overlap matching", "Safe common checkpoints", "Recurring daily/weekly trips"]} />
          <SectionCard tone="signal" Icon={RouteIcon} title="Long trips"
            tag="Intercity · solo & group"
            body="Delhi to Jaipur, Agra or your hometown. Find companions with a similar route, timing and budget — or open seats for a group."
            points={["Budget & seat matching", "Solo, couple or group", "One-way, round or multi-day"]} />
        </div>
      </section>

      {/* How it works — a real 4-step sequence */}
      <section className="border-y border-line bg-canvas py-16 lg:py-20">
        <div className="container-app">
          <div className="mb-10 text-center">
            <div className="eyebrow">How it works</div>
            <h2 className="section-title mt-1 text-3xl">Four steps to a shared ride</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink font-mono font-700 text-sm text-white">{s.n}</span>
                  <s.Icon size={20} className="text-teal" />
                </div>
                <h3 className="mt-3 font-display font-700 text-ink">{s.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="container-app py-16 lg:py-20">
        <div className="grid gap-5 sm:grid-cols-3">
          <Impact Icon={IndianRupee} value="Up to 60%" label="cheaper than travelling alone" />
          <Impact Icon={Leaf} value="Fewer cars" label="means less CO₂ per shared trip" />
          <Impact Icon={ShieldCheck} value="Verified" label="phone, identity, college & vehicle" />
        </div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink-muted">
          TravelMate is not a taxi service. It connects people already travelling in the same direction so they can share the ride and split costs fairly. Verification is a trust and safety layer — it reduces risk but does not guarantee it.
        </p>
      </section>

      {/* CTA */}
      <section className="container-app pb-20">
        <div className="overflow-hidden rounded-2xl bg-teal px-6 py-12 text-center text-white sm:py-16">
          <h2 className="font-display font-800 text-3xl">Your next journey is better shared</h2>
          <p className="mx-auto mt-2 max-w-md text-white/80">Join a verified community of commuters and travellers going your way.</p>
          <Link to="/register" className="btn mt-6 bg-white text-teal-dark hover:bg-white/90">Create your free account <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="border-t border-line py-8">
        <div className="container-app flex flex-col items-center justify-between gap-3 text-sm text-ink-muted sm:flex-row">
          <Logo />
          <span>Built as a product demo · realistic sample data</span>
        </div>
      </footer>
    </div>
  );
}

function SectionCard({ Icon, title, tag, body, points, tone }:
  { Icon: typeof MapPin; title: string; tag: string; body: string; points: string[]; tone: "teal" | "signal" }) {
  const wash = tone === "teal" ? "bg-teal-wash text-teal-dark" : "bg-signal-wash text-signal";
  return (
    <div className="card card-hover p-6">
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${wash}`}><Icon size={22} /></span>
      <div className="mt-4 flex items-center gap-2">
        <h3 className="font-display font-700 text-xl text-ink">{title}</h3>
      </div>
      <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{tag}</div>
      <p className="mt-2 text-sm text-ink-muted">{body}</p>
      <ul className="mt-4 space-y-1.5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2 text-sm text-ink-soft"><BadgeCheck size={15} className="text-verified" /> {p}</li>
        ))}
      </ul>
    </div>
  );
}

function Impact({ Icon, value, label }: { Icon: typeof Leaf; value: string; label: string }) {
  return (
    <div className="card p-6 text-center">
      <Icon size={24} className="mx-auto text-teal" />
      <div className="mt-2 font-display font-800 text-2xl text-ink">{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
    </div>
  );
}
