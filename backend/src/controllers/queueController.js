import prisma from "../lib/prisma.js";

const roleStatusMap = {
  TECNICA: "triagem",
  CIS: "psicologia",
  NPJ: "juridica",
};

export async function getQueue(req, res) {
  const status = roleStatusMap[req.user.role];
  if (!status) return res.status(403).json({ error: "Perfil sem fila." });

  const appointments = await prisma.appointment.findMany({
    where: { status },
    include: { patient: true },
    orderBy: { updatedAt: "asc" },
  });

  res.json(appointments);
}

export async function getTimeline(req, res) {
  const { id } = req.params;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: {
          anamneseInicial: true,
          anamnesisTecnica: true,
          prontuario: true,
          obsJuridicas: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
        orderBy: { scheduledDate: "desc" },
      },
    },
  });

  if (!patient) return res.status(404).json({ error: "Paciente não encontrado." });
  res.json(patient);
}
