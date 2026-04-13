# Project Roadmap: PM Tool (PM-Lan)

This document provides a comprehensive overview of the **Project Management Tool (PM-Lan)** architecture, data flow, security model, and future development steps.

---

## 1. 🧠 Project Overview

The **PM Tool** is a multi-tenant full-stack application designed to streamline project management, HR operations, and team collaboration.

### Core Modules:
*   **Dashboard**: Real-time analytics, health scores, and progress tracking.
*   **Projects & Tasks**: Kanban/List views, task assignment, milestones, and blocking issues.
*   **HRMS**: Employee management, department structures, and leave management.
*   **Attendance**: Daily clock-in/out, late tracking, and monthly visualization.
*   **Reports**: Performance metrics, cost analysis, and utilization reports.

### High-Level Architecture:
*   **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Lucide Icons.
*   **Backend**: Node.js, Express, Mongoose (MongoDB ODM).
*   **Infrastructure**: Dockerized (Dockerfile + Docker Compose), JWT-based stateless authentication.

---

## 2. 🏗️ Architecture Breakdown

### Frontend Structure (`/frontend/src/app`)
*   **Routing**: Uses Next.js App Router. Protected routes are wrapped in layout-level auth checks.
*   **Components**: Modular UI components in `/components`, business logic separated into `/hooks` and `/lib`.
*   **State Management**: Combination of React `useState`/`useEffect` and Context API for global auth state.

### Backend Structure (`/backend/src`)
*   **Controllers**: Logic for handling requests (e.g., `authController.js`, `projectController.js`).
*   **Routes**: Defined in `/routes`, grouped by module.
*   **Middleware**: Custom logic for authentication (`authenticate.js`), RBAC (`checkRole.js`), and Multi-tenancy (`organizationIsolation.js`).
*   **Models**: Mongoose schemas in `/models`.

### Database Design (MongoDB)
*   **Relational Logic**: Uses `ObjectId` references for cross-collection relationships.
*   **Indexes**: Heavily indexed on `organizationId` and `userId` for performance and isolation.

---

## 3. 🔐 Authentication Flow

1.  **Login Process**:
    *   User submits credentials to `POST /api/auth/login`.
    *   Backend validates password via `bcrypt`.
    *   Backend populates `roleId` to get the role name.
2.  **JWT Creation**:
    *   Payload contains: `userId`, `role` (canonical lowercase), and `organizationId`.
    *   Token signed with `JWT_SECRET` (default: "secret").
3.  **Usage**:
    *   Frontend stores token in `localStorage`.
    *   Every subsequent request includes `Authorization: Bearer <token>`.
4.  **Validation**:
    *   `authenticate.js` middleware verifies JWT.
    *   Decoded payload is attached to `req.user`.

---

## 4. 🧩 RBAC (Role-Based Access Control) Analysis

### Current Implementation:
*   **Storage**: Roles are stored in a dedicated `roles` collection but also cached as a string on the `User` model.
*   **Middleware**: `checkRole.js` and `requireRole.js` validate `req.user.role` against allowed strings.
*   **Canonical Mapping**: `authController` often maps `org_admin` or `super_admin` to the string `admin` for simplified frontend logic.

### Inconsistencies Detected:
*   **Dual Storage**: User model has both `roleId` (ref) and `role` (string), leading to potential sync issues.
*   **Hardcoded Checks**: Many controllers check for `'admin'` or `'employee'` strings instead of checking specific permissions.
*   **Middleware Fragmentation**: Multiple middlewares doing similar things (`checkRole` vs `authorize` vs `requireRole`).

---

## 5. 🏢 Organization / Multi-Tenant Logic

The system uses a **Shared Database, Shared Schema** multi-tenancy model.

*   **Isolation**: The `organizationIsolation` middleware is critical. It extracts `organizationId` from the JWT and attaches `req.orgFilter = { organizationId: ... }`.
*   **Query Injection**: Controllers spread `...req.orgFilter` into almost every database query to ensure data leakage does not occur.
*   **Enforcement**: `enforceOrgParam` prevents users from accessing resources by manually changing IDs in URL params.

---

## 6. 🔄 Data Flow

### Flow: Login → Dashboard Data Load
1.  `POST /api/auth/login` returns JWT + User Info.
2.  Frontend redirects to `/dashboard`.
3.  Dashboard components trigger multiple parallel fetches:
    *   `GET /api/dashboard/summary`
    *   `GET /api/dashboard/health`
    *   `GET /api/dashboard/task-analytics`
