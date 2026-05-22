import React from "react";

const statusLabel = {
  agendado: "Agendado",
  triagem: "Triagem (Atendente)",
  tecnica: "Equipe Técnica",
  psicologia: "Psicologia (CIS)",
  juridica: "Jurídico (NPJ)",
  finalizado: "Finalizado",
};

export default function PatientTimeline({ patient }) {
  if (!patient) return null;

  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>{patient.name}</h3>
      {patient.appointments?.map((appt) => (
        <div key={appt.id} className="card" style={{ marginBottom: 14 }}>
          <div className="flex-between mb-4">
            <strong>
              {new Date(appt.scheduledDate).toLocaleDateString("pt-BR")} às {appt.scheduledTime}
            </strong>
            <span className={`badge badge-${appt.status}`}>{statusLabel[appt.status]}</span>
          </div>

          {appt.anamneseInicial && (
            <div style={{ marginBottom: 10 }}>
              <div className="section-divider">Anamnese Inicial</div>
              <div className="grid-2 text-sm">
                <span><b>Tipo:</b> {appt.anamneseInicial.attendanceType}</span>
                <span><b>1º atend.:</b> {appt.anamneseInicial.firstAttendance ? "Sim" : "Não"}</span>
                <span><b>Gênero:</b> {appt.anamneseInicial.gender || "—"}</span>
                <span><b>Raça/Cor:</b> {appt.anamneseInicial.raceColor || "—"}</span>
              </div>
              {appt.anamneseInicial.violenceTypes?.length > 0 && (
                <div style={{ marginTop: 6 }} className="text-sm">
                  <b>Tipos de violência:</b> {appt.anamneseInicial.violenceTypes.join(", ")}
                </div>
              )}
            </div>
          )}

          {appt.prontuario && (
            <div style={{ marginBottom: 10 }}>
              <div className="section-divider">Prontuário</div>
              <p className="text-sm" style={{ whiteSpace: "pre-wrap" }}>{appt.prontuario.content}</p>
            </div>
          )}

          {appt.obsJuridicas?.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div className="section-divider">Observações Jurídicas</div>
              {appt.obsJuridicas.map((obs) => (
                <p key={obs.id} className="text-sm" style={{ whiteSpace: "pre-wrap", marginBottom: 6 }}>{obs.content}</p>
              ))}
            </div>
          )}

          <div className="section-divider">Histórico de Status</div>
          <div className="timeline">
            {appt.statusHistory?.map((h) => (
              <div key={h.id} className="timeline-item">
                <div className="timeline-date">
                  {new Date(h.createdAt).toLocaleString("pt-BR")}
                </div>
                <div className="text-sm">
                  {h.fromStatus
                    ? <>{statusLabel[h.fromStatus]} → <b>{statusLabel[h.toStatus]}</b></>
                    : <b>{statusLabel[h.toStatus]}</b>
                  }
                  {h.notes && <span className="text-muted"> — {h.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
