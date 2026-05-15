# 🚀 PM-LAN: Enterprise Project Management & HRMS

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**PM-LAN** is a production-grade, multi-tenant SaaS platform designed to streamline Project Management and Human Resource Management (HRMS). Built with the MERN stack and optimized for enterprise scalability, it offers high-performance tracking, automated attendance, and AI-driven insights.

---

## 📖 Project Overview

PM-LAN addresses the complexities of modern workforce management by providing a unified interface for project tracking, resource allocation, and employee lifecycle management. 

### Core Value Propositions:
- **Unified Ecosystem**: Bridges the gap between project delivery and HR operations.
- **Strict Data Isolation**: Multi-tenant architecture ensures complete security between organizations.
- **Operational Efficiency**: Automated attendance logic and real-time notifications reduce manual overhead.
- **AI-Powered Insights**: Smart chatbot for project analysis and automated task generation.

---

## ✨ Features

### 🛠️ Admin & Management
- **Organization Control**: Full oversight of departments, employees, and roles.
- **Role-Based Access (RBAC)**: Fine-grained permissions for Admin, HR, Manager, and Employee roles.
- **Reporting & Analytics**: Comprehensive dashboards with real-time KPI tracking.

### 👥 HRMS & Attendance
- **Intelligent Attendance**: IST-aware check-in/out with automated 'Late' and 'Half Day' calculations.
- **Leave Management**: Structured approval workflows for leave requests.
- **Auto-Logout System**: Automated cleanup of active sessions at 7:00 PM IST daily.

### 📁 Project & Task Management
- **Project Lifecycle**: Create, manage, and track project progress.
- **Task Boards**: Detailed task management with priorities, assignments, and status tracking.
- **Timesheets**: Log and monitor billable/non-billable hours per project.

### 💬 Communication & AI
- **AI Chatbot**: Context-aware assistant powered by Azure/OpenAI for project insights.
- **Discussion Boards**: Real-time project-specific discussions using Socket.io.
- **Notification Engine**: Instant alerts for mentions, assignments, and approvals.

---

## 💻 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 15+ (App Router), React 19, Tailwind CSS, Lucide Icons, Framer Motion |
| **Backend** | Node.js, Express, Socket.io (Real-time updates) |
| **Database** | MongoDB with Mongoose (ODM) |
| **Authentication** | JWT (Access & Refresh Tokens), Bcrypt (Password Hashing) |
| **Infrastructure** | Docker, Docker Compose, Nginx (Planned) |
| **Tooling** | Axios, Moment-Timezone, Morgan, Helmet (Security) |

---

## 🏗️ System Architecture

The system follows a classic **Client-Server-Database** architecture with a focus on security and data integrity.

1.  **Client Layer**: Next.js frontend communicates via REST APIs.
2.  **Auth & Security**: Requests are intercepted by JWT middleware for identity verification.
3.  **Tenant Isolation**: The `organizationIsolation` middleware injects an `organizationId` filter into every Mongoose query, preventing cross-tenant data leaks.
4.  **Service Layer**: Controllers handle business logic (e.g., Attendance status, Project KPIs).
5.  **Data Layer**: MongoDB stores hierarchical data with specific indices for performance.

---

## 📁 Folder Structure

```text
PM-LAN/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & app configurations
│   │   ├── controllers/     # Business logic handlers
│   │   ├── middleware/      # Auth, RBAC, and Org Isolation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API endpoint definitions
│   │   ├── services/        # Common utilities (logging, activity)
│   │   └── utils/           # Timezone helpers (IST), constants
│   ├── uploads/             # Locally stored file assets
│   └── Dockerfile           # Backend containerization
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js pages & layouts
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client & shared logic
│   │   └── styles/          # Tailwind & Global CSS
│   └── Dockerfile           # Frontend containerization
└── docker-compose.yml       # Multi-container orchestration
```

---

## 🛠️ Installation & Setup

### Local Development

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Jeffrin29/Project-Management-System.git
    cd Project-Management-System
    ```

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    cp .env.example .env  # Configure your MongoDB URI & JWT Secrets
    npm run dev
    ```

3.  **Frontend Setup**:
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

### Docker Setup (Production-Ready)

