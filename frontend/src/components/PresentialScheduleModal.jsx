import React, { useState, useEffect } from "react";
import api from "../services/api.js";

function validateCPF(cpf) {
  const c = cpf.replace(/\D/g, "");
  if (c.length !== 11 || /^(\d)\1+$/.test(c)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i]) * (10 - i);
  let r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  if (r !== parseInt(c[9])) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i]) * (11 - i);
  r = (sum * 10) % 11;
  if (r === 10 || r === 11) r = 0;
  return r === parseInt(c[10]);
}

function formatCPF(v) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export default function PresentialScheduleModal({ onClose, onSaved }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    name: "", email: "", cpf: "", scheduledDate: today, scheduledTime: "",
  });
  const [slots, setSlots] = useState([]);
  const [cpfError, setCpfError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (form.scheduledDate) {
      setSlotsLoading(true);
      api.get(`/appointments/slots?date=${form.scheduledDate}`)
        .then((r) => setSlots(r.data.slots))
        .catch(() => setSlots([]))
        .finally(() => setSlotsLoading(false));
    }
  }, [form.scheduledDate]);

  function handleCPF(v) {
    const formatted = formatCPF(v);
    setForm((f) => ({ ...f, cpf: formatted }));
    const raw = formatted.replace(/\D/g, "");
    if (raw.length === 11) {
      setCpfError(validateCPF(raw) ? "" : "CPF inválido.");
    } else {
      setCpfError("");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (cpfError) return;
    setError("");
    setLoading(true);
    try {
      await api.post("/appointments/public", {
        ...form,
        cpf: form.cpf.replace(/\D/g, ""),
      });
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao realizar agendamento.");
    } finally {
      setLoading(false);
    }
  }

  const isWeekend = (dateStr) => {
    if (!dateStr) return false;
    const day = new Date(dateStr).getUTCDay();
    return day === 0 || day === 6;
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>📅 Agendamento Presencial</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}

            <div className="section-divider">Dados da Paciente</div>

            <div className="form-group">
              <label>Nome completo *</label>
              <input
                className="form-control" required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Nome da paciente"
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>CPF *</label>
                <input
                  className={`form-control${cpfError ? " error" : ""}`} required
                  value={form.cpf}
                  onChange={(e) => handleCPF(e.target.value)}
                  placeholder="000.000.000-00"
                />
                {cpfError && (
                  <span style={{ color: "var(--rose)", fontSize: 12, marginTop: 3, display: "block" }}>
                    {cpfError}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>E-mail *</label>
                <input
                  className="form-control" type="email" required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="section-divider">Data e Horário</div>

            <div className="form-group">
              <label>Data do atendimento *</label>
              <input
                className="form-control" type="date" required
                value={form.scheduledDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, scheduledDate: e.target.value, scheduledTime: "" }))
                }
              />
              {isWeekend(form.scheduledDate) && (
                <span style={{ color: "var(--rose)", fontSize: 12, marginTop: 3, display: "block" }}>
                  Esta data é fim de semana. Selecione um dia útil.
                </span>
              )}
            </div>

            <div className="form-group">
              <label>Horário disponível *</label>
              {slotsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0" }}>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  <span className="text-muted text-sm">Buscando horários...</span>
                </div>
              ) : slots.length === 0 ? (
                <p className="text-muted text-sm" style={{ padding: "6px 0" }}>
                  Nenhum horário disponível para esta data.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {slots.map((s) => (
                    <button
                      key={s} type="button"
                      onClick={() => setForm((f) => ({ ...f, scheduledTime: s }))}
                      style={{
                        padding: "6px 14px", borderRadius: 6, border: "1px solid",
                        borderColor: form.scheduledTime === s ? "var(--lilas)" : "var(--gray-200)",
                        background: form.scheduledTime === s ? "var(--lilas-light)" : "white",
                        color: form.scheduledTime === s ? "var(--lilas-dark)" : "var(--gray-600)",
                        fontWeight: form.scheduledTime === s ? 600 : 400,
                        cursor: "pointer", fontSize: 13,
                        transition: "all .12s",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit" className="btn btn-primary"
              disabled={loading || !form.scheduledTime || !!cpfError || isWeekend(form.scheduledDate)}
            >
              {loading ? <span className="spinner" /> : "✓ Confirmar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
