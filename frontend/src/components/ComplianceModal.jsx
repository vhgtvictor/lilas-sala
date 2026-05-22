import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function ComplianceModal() {
  const { acceptCompliance } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    await acceptCompliance();
    setLoading(false);
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 200 }}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <h2>🔒 Termo de Responsabilidade e Sigilo</h2>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            Em conformidade com a <strong>Lei Geral de Proteção de Dados (LGPD — Lei 13.709/2018)</strong>,
            ao acessar este sistema, você declara estar ciente de que:
          </p>
          <ul style={{ paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, lineHeight: 1.7 }}>
            <li>O acesso aos dados pessoais e sensíveis das usuárias é <strong>restrito à finalidade técnica</strong> de atendimento.</li>
            <li>É vedado o compartilhamento, cópia ou divulgação de qualquer informação contida neste sistema.</li>
            <li>O descumprimento pode acarretar responsabilização civil, administrativa e criminal.</li>
            <li>Todas as ações realizadas neste sistema são <strong>registradas e auditáveis</strong>.</li>
          </ul>
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--gray-400)" }}>
            Ao clicar em "Li e Aceito", você confirma sua ciência e concordância com os termos acima.
            Esta ação será registrada com data e hora.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-primary" onClick={handle} disabled={loading}>
            {loading ? <span className="spinner" /> : "Li e Aceito"}
          </button>
        </div>
      </div>
    </div>
  );
}
