import React, { useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function closeMenu() {
    setSidebarOpen(false);
  }

  const canSeeQueues = ["TECNICA", "CIS", "NPJ", "ADMIN"].includes(user?.role);
  const canSeeRecords = ["TECNICA", "CIS", "NPJ", "ADMIN"].includes(user?.role);
  const isAdmin = user?.role === "ADMIN";

  return (
    <div className="app-layout">

      {/* Overlay para fechar menu no mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeMenu}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-logo">
          🌸 Sala Lilás
          <span>{roleLabel[user?.role]}</span>
        </div>
        <nav>
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
            📋 Dashboard
          </NavLink>
          {canSeeQueues && (
            <NavLink to="/filas" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              📥 Filas de Atendimento
            </NavLink>
          )}
          {canSeeRecords && (
            <NavLink to="/prontuarios" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
              🗂️ Prontuários
            </NavLink>
          )}
          {isAdmin && (
            <>
              <NavLink to="/relatorios" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
                📊 Relatórios
              </NavLink>
              <NavLink to="/usuarios" className={({ isActive }) => isActive ? "active" : ""} onClick={closeMenu}>
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

      {/* Conteúdo principal */}
      <main className="main-content">
        {/* Top bar mobile */}
        <div className="mobile-topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            ☰
          </button>
          <span style={{ fontWeight: 600, fontSize: 15, color: "var(--lilas-dark)" }}>🌸 Sala Lilás</span>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
