import { Link } from "react-router-dom";
import { Compass, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-6 text-center">
      <div>
        <div className="mb-6 flex justify-center"><Logo /></div>
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-teal-wash text-teal"><Compass size={30} /></div>
        <h1 className="font-display font-800 text-5xl text-ink">404</h1>
        <p className="mt-2 text-ink-muted">This route doesn't overlap with anything we know.</p>
        <Link to="/" className="btn-primary mt-6 inline-flex"><ArrowLeft size={16} /> Back home</Link>
      </div>
    </div>
  );
}
