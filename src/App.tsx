import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import Gate from "./components/Gate";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import PasswordManager from "./pages/PasswordManager";
import Authenticator from "./pages/Authenticator";
import Subscriptions from "./pages/Subscriptions";
import Settings from "./pages/Settings";
import "./App.css";

export default function App() {
  const { user, loading, supabaseReady } = useAuth();

  if (!supabaseReady || loading || !user) {
    return <Gate />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/vault" element={<PasswordManager />} />
        <Route path="/authenticator" element={<Authenticator />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
