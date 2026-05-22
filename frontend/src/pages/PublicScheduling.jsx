import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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

export default function PublicScheduling() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", cpf: "", scheduledDate: "", scheduledTime: "" });
  const [slots, setSlots] = useState([]);
  const [cpfError, setCpfError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form.scheduledDate) {
      api.get(`/appointments/slots?date=${form.scheduledDate}`)
        .then((r) => setSlots(r.data.slots))
        .catch(() => setSlots([]));
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
      navigate("/", { state: { agendado: true } });
    } catch (err) {
      setError(err.response?.data?.error || "Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <div className="public-page">
      <div className="public-box">
        <h1>🌸 Sala Lilás</h1>
        <p>Preencha o formulário abaixo para agendar seu atendimento. Nenhuma conta é necessária.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome completo *</label>
            <input className="form-control" required value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Seu nome" />
          </div>

          <div className="form-group">
            <label>E-mail *</label>
            <input className="form-control" type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="seu@email.com" />
          </div>

          <div className="form-group">
            <label>CPF *</label>
            <input className={`form-control${cpfError ? " error" : ""}`} required value={form.cpf}
              onChange={(e) => handleCPF(e.target.value)}
              placeholder="000.000.000-00" />
            {cpfError && <span style={{ color: "var(--rose)", fontSize: 12 }}>{cpfError}</span>}
          </div>

          <div className="form-group">
            <label>Data *</label>
            <input className="form-control" type="date" required value={form.scheduledDate}
              min={minDateStr}
              onChange={(e) => setForm((f) => ({ ...f, scheduledDate: e.target.value, scheduledTime: "" }))} />
          </div>

          {form.scheduledDate && (
            <div className="form-group">
              <label>Horário disponível *</label>
              {slots.length === 0 ? (
                <p className="text-muted text-sm">Nenhum horário disponível nesta data.</p>
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
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            className="btn btn-primary" type="submit"
            style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
            disabled={loading || !form.scheduledTime || !!cpfError}
          >
            {loading ? <span className="spinner" /> : "Agendar Atendimento"}
          </button>
        </form>
      </div>
    </div>
  );
}
