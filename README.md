# Regula – Role‑Based Workflow Approval Engine

Regula is a **production‑ready workflow approval system** built to model real‑world enterprise approval pipelines. It enforces **strict role‑based access control**, **immutable audit trails**, and a **deterministic workflow lifecycle**, deployed using modern serverless architecture.

This project is intentionally scoped, opinionated, and security‑first — designed to demonstrate backend correctness, system design clarity, and production deployment discipline.

---

## ✨ Core Features

### 1. Role‑Based Access Control (RBAC)

Regula enforces permissions **server‑side** for the following roles:

* **ADMIN** – System administration, user role assignment, system metrics, logs
* **REQUESTER** – Create and submit workflows
* **REVIEWER** – Approve or reject submitted workflows (comment required)
* **EXECUTOR** – Execute approved workflows only

> Roles are authoritative at the API layer — UI restrictions alone are never trusted.

---

### 2. Deterministic Workflow Lifecycle

Workflows follow a **strict, finite state machine**:

```
DRAFT → SUBMITTED → APPROVED → EXECUTED
```

Rules enforced:

* Only REQUESTER can create/submit
* Only REVIEWER can approve/reject
* Only EXECUTOR can execute
* Invalid state transitions are impossible via API or UI

---

### 3. Immutable Audit Timeline

Every workflow records an append‑only audit trail:

* CREATE
* SUBMIT
* APPROVE / REJECT (with mandatory comment)
* EXECUTE

Audit entries:

* Are timestamped
* Are role‑attributed
* Cannot be edited or deleted

This guarantees **traceability and compliance readiness**.

---

### 4. Admin Control Panel

The Admin dashboard provides:

* System health overview
* Workflow & user metrics
* SLA & webhook health indicators
* Role assignment by email
* Read‑only access to system logs

Admin privileges **do not bypass** workflow rules.

---

## 🏗 Architecture Overview

* **Frontend**: Next.js (App Router)
* **Backend**: Vercel Serverless Functions
* **Database**: Neon PostgreSQL
* **ORM**: Prisma
* **Auth**: Email‑based authentication + RBAC
* **Deployment**: Vercel

No filesystem state, no long‑running servers, fully serverless.

---

## 🔐 Security Principles

* Secrets managed via environment variables
* No hard‑coded credentials
* Server‑side role validation on every protected route
* PostgreSQL used instead of file‑based databases
* Production‑safe for serverless execution

---

## 🧪 Local Development

```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Environment variables required:

```env
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_secure_secret
```

---

## 🚀 Deployment

The project is deployed on **Vercel** with:

* Neon PostgreSQL as the production database
* Prisma migrations applied manually before deploy
* Serverless‑compatible API routes

No SQLite or local storage is used in production.

### Access Credentials (Demo)

The following users were automatically seeded for demonstration purposes:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Requester** | `requester@test.com` | `password123` |
| **Reviewer** | `reviewer@test.com` | `password123` |
| **Executor** | `executor@test.com` | `password123` |
| **Admin** | `admin@test.com` | `password123` |

---

## 📌 Design Philosophy

Regula intentionally avoids feature bloat.

Instead, it focuses on:

* Correctness over convenience
* Explicit rules over flexibility
* Auditability over speed
* Real‑world enterprise patterns

This mirrors how approval systems are built in regulated environments.

---

## 📄 License

This project is for educational and portfolio use.

---

## 👤 Author

Built by **Aniket Sarode**

A project demonstrating system design, backend correctness, and production discipline.
