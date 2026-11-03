import { Link } from "react-router-dom";
import {
  MapPin, Route as RouteIcon, ShieldCheck, Search, Users, Leaf, IndianRupee,
  ArrowRight, BadgeCheck, LocateFixed, MessagesSquare, Sparkles, CheckCircle2,
  Compass, Heart, Zap,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { RouteLine } from "@/components/RouteLine";
import { MatchScore } from "@/components/MatchScore";
import { useAuth } from "@/lib/auth";

function Header() {
  const { user } = useAuth();
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="container-app flex items-center justify-between py-6">
        <Logo tone="dark" />
        <nav className="flex items-center gap-3">
          {user ? (
            <Link to="/app" className="btn-primary btn-sm">
              Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost btn-sm text-white/80 hover:text-white hover:bg-white/10">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary btn-sm">
                Get started
              </Link>
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
    <div className="min-h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ocean-950 pt-32 pb-20 lg:pt-44 lg:pb-32">
        {/* Background Decorative Gradients */}
        <div className="pointer-events-none absolute -top-40 right-0 h-[600px] w-[600px] rounded-full bg-teal-dark/20 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 left-0 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-coral-warm/10 blur-[130px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, #fff 1px, transparent 0)", backgroundSize: "32px 32px" }} />

        <div className="container-app relative grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 backdrop-blur-md border border-white/10 text-xs font-semibold text-teal-light shadow-sm">
              <Sparkles size={14} className="text-amber-400" />
              <span>Verified Community · Safety-First Matching</span>
            </div>

            <h1 className="mt-6 font-display font-800 leading-[1.08] tracking-tight text-4xl sm:text-5xl lg:text-[3.8rem]">
              Travel together.<br />
              Spend less.<br />
              <span className="bg-gradient-to-r from-teal-light via-teal to-coral-warm bg-clip-text text-transparent">
                Enjoy every journey.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-slate-300 leading-relaxed">
              Find verified travel partners going your way, split costs transparently, and turn empty seats into safe, comfortable shared rides — from daily commutes to road trips.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/register" className="btn-primary btn-lg">
                Find a travel partner <Search size={18} />
              </Link>
              <Link to="/register" className="btn bg-white/10 btn-lg text-white hover:bg-white/15 backdrop-blur-md border border-white/10">
                Create a journey
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs sm:text-sm text-slate-400 font-medium">
              <span className="inline-flex items-center gap-2"><BadgeCheck size={18} className="text-emerald-400" /> Identity Verified</span>
              <span className="inline-flex items-center gap-2"><ShieldCheck size={18} className="text-emerald-400" /> Safe Checkpoints</span>
              <span className="inline-flex items-center gap-2"><Users size={18} className="text-emerald-400" /> Smart Route Matching</span>
            </div>
          </div>

          {/* Hero Widget Preview */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-3xl bg-white/95 p-6 text-ocean-900 shadow-lift backdrop-blur-xl border border-white/40">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="eyebrow">Top Match Candidate</span>
                <MatchScore score={92} size={64} />
              </div>

              <div className="mt-4">
                <RouteLine from="Tagore Garden" to="Connaught Place" checkpoint="Tilak Nagar Metro" animate />
              </div>

              <div className="mt-5 space-y-2 text-xs font-semibold text-slate-600">
                {["91% route overlap match", "Departs within 10 minutes", "Same destination area", "Both identity-verified", "Rated 4.8★ traveller"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span>{t}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl bg-teal-wash/60 px-4 py-3 border border-teal/15">
                <span className="text-xs uppercase font-bold tracking-wider text-teal-dark">Est. shared fare</span>
                <span className="font-mono font-800 text-teal-dark text-base">₹58 / person</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two journey modes section */}
      <section className="bg-slate-900 py-20 border-t border-slate-800">
        <div className="container-app">
          <div className="mb-12 text-center max-w-xl mx-auto">
            <div className="eyebrow text-teal-light mb-2">Designed For Everyday & Intercity</div>
            <h2 className="section-title text-3xl sm:text-4xl text-white">How do you travel today?</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SectionCard tone="teal" Icon={MapPin} title="Local Travel & Commute"
              tag="Daily journeys · ~20–30 km"
              body="Home to college, office or metro stations. We match overlapping routes and suggest safe public checkpoints so exact home addresses stay private."
              points={["Route-overlap algorithm", "Safe public meeting points", "Daily recurring schedule options"]} />
            <SectionCard tone="coral" Icon={RouteIcon} title="Long-Distance Trips"
              tag="Intercity · Solo & group trips"
              body="City to city routes like Delhi to Jaipur, Agra or hometowns. Find companions with compatible timing, seat availability, and budget."
              points={["Seat & budget compatibility", "Solo, couple or group rides", "One-way & multi-day flexibility"]} />
          </div>
        </div>
      </section>

      {/* How it works 4 steps */}
      <section className="bg-ocean-950 py-20 border-t border-slate-800 relative">
        <div className="container-app">
          <div className="mb-12 text-center max-w-xl mx-auto">
            <div className="eyebrow text-teal-light mb-2">Simple & Trustworthy</div>
            <h2 className="section-title text-3xl sm:text-4xl text-white">Four steps to a shared ride</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="rounded-2xl bg-white/5 p-6 border border-white/10 backdrop-blur-sm hover:border-teal/40 transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-teal-dark font-mono font-800 text-sm text-white shadow-sm">
                    0{s.n}
                  </span>
                  <s.Icon size={22} className="text-teal-light" />
                </div>
                <h3 className="font-display font-700 text-lg text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="bg-slate-900 py-20 border-t border-slate-800">
        <div className="container-app">
          <div className="grid gap-6 sm:grid-cols-3">
            <Impact Icon={IndianRupee} value="Up to 60%" label="Cheaper travel costs per ride" />
            <Impact Icon={Leaf} value="Lower Carbon" label="Fewer solo cars on the roads" />
            <Impact Icon={ShieldCheck} value="Verified" label="Phone, identity & org checks" />
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-xs sm:text-sm text-slate-400 leading-relaxed">
            TravelMate is not a commercial taxi service. It connects verified individuals travelling along overlapping routes to split shared travel expenses fairly. Verification is a trust layer designed to keep community trips safe.
          </p>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="container-app pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-dark via-teal to-coral-warm px-8 py-16 text-center text-white shadow-glow">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-display font-800 text-3xl sm:text-4xl tracking-tight">Your next trip is better shared</h2>
            <p className="mt-3 text-lg text-white/90">Join thousands of verified commuters and travel partners today.</p>
            <Link to="/register" className="btn-lg btn bg-white text-ocean-900 hover:bg-slate-100 mt-8 shadow-lift">
              Create your account <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-ocean-950 py-10">
        <div className="container-app flex flex-col items-center justify-between gap-4 text-sm text-slate-400 sm:flex-row">
          <Logo tone="dark" />
          <span>© TravelMate Platform · Verified Shared Mobility</span>
        </div>
      </footer>
    </div>
  );
}

function SectionCard({ Icon, title, tag, body, points, tone }:
  { Icon: typeof MapPin; title: string; tag: string; body: string; points: string[]; tone: "teal" | "coral" }) {
  const iconBg = tone === "teal" ? "bg-teal-wash text-teal-dark" : "bg-coral-wash text-coral-warm";
  return (
    <div className="rounded-3xl bg-white/5 p-8 border border-white/10 hover:border-white/20 transition-all duration-200">
      <span className={`grid h-12 w-12 place-items-center rounded-2xl ${iconBg} shadow-sm`}>
        <Icon size={24} />
      </span>
      <div className="mt-5 font-display font-700 text-2xl text-white">{title}</div>
      <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-1">{tag}</div>
      <p className="mt-3 text-sm text-slate-300 leading-relaxed">{body}</p>
      <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
        {points.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm text-slate-300">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Impact({ Icon, value, label }: { Icon: typeof Leaf; value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-8 text-center border border-white/10 backdrop-blur-sm">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-teal-wash/20 text-teal-light">
        <Icon size={24} />
      </div>
      <div className="font-display font-800 text-3xl text-white">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{label}</div>
    </div>
  );
}
