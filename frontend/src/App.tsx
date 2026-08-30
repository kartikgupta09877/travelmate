import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import CreateLocal from "@/pages/CreateLocal";
import CreateLong from "@/pages/CreateLong";
import FindPartners from "@/pages/FindPartners";
import AssistantPage from "@/pages/AssistantPage";
import MyTrips from "@/pages/MyTrips";
import TripDetail from "@/pages/TripDetail";
import Matches from "@/pages/Matches";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Verify from "@/pages/Verify";
import SafetyCenter from "@/pages/SafetyCenter";
import Settings from "@/pages/Settings";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="local" element={<CreateLocal />} />
        <Route path="long" element={<CreateLong />} />
        <Route path="find" element={<FindPartners />} />
        <Route path="assistant" element={<AssistantPage />} />
        <Route path="trips" element={<MyTrips />} />
        <Route path="trips/:id" element={<TripDetail />} />
        <Route path="matches" element={<Matches />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:cid" element={<Messages />} />
        <Route path="profile" element={<Profile />} />
        <Route path="profile/:id" element={<Profile />} />
        <Route path="verify" element={<Verify />} />
        <Route path="safety" element={<SafetyCenter />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin" element={<ProtectedRoute admin><AdminDashboard /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
