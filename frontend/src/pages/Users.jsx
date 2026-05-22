import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const ROLES = ["ATENDENTE", "TECNICA", "CIS", "NPJ", "ADMIN"];
const ROLE_LABEL = {
  ATENDENTE: "Atendente", TECNICA: "Equipe Técnica",
  CIS: "Psicologia (CIS)", NPJ: "Jurídico (NPJ)", ADMIN: "Administrador",
};

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "ATENDENTE" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function fetchUsers() {
    api.get("/users").then((r) => setUsers(r.data));
  }

  useEffect(() => { fetchUsers(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/users", form);
      setShowModal(false);
      setForm({ name: "", email: "", password: "", role: "ATENDENTE" });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao criar usuário.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(user) {
    await api.put(`/users/${user.id}`, { name: user.name, role: user.role, active: !user.active });
    fetchUsers();
  }

  async function confirmDelete() {
    setDeleteLoading(true);
    try {
      await api.delete(`/users/${pendingDelete.id}`);
      setPendingDelete(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Erro ao excluir usuário.");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>👥 Usuários</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Novo Usuário</button>
      </div>

      <div className="page-body">
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Compliance LGPD</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="text-muted">{u.email}</td>
                    <td>{ROLE_LABEL[u.role]}</td>
                    <td>
                      <span className={`badge ${u.active ? "badge-tecnica" : "badge-finalizado"}`}>
                        {u.active ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${u.complianceAccepted ? "badge-accepted" : "badge-pending"}`}
                        title={u.complianceAccepted && u.complianceAcceptedAt
                          ? `Aceito em: ${new Date(u.complianceAcceptedAt).toLocaleString("pt-BR")}`
                          : "Pendente"}
                        style={{ cursor: u.complianceAccepted ? "help" : "default" }}
                      >
                        {u.complianceAccepted ? "✓ Aceito" : "Pendente"}
                      </span>
                    </td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(u)}>
                        {u.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: "var(--rose)", color: "white", border: "none" }}
                        onClick={() => setPendingDelete(u)}
                        disabled={u.id === currentUser?.id}
                        title={u.id === currentUser?.id ? "Você não pode excluir sua própria conta" : "Excluir usuário"}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {pendingDelete && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h2>Excluir Usuário</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setPendingDelete(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Tem certeza que deseja excluir permanentemente o usuário <strong>{pendingDelete.name}</strong>?</p>
              <p style={{ color: "var(--rose)", fontSize: 13, marginTop: 8 }}>
                Esta ação é irreversível. Todos os dados associados a este usuário serão removidos.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setPendingDelete(null)}>Cancelar</button>
              <button
                className="btn"
                style={{ background: "var(--rose)", color: "white", border: "none" }}
                onClick={confirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? <span className="spinner" /> : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h2>Novo Usuário</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label>Nome</label>
                  <input className="form-control" required value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>E-mail</label>
                  <input className="form-control" type="email" required value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Senha inicial</label>
                  <input className="form-control" type="password" required minLength={6} value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Perfil</label>
                  <select className="form-control" value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? <span className="spinner" /> : "Criar Usuário"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