4.  Backend uses `req.user.role` to filter:
    *   **Admin**: Total org data.
    *   **Employee**: Only their assigned tasks/projects.

### Flow: Task Creation → Display
1.  `POST /api/tasks` includes `projectId` and task details.
2.  Backend injects `req.user.organizationId`.
3.  Task is saved; `logActivity` captures the event.
4.  Frontend invalidates cache/refetches task list.

### Flow: Attendance Sync
1.  Employee clicks "Clock In" (`POST /api/attendance/checkin`).
2.  Backend records time, sets `status` (Late/Present).
3.  Activity log created.
4.  Dashboard "Health" score or "Workload" chart updates immediately.

---

## 7. 📊 API Structure (Major Endpoints)

| Module | Endpoints |
| :--- | :--- |
| **Auth** | `/register`, `/login`, `/logout`, `/me`, `/refresh-token` |
| **Dashboard** | `/summary`, `/health`, `/task-analytics`, `/workload`, `/recent-activity` |
| **Projects** | `GET /`, `POST /`, `GET /:id`, `PUT /:id`, `DELETE /:id`, `/attachments` |
| **Tasks** | `GET /`, `POST /`, `PUT /:id`, `/comments`, `/attachments` |
| **Attendance** | `/checkin`, `/checkout`, `/stats`, `/my`, `/all` |
| **HRMS** | `/employees`, `/departments`, `/leaves` |

---

## 8. 🗃️ Database Design (Core Collections)

*   **users**: Identity, credentials, profile, `organizationId`, `roleId`.
*   **roles**: `name`, `displayName`, `permissions[]`, `level`.
*   **projects**: `projectTitle`, `owner`, `teamMembers[]`, `budget`, `status`.
*   **tasks**: `title`, `projectId`, `assignedTo`, `status`, `priority`.
*   **attendance**: `user`, `date`, `checkIn`, `checkOut`, `workingHours`, `status`.
*   **organizations**: `name`, `plan`, `settings`, `createdBy`.

### Relationships:
*   `User (1)` → `(1) Organization`
*   `User (1)` → `(1) Role`
*   `Project (1)` → `(N) Tasks`
*   `Project (N)` ⬌ `(N) Users` (Team Members)

---

## 9. ⚠️ Issues Detected

| Issue | Description | Risk |
| :--- | :--- | :--- |
| **RBAC Redundancy** | Mix of `roleId` and string `role` on User model. | Data Inconsistency |
| **Route Duplication** | `attendance.js` and `attendance.routes.js` both exist. | Maintenance Overhead |
| **ID Inconsistency** | Some controllers use `req.user.userId`, others `req.user._id`. | Refactoring Bugs |
| **Hardcoded Roles** | "admin" string checked directly in controllers. | Fragility |
| **Redundant Auth** | `auth.js` middleware vs `authenticate.js`. | Confusion |

---

## 10. 🛠️ Improvement Suggestions

1.  **Unify Role System**: Remove the `User.role` string field and rely solely on `User.roleId` (populated in middleware).
2.  **Permission-Based Access**: Instead of `checkRole('admin')`, use `checkPermission('project:delete')`.
3.  **Controller Cleanup**: Standardize on `req.user.userId` as the primary identifier.
4.  **Redundancy Removal**: Delete legacy route files and consolidate middlewares.
5.  **Query Optimization**: Use MongoDB Aggregation Pipelines for Dashboard summaries instead of multiple `countDocuments` calls.

---

## 🧭 Development Roadmap

### Phase 1: Critical Cleanup & Stabilization
*   [ ] Remove redundant/duplicate route files.
*   [ ] Standardize identification (`req.user.userId`).
*   [ ] Unify authentication middleware naming.

### Phase 2: RBAC Hardening
*   [ ] Deprecate `User.role` string field.
*   [ ] Implement specific permissions within the `Role` model.
*   [ ] Update `checkRole` to check permissions where possible.

### Phase 3: Performance & Scale
*   [ ] Implement Redis for session/cache management.
*   [ ] Refactor Dashboard APIs to use Aggregations.
*   [ ] Add bulk-actions for Tasks/Projects.

### Phase 4: Feature Enhancements
*   [ ] Gantt Chart integration for Projects.
*   [ ] Real-time notifications via WebSockets (Socket.io).
*   [ ] Advanced Report Generation (PDF/CSV).
