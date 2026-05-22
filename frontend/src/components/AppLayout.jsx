import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";

const roleLabel = {
  ATENDENTE: "Atendente",
  TECNICA: "Equipe Técnica",
  CIS: "Psicologia (CIS)",
  NPJ: "Jurídico (NPJ)",
  ADMIN: "Administrador",
};

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const canSeeQueues = ["TECNICA", "CIS", "NPJ", "ADMIN"].includes(user?.role);
  const canSeeRecords = ["TECNICA", "CIS", "NPJ", "ADMIN"].includes(user?.role);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          🌸 Sala Lilás
          <span>{roleLabel[user?.role]}</span>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""}>
            📋 Dashboard
          </NavLink>
          {canSeeQueues && (
            <NavLink to="/filas" className={({ isActive }) => isActive ? "active" : ""}>
              📥 Filas de Atendimento
            </NavLink>
          )}
          {canSeeRecords && (
            <NavLink to="/prontuarios" className={({ isActive }) => isActive ? "active" : ""}>
              🗂️ Prontuários
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/relatorios" className={({ isActive }) => isActive ? "active" : ""}>
                📊 Relatórios
              </NavLink>
              <NavLink to="/usuarios" className={({ isActive }) => isActive ? "active" : ""}>
                👥 Usuários
              </NavLink>
            </>
          )}
        </nav>
        <div className="sidebar-footer">
          <div>{user?.name}</div>
          <button
            onClick={handleLogout}
            style={{ marginTop: 8, background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 12, padding: 0 }}
          >
            Sair →
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
