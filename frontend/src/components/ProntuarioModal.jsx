import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ProntuarioModal({ appointment, onClose, onSaved }) {
  const { user } = useAuth();
  const isNPJ = user?.role === "NPJ";
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get(`/anamnese/${appointment.id}`).then((r) => {
      if (!isNPJ && r.data.prontuario) setContent(r.data.prontuario.content || "");
    }).catch(() => {});
  }, [appointment.id, isNPJ]);

  async function handleSave() {
    setLoading(true);
    const endpoint = isNPJ
      ? `/prontuarios/${appointment.id}/juridica`
      : `/prontuarios/${appointment.id}`;
    await api.post(endpoint, { content });
    onSaved();
    setLoading(false);
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isNPJ ? "Observação Jurídica" : "Prontuário"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="text-sm text-muted mb-4">
            Paciente: <strong>{appointment.patient?.name}</strong>
          </p>
          <div className="form-group">
            <label>{isNPJ ? "Registro da observação jurídica" : "Registro do prontuário"}</label>
            <textarea
              className="form-control"
              rows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isNPJ
                ? "Registre as orientações e observações jurídicas..."
                : "Registre o atendimento, evolução e observações clínicas..."}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading || !content.trim()}>
            {loading ? <span className="spinner" /> : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
