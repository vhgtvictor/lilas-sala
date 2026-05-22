import prisma from "../lib/prisma.js";
import * as XLSX from "xlsx";

export async function getKPIs(req, res) {
  const { from, to } = req.query;
  const dateFilter =
    from && to
      ? { scheduledDate: { gte: new Date(from), lte: new Date(to) } }
      : {};

  const [total, byStatus, byViolence, dailyCount] = await Promise.all([
    prisma.appointment.count({ where: dateFilter }),

    prisma.appointment.groupBy({
      by: ["status"],
      where: dateFilter,
      _count: { status: true },
    }),

    prisma.anamneseInicial.findMany({
      where: dateFilter
        ? { appointment: { scheduledDate: dateFilter.scheduledDate } }
        : {},
      select: { violenceTypes: true },
    }),

    prisma.appointment.groupBy({
      by: ["scheduledDate"],
      where: dateFilter,
      _count: { id: true },
      orderBy: { scheduledDate: "asc" },
    }),
  ]);

  const violenceCounts = {};
  byViolence.forEach(({ violenceTypes }) => {
    (violenceTypes || []).forEach((type) => {
      violenceCounts[type] = (violenceCounts[type] || 0) + 1;
    });
  });

  res.json({
    total,
    byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
    byViolenceType: Object.entries(violenceCounts).map(([type, count]) => ({ type, count })),
    dailyCount: dailyCount.map((d) => ({
      date: d.scheduledDate,
      count: d._count.id,
    })),
  });
}