Ensure Docker and Docker Compose are installed, then run:
```bash
docker-compose up -d --build
```
This will spin up:
- **Backend** at `http://localhost:9000`
- **Frontend** at `http://localhost:4000`

---

## 🔑 Environment Variables

### Backend (`.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `9000` |
| `MONGODB_URI` | Connection string for MongoDB | `mongodb://...` |
| `JWT_SECRET` | Secret key for access tokens | `required` |
| `JWT_REFRESH_SECRET`| Secret key for refresh tokens | `required` |
| `CORS_ORIGIN` | Allowed frontend URL | `http://localhost:4000` |

### Frontend (`.env.local`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Full URL to the Backend API | `http://localhost:9000/api` |

---

## 🔌 API Endpoints Overview

| Module | Endpoint | Method | Access |
| :--- | :--- | :--- | :--- |
| **Auth** | `/api/auth/login` | POST | Public |
| **Attendance**| `/api/attendance/checkin` | POST | Authenticated |
| **Projects** | `/api/projects` | GET | RBAC |
| **Tasks** | `/api/tasks/:id` | PUT | Assignee/Admin |
| **HRMS** | `/api/hrms/employees` | GET | HR/Admin |
| **AI** | `/api/ai/chat` | POST | Authenticated |

---

## 🛡️ Authentication & Security

- **JWT Flow**: Uses short-lived access tokens (15m) and long-lived refresh tokens (7d).
- **Organization Isolation**: Every database query is automatically scoped to the logged-in user's `organizationId`.
- **Role-Based Access**: Specialized middlewares (`checkRole`) protect sensitive routes from unauthorized access.
- **Input Validation**: Sanitization and validation on all entry points using custom logic.

---

## 📅 Attendance Logic

The system follows strict Indian Standard Time (IST) rules for attendance, regardless of server location:

1.  **Check-In Rules**:
    - **Present**: Checked in before 10:00 AM IST.
    - **Late**: Checked in after 10:00 AM IST.
2.  **Duration Rules**:
    - **Half Day**: Total working hours < 4 hours. (Overrides Late/Present status).
3.  **Auto-Logout**:
    - A background job runs every 5 minutes to identify active sessions.
    - Any session active past 7:00 PM IST is automatically checked out at that mark.
4.  **Storage**:
    - All timestamps are stored in **UTC** in MongoDB. IST conversion happens strictly at the logic/presentation layer.

---

## 📸 UI Preview

> [!NOTE]
> Screenshots placeholders. Add your actual dashboard screenshots here.

| Dashboard Overview | Project Gantt View | AI Assistant |
| :---: | :---: | :---: |
| ![Dashboard Placeholder](https://via.placeholder.com/400x250?text=Dashboard+UI) | ![Gantt Placeholder](https://via.placeholder.com/400x250?text=Gantt+Chart+UI) | ![AI Placeholder](https://via.placeholder.com/400x250?text=AI+Chat+UI) |

---

## 🚀 Deployment Guide

1.  **Virtual Machine (VM)**: Deployment via Ubuntu 22.04 LTS.
2.  **Public IP**: Ensure the IP is whitelisted in MongoDB Atlas.
3.  **Environment Sync**: Update `NEXT_PUBLIC_API_URL` in `docker-compose.yml` with the server's Public IP.
4.  **Ports**: 
    - Port `9000`: Backend API
    - Port `4000`: Frontend UI
5.  **Docker Command**:
    ```bash
    docker compose up -d --build --force-recreate
    ```

---

## 🔍 Troubleshooting

- **CORS Errors**: Ensure `CORS_ORIGIN` in backend matches your frontend URL.
- **Memory Issues**: Frontend container is allocated 4GB RAM to handle Turbopack/Next.js builds in Docker.
- **MongoDB Connection**: Verify your IP is whitelisted if using MongoDB Atlas.
- **Failed to Fetch**: Ensure the backend container is running and the port is exposed on the host.

---

## 🔮 Future Enhancements

- [ ] **AI Agents**: Autonomous task assignment and meeting scheduling.
- [ ] **Advanced Analytics**: Interactive charts for resource utilization and project burnout.
- [ ] **Mobile Application**: React Native port for on-the-go management.
- [ ] **Real-time Collaboration**: Shared document editing and live task updates.

---

## 👥 Contributors

- **Jeffrin29** - Developer

---

