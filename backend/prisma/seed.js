import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@salalilas.org" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@salalilas.org",
      password,
      role: "ADMIN",
      complianceAccepted: true,
      complianceAcceptedAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "atendente@salalilas.org" },
    update: {},
    create: {
      name: "Atendente Teste",
      email: "atendente@salalilas.org",
      password,
      role: "ATENDENTE",
    },
  });

  await prisma.user.upsert({
    where: { email: "tecnica@salalilas.org" },
    update: {},
    create: {
      name: "Equipe Técnica",
      email: "tecnica@salalilas.org",
      password,
      role: "TECNICA",
    },
  });

  await prisma.user.upsert({
    where: { email: "cis@salalilas.org" },
    update: {},
    create: {
      name: "Psicóloga CIS",
      email: "cis@salalilas.org",
      password,
      role: "CIS",
    },
  });

  await prisma.user.upsert({
    where: { email: "npj@salalilas.org" },
    update: {},
    create: {
      name: "Jurídico NPJ",
      email: "npj@salalilas.org",
      password,
      role: "NPJ",
    },
  });

  console.log("Seed concluído. Senha padrão: admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
