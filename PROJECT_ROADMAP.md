# 🗺️ PM-Lan Project Roadmap & Debugging Guide

## 📊 CURRENT STATUS: 🟢 FULLY SYNCED
**Progress**: 100% Synced. Core architecture fixed. Dashboards and Auth are fully functional.

---

## 🛠 PHASE 1: FOUNDATION FIXES (COMPLETED) ✅

### 1. 🔗 API Integration (`frontend/src/lib/api.ts`)
- [x] **Header Injection**: `x-organization-id` automatically sent.
- [x] **JSON Serialization**: Fixed `[object Object]` error by centralizing `JSON.stringify` logic.
- [x] **Logging**: Added `[API REQUEST]` and `[API RESPONSE]` telemetry.

### 2. 🏢 Organization Context (`backend/src/middleware/authenticate.js`)
- [x] **Multi-Source Extraction**: Extracts `organizationId` from JWT OR `x-organization-id` header fallback.
- [x] **Universal Filter**: Preparations of `req.orgFilter` for zero-leak Mongoose queries.
- [x] **Role Normalization**: All roles (e.g. "Project Manager") now converted to `project_manager` lowercase with underscores.

### 3. 🛡️ RBAC & Dashboard Logic
- [x] **Sidebar Sync**: Navigation items filtered using normalized roles.
- [x] **Dashboard Controllers**: Optimized all summary/overview endpoints for `admin`, `hr`, `project_manager`, and `employee`.
- [x] **Alias Support**: Handled `manager` as alias for `project_manager` across the codebase.

---

## 🚀 PHASE 2: MODULE SYNCHRONIZATION (COMPLETED) ✅

### 1. 👥 HRMS & Employee Data
- [x] **Employee Lookup Fix**: Resolved "Employee record not found" by correctly mapping `userId` to `HrEmployee`.
- [x] **Attendance Consolidation**: Migrated all logic to a unified `Attendance` model. Deprecated `HrAttendance`.
- [x] **Response Standardization**: Fixed `successResponse` parameter order `(res, data, message)` across all HRMS controllers.
- [x] **Leave Management**: Standardized status check casing ("Pending", "Approved", "Rejected") to match DB enums.

### 2. 📊 Project & Task Management
- [x] **Progress Analytics**: Real-time project completion calculation based on task status.
- [x] **Ownership Filtering**: PMs can now see all tasks in projects they own, and employees only see their assigned work.
- [x] **Status Standardization**: Enforced `complete` status consistency.

---

## 📊 DATA VISIBILITY MATRIX (Updated)

| Role | Org Isolation | Task Visibility | Project Access |
| :--- | :--- | :--- | :--- |
| **admin** | Full Org | View & Edit ALL | Full Control |
| **hr** | Full Org | Attendance & Leaves | View Only (Projects) |
| **project_manager** | Project Scope | Multi-task View for Owned Projs | Edit Owned |
| **employee** | Personal Scope | Self-assigned Only | View Assigned |

---

## 📝 POST-FIX VERIFICATION (For USER)

1. **Browser Check**: Open Console (F12). You should see `[API CALL]` and `[API RESPONSE]` logs. Verify that `data` objects are not empty.
2. **Attendance**: Clock-in from Topbar and verify it appears in both "My Dashboard" and HRMS Attendance views.
3. **Roles**: Test with a "Project Manager" account to ensure Project/Task visibility is restricted to their own projects.
4. **Header Check**: verify `x-organization-id` in Request Headers for all `/api/` calls.

---

## 🔮 NEXT STEPS (FUTURE)
- [ ] **Real-time Engine**: Implement Socket.io for live dashboard updates without refresh.
- [ ] **Audit Logs**: Build a frontend viewer for the backend Audit Log collection.
- [ ] **Data Migration**: Utility script to populate `organizationId` for any legacy records.
