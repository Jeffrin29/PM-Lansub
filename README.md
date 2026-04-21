# Project Management & HRMS System (PM-Lan)

A comprehensive multi-tenant Project Management and HRMS solution built with Next.js, Node.js, and MongoDB.

## 🚀 Architecture Overview

### Backend Stack
- **Runtime**: Node.js + Express
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **Security**: JWT, Helmet, CORS, Rate Limiting

### Frontend Stack
- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **API Client**: Axios/Fetch with unified `lib/api.ts`

---

## 🏢 Multi-Tenant Logic

Every collection in the database contains an `organizationId`. 
Data isolation is enforced via the `organizationIsolation` middleware which attaches a `req.orgFilter` to every request.

**Rule**: All database queries must include `...req.orgFilter` to prevent cross-tenant data leaks.

```javascript
const tasks = await Task.find({ ...req.orgFilter, status: 'active' });
```

---

## 👥 Role-Based Access Control (RBAC)

The system supports four primary roles:
1.  **admin**: Access to everything within the organization.
2.  **hr**: Access to employee records, attendance, and leave management.
3.  **project_manager**: Access to projects they own or are members of.
4.  **employee**: Access to their own tasks, attendance, and profile.

**Note**: Roles are normalized to lowercase in the `authenticate` middleware. Use `req.user.role` for logic checks.

---

## 🛠️ Setup & Development

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas or local instance

### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---

## 🔍 Debugging & Maintenance

If data is not appearing in the dashboard:
1.  Check the **Network Tab** in your browser.
2.  Verify the API response structure matches `{ success: true, data: { ... } }`.
3.  Check `backend/logs` for any JWT or Organization Context errors.
4.  Refer to `PROJECT_ROADMAP.md` for current implementation status and fixes.
