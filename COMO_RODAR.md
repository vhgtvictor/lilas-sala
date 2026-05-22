# Como Rodar o Projeto Sala Lilás

## Pré-requisitos
- [Node.js 18+](https://nodejs.org)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

---

## 1. Subir o Banco de Dados (PostgreSQL)

Abra o terminal na pasta raiz do projeto (`sala-lilas`) e execute:

```bash
docker-compose up -d
```

Aguarde o container subir (pode demorar ~30s na primeira vez, pois baixa a imagem).

---

## 2. Configurar o Backend

```bash
cd backend
npm install
npx prisma db push
npm run db:seed
```

Isso vai:
- Instalar as dependências
- Criar todas as tabelas no banco
- Criar usuários de teste (senha padrão: `admin123`)

### Iniciar o backend:
```bash
npm run dev
```

O backend ficará em: http://localhost:3001

---

## 3. Configurar o Frontend

Abra outro terminal:

```bash
cd frontend
npm install
npm run dev
```

O frontend ficará em: http://localhost:5173

---

## Usuários de Teste

| E-mail                      | Senha     | Perfil           |
|-----------------------------|-----------|------------------|
| admin@salalilas.org         | admin123  | Administrador    |
| atendente@salalilas.org     | admin123  | Atendente        |
| tecnica@salalilas.org       | admin123  | Equipe Técnica   |
| cis@salalilas.org           | admin123  | Psicologia (CIS) |
| npj@salalilas.org           | admin123  | Jurídico (NPJ)   |

---

## Páginas do Sistema

| URL                         | Acesso       |
|-----------------------------|--------------|
| http://localhost:5173/agendar | Público (sem login) |
| http://localhost:5173/login   | Todos        |
| http://localhost:5173/dashboard | Logados   |

---

## Parar o Banco

```bash
docker-compose down
```

Para apagar os dados também:
```bash
docker-compose down -v
```
