import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Loading } from "./ui";
import type { ReactNode } from "react";

export function ProtectedRoute({ children, admin }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="grid min-h-screen place-items-center"><Loading label="Loading your account…" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/app" replace />;
  return <>{children}</>;
}
