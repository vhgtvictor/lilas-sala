import React, { useState, useEffect } from "react";
import api from "../services/api.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const VIOLENCE_TYPES = [
  "Violência física", "Violência psicológica/emocional", "Violência sexual",
  "Violência patrimonial", "Violência moral", "Violência institucional",
  "Prefiro não informar nesse momento",
];

const ORIENTATIONS = [
  "Direitos legais e medidas protetivas", "Registro de ocorrência",
  "Acesso à Defensoria Pública", "Rede de saúde", "Apoio psicológico",
  "Assistência social (benefícios, CRAS/CREAS)",
];

const REFERRALS = [
  "Delegacia Especializada (DEAM)", "Defensoria Pública", "Ministério Público",
  "Rede de saúde (UBS, hospital, CAPS)", "CRAS / CREAS",
  "Abrigamento institucional", "Serviços psicológicos",
];

const REFERRAL_OBJECTIVES = [
  "Acolhimento psicológico", "Acompanhamento psicoterapêutico",
  "Orientação jurídica", "Ajuizamento de medidas protetivas",
];

function CheckGroup({ options, selected, onChange }) {
  return (
    <div className="checkbox-group">
      {options.map((opt) => (
        <label key={opt}>
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={(e) => {
              onChange(e.target.checked
                ? [...selected, opt]
                : selected.filter((x) => x !== opt));
            }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

export default function AnamneseModal({ appointment, onClose, onSaved }) {
  const { user } = useAuth();
  const isAtendente = user?.role === "ATENDENTE";

  const [inicial, setInicial] = useState({
    attendanceType: "Presencial", firstAttendance: false,
    territory: "", raceColor: "", gender: "", violenceTypes: [],
  });
  const [tecnica, setTecnica] = useState({
    imminentRisk: null, aggressorLivesWithVictim: null,
    previousViolenceHistory: null, supportNetwork: null, childrenInvolved: null,
    observations: "", orientations: [], referrals: [], referralDetails: "",
    caseSummary: "", referralObjective: [],
    followupPlan: [], followupDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("inicial");
  const [transferTo, setTransferTo] = useState("");

  useEffect(() => {
    api.get(`/anamnese/${appointment.id}`).then((r) => {
      if (r.data.anamneseInicial) setInicial((p) => ({ ...p, ...r.data.anamneseInicial }));
      if (r.data.anamnesisTecnica) setTecnica((p) => ({ ...p, ...r.data.anamnesisTecnica }));
    }).catch(() => {});
  }, [appointment.id]);

  async function saveInicial() {
    setLoading(true);
    await api.post(`/anamnese/${appointment.id}/inicial`, inicial);
    if (isAtendente) {
      await api.post(`/appointments/${appointment.id}/checkin`, { action: "atender" });
      onSaved();
    } else {
      setStep("tecnica");
    }
    setLoading(false);
  }

  async function saveTecnica() {
    setLoading(true);
    await api.post(`/anamnese/${appointment.id}/tecnica`, tecnica);
    if (transferTo) {
      await api.post(`/appointments/${appointment.id}/transfer`, { to: transferTo });
    }
    onSaved();
    setLoading(false);
  }

  const radioStyle = (active) => ({
    padding: "5px 14px", borderRadius: 6, border: "1px solid",
    borderColor: active ? "var(--lilas)" : "var(--gray-200)",
    background: active ? "var(--lilas-light)" : "white",
    color: active ? "var(--lilas-dark)" : "var(--gray-600)",
    cursor: "pointer", fontSize: 13, fontWeight: active ? 600 : 400,
  });

  function BoolField({ label, field }) {
    return (
      <div className="form-group">
        <label>{label}</label>
        <div className="flex gap-2">
          <button type="button" style={radioStyle(tecnica[field] === true)}
            onClick={() => setTecnica((t) => ({ ...t, [field]: true }))}>Sim</button>
          <button type="button" style={radioStyle(tecnica[field] === false)}
            onClick={() => setTecnica((t) => ({ ...t, [field]: false }))}>Não</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>{isAtendente ? "Anamnese Inicial" : step === "inicial" ? "Anamnese Inicial" : "Anamnese Técnica"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p className="text-sm text-muted mb-4">
            Paciente: <strong>{appointment.patient?.name}</strong> —{" "}
            {appointment.scheduledDate && new Date(appointment.scheduledDate).toLocaleDateString("pt-BR")} às {appointment.scheduledTime}
          </p>

          {(step === "inicial" || isAtendente) && (
            <>
              <div className="section-divider">Dados do Atendimento</div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Tipo de atendimento</label>
                  <select className="form-control" value={inicial.attendanceType}
                    onChange={(e) => setInicial((f) => ({ ...f, attendanceType: e.target.value }))}>
                    <option>Presencial</option>
                    <option>Online</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Primeiro atendimento?</label>
                  <div className="flex gap-2">
                    <button type="button" style={radioStyle(inicial.firstAttendance === true)}
                      onClick={() => setInicial((f) => ({ ...f, firstAttendance: true }))}>Sim</button>
                    <button type="button" style={radioStyle(inicial.firstAttendance === false)}
                      onClick={() => setInicial((f) => ({ ...f, firstAttendance: false }))}>Não</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Território / Localidade</label>
                <input className="form-control" value={inicial.territory}
                  onChange={(e) => setInicial((f) => ({ ...f, territory: e.target.value }))} />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Cor / Raça</label>
                  <select className="form-control" value={inicial.raceColor}
                    onChange={(e) => setInicial((f) => ({ ...f, raceColor: e.target.value }))}>
                    <option value="">Selecione</option>
                    {["Branca","Preta","Parda","Amarela","Indígena","Não informado / Prefere não declarar"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sexo / Gênero</label>
                  <select className="form-control" value={inicial.gender}
                    onChange={(e) => setInicial((f) => ({ ...f, gender: e.target.value }))}>
                    <option value="">Selecione</option>
                    {["Homem cisgênero","Mulher cisgênero","Homem trans","Mulher trans","Pessoa não binária","Prefere não declarar"].map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Tipos de violência</label>
                <CheckGroup options={VIOLENCE_TYPES} selected={inicial.violenceTypes}
                  onChange={(v) => setInicial((f) => ({ ...f, violenceTypes: v }))} />
              </div>
            </>
          )}

          {step === "tecnica" && !isAtendente && (
            <>
              <div className="section-divider">Avaliação da Situação</div>
              <BoolField label="Há risco iminente?" field="imminentRisk" />
              <BoolField label="Agressor convive com a vítima?" field="aggressorLivesWithVictim" />
              <BoolField label="Há histórico de violência anterior?" field="previousViolenceHistory" />
              <BoolField label="Possui rede de apoio?" field="supportNetwork" />
              <BoolField label="Há filhos/dependentes envolvidos?" field="childrenInvolved" />

              <div className="form-group">
                <label>Observações relevantes</label>
                <textarea className="form-control" rows={3} value={tecnica.observations}
                  onChange={(e) => setTecnica((t) => ({ ...t, observations: e.target.value }))} />
              </div>

              <div className="section-divider">Orientações Realizadas</div>
              <CheckGroup options={ORIENTATIONS} selected={tecnica.orientations}
                onChange={(v) => setTecnica((t) => ({ ...t, orientations: v }))} />

              <div className="section-divider mt-4">Encaminhamentos Realizados</div>
              <CheckGroup options={REFERRALS} selected={tecnica.referrals}
                onChange={(v) => setTecnica((t) => ({ ...t, referrals: v }))} />

              <div className="form-group mt-4">
                <label>Detalhamento dos encaminhamentos</label>
                <textarea className="form-control" rows={2} value={tecnica.referralDetails}
                  onChange={(e) => setTecnica((t) => ({ ...t, referralDetails: e.target.value }))} />
              </div>

              <div className="section-divider">Síntese do Caso</div>
              <div className="form-group">
                <textarea className="form-control" rows={4} value={tecnica.caseSummary}
                  onChange={(e) => setTecnica((t) => ({ ...t, caseSummary: e.target.value }))}
                  placeholder="Descreva brevemente a situação preservando a dignidade da usuária..." />
              </div>

              <div className="section-divider">Objetivo do Encaminhamento</div>
              <CheckGroup options={REFERRAL_OBJECTIVES} selected={tecnica.referralObjective}
                onChange={(v) => setTecnica((t) => ({ ...t, referralObjective: v }))} />

              <div className="section-divider mt-4">Encaminhar para</div>
              <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                {["CIS","NPJ","OUTROS"].map((dest) => (
                  <button key={dest} type="button"
                    style={{
                      ...radioStyle(transferTo === dest),
                      padding: "8px 20px",
                    }}
                    onClick={() => setTransferTo(transferTo === dest ? "" : dest)}>
                    {dest === "CIS" ? "Psicologia (CIS)" : dest === "NPJ" ? "Jurídico (NPJ)" : "Outros / Finalizar"}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
          {step === "inicial" && (
            <button className="btn btn-primary" onClick={saveInicial} disabled={loading}>
              {loading ? <span className="spinner" /> : isAtendente ? "Salvar e Encaminhar" : "Próximo →"}
            </button>
          )}
          {step === "tecnica" && !isAtendente && (
            <button className="btn btn-primary" onClick={saveTecnica} disabled={loading}>
              {loading ? <span className="spinner" /> : "Salvar Anamnese"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