export async function exportExcel(req, res) {
  const { from, to } = req.query;
  const dateFilter =
    from && to
      ? { scheduledDate: { gte: new Date(from), lte: new Date(to) } }
      : {};

  const patients = await prisma.patient.findMany({
    include: {
      appointments: {
        where: Object.keys(dateFilter).length ? dateFilter : undefined,
        include: {
          anamneseInicial: true,
          anamnesisTecnica: true,
          prontuario: true,
          obsJuridicas: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { scheduledDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  });

  const fmt = (v) => (v !== null && v !== undefined && String(v).trim() !== "") ? String(v) : "";
  const bool = (v) => v === true ? "Sim" : v === false ? "Nao" : "";
  const dt = (v) => v ? new Date(v).toLocaleString("pt-BR") : "";
  const d = (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "";
  const list = (v) => Array.isArray(v) ? v.join("; ") : "";

  const statusLabels = {
    agendado: "Agendado", triagem: "Triagem",
    tecnica: "Equipe Tecnica", psicologia: "Psicologia (CIS)",
    juridica: "Juridico (NPJ)", finalizado: "Finalizado",
  };

  // ── Aba 1: Pacientes ───────────────────────────────────────────────────────
  const rowsPacientes = patients.map((p) => ({
    "ID": fmt(p.id),
    "Nome": fmt(p.name),
    "CPF": fmt(p.cpf),
    "E-mail": fmt(p.email),
    "Cadastrado em": dt(p.createdAt),
    "Total de atendimentos": p.appointments.length,
  }));

  // ── Aba 2: Atendimentos ────────────────────────────────────────────────────
  const rowsAtendimentos = [];
  for (const p of patients) {
    for (const a of p.appointments) {
      rowsAtendimentos.push({
        "ID Atendimento": fmt(a.id),
        "Paciente": fmt(p.name),
        "CPF": fmt(p.cpf),
        "Data": d(a.scheduledDate),
        "Horario": fmt(a.scheduledTime),
        "Status": statusLabels[a.status] || fmt(a.status),
        "Criado em": dt(a.createdAt),
        "Atualizado em": dt(a.updatedAt),
      });
    }
  }

  // ── Aba 3: Anamnese Inicial ────────────────────────────────────────────────
  const rowsAnamneseInicial = [];
  for (const p of patients) {
    for (const a of p.appointments) {
      const ai = a.anamneseInicial;
      if (!ai) continue;
      rowsAnamneseInicial.push({
        "ID Atendimento": fmt(a.id),
        "Paciente": fmt(p.name),
        "CPF": fmt(p.cpf),
        "Data atendimento": d(a.scheduledDate),
        "Tipo de atendimento": fmt(ai.attendanceType),
        "Primeiro atendimento": bool(ai.firstAttendance),
        "Territorio / Localidade": fmt(ai.territory),
        "Cor / Raca": fmt(ai.raceColor),
        "Sexo / Genero": fmt(ai.gender),
        "Tipos de violencia": list(ai.violenceTypes),
        "Registrado em": dt(ai.createdAt),
      });
    }
  }

  // ── Aba 4: Anamnese Tecnica ────────────────────────────────────────────────
  const rowsAnamnesisTecnica = [];
  for (const p of patients) {
    for (const a of p.appointments) {
      const at = a.anamnesisTecnica;
      if (!at) continue;
      rowsAnamnesisTecnica.push({
        "ID Atendimento": fmt(a.id),
        "Paciente": fmt(p.name),
        "CPF": fmt(p.cpf),
        "Data atendimento": d(a.scheduledDate),
        "Risco iminente": bool(at.imminentRisk),
        "Agressor convive com vitima": bool(at.aggressorLivesWithVictim),
        "Historico de violencia anterior": bool(at.previousViolenceHistory),
        "Possui rede de apoio": bool(at.supportNetwork),
        "Filhos/dependentes envolvidos": bool(at.childrenInvolved),
        "Observacoes relevantes": fmt(at.observations),
        "Orientacoes realizadas": list(at.orientations),
        "Encaminhamentos realizados": list(at.referrals),
        "Detalhamento encaminhamentos": fmt(at.referralDetails),
        "Sintese do caso": fmt(at.caseSummary),
        "Objetivo do encaminhamento": list(at.referralObjective),
        "Plano de acompanhamento": list(at.followupPlan),
        "Data retorno agendada": d(at.followupDate),
        "Registrado em": dt(at.createdAt),
      });
    }
  }

  // ── Aba 5: Prontuarios ─────────────────────────────────────────────────────
  const rowsProntuarios = [];
  for (const p of patients) {
    for (const a of p.appointments) {
      const pr = a.prontuario;
      if (!pr) continue;
      rowsProntuarios.push({
        "ID Atendimento": fmt(a.id),
        "Paciente": fmt(p.name),
        "CPF": fmt(p.cpf),
        "Data atendimento": d(a.scheduledDate),
        "Conteudo": fmt(pr.content),
        "Registrado em": dt(pr.createdAt),
        "Atualizado em": dt(pr.updatedAt),
      });
    }
  }

  // ── Aba 6: Observacoes Juridicas ───────────────────────────────────────────
  const rowsObsJuridicas = [];
  for (const p of patients) {
    for (const a of p.appointments) {
      for (const obs of a.obsJuridicas) {
        rowsObsJuridicas.push({
          "ID Atendimento": fmt(a.id),
          "Paciente": fmt(p.name),
          "CPF": fmt(p.cpf),
          "Data atendimento": d(a.scheduledDate),
          "Conteudo": fmt(obs.content),
          "Registrado em": dt(obs.createdAt),
        });
      }
    }
  }

  // ── Montar workbook ────────────────────────────────────────────────────────
  const wb = XLSX.utils.book_new();

  const addSheet = (name, rows) => {
    const ws = rows.length > 0
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([["Nenhum registro encontrado para o periodo selecionado."]]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet("Pacientes", rowsPacientes);
  addSheet("Atendimentos", rowsAtendimentos);
  addSheet("Anamnese Inicial", rowsAnamneseInicial);
  addSheet("Anamnese Tecnica", rowsAnamnesisTecnica);
  addSheet("Prontuarios", rowsProntuarios);
  addSheet("Obs. Juridicas", rowsObsJuridicas);

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const filename = `sala-lilas-export-${new Date().toISOString().split("T")[0]}.xlsx`;

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(buffer);
}
