import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext.jsx";

import Landing from "./pages/Landing.jsx";
import PublicScheduling from "./pages/PublicScheduling.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Queues from "./pages/Queues.jsx";
import Records from "./pages/Records.jsx";
import Reports from "./pages/Reports.jsx";
import Users from "./pages/Users.jsx";
import AppLayout from "./components/AppLayout.jsx";
import ComplianceModal from "./components/ComplianceModal.jsx";

function PrivateRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", justifyContent: "center", padding: 60 }}><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return (
    <>
      {!user.complianceAccepted && <ComplianceModal />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/agendar" element={<PublicScheduling />} />
          <Route path="/login" element={<Login />} />

          <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/filas" element={
              <PrivateRoute roles={["TECNICA","CIS","NPJ","ADMIN"]}>
                <Queues />
              </PrivateRoute>
            } />
            <Route path="/prontuarios" element={
              <PrivateRoute roles={["TECNICA","CIS","NPJ","ADMIN"]}>
                <Records />
              </PrivateRoute>
            } />
            <Route path="/relatorios" element={
              <PrivateRoute roles={["ADMIN"]}>
                <Reports />
              </PrivateRoute>
            } />
            <Route path="/usuarios" element={
              <PrivateRoute roles={["ADMIN"]}>
                <Users />
              </PrivateRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
