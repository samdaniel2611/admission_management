# 🎓 AdmissionPro — Admission Management & CRM System

A full-stack web application for managing college admissions with quota control, seat allocation, document tracking, and real-time dashboards.

**Built for:** Edumerge — Junior Software Developer Assignment  
**AI Disclosure:** Code structure, logic, and all files were AI-assisted (Claude Sonnet). All code reviewed and understood by the candidate.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, React Hot Toast |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT (JSON Web Tokens) + bcryptjs |
| Styling | Pure CSS with CSS variables (no UI library) |

---

## 📁 Project Structure

```
admission-mgmt/
├── backend/
│   ├── models/          # Mongoose models
│   │   ├── User.js
│   │   ├── Institution.js
│   │   ├── Campus.js
│   │   ├── Department.js
│   │   ├── Program.js
│   │   ├── AcademicYear.js
│   │   ├── SeatMatrix.js   ← Core quota engine
│   │   └── Applicant.js
│   ├── routes/          # Express route handlers
│   │   ├── auth.js
│   │   ├── institutions.js
│   │   ├── campuses.js
│   │   ├── departments.js
│   │   ├── programs.js
│   │   ├── academicYears.js
│   │   ├── seatMatrix.js
│   │   ├── applicants.js
│   │   ├── admissions.js   ← Admission number generator
│   │   └── dashboard.js
│   ├── middleware/
│   │   └── auth.js      # JWT + RBAC middleware
│   ├── server.js
│   ├── seed.js          # Creates default users + sample data
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── contexts/
        │   └── AuthContext.js
        ├── services/
        │   └── api.js       # All API calls (axios)
        ├── components/
        │   ├── Layout.js    # Sidebar + topbar
        │   └── MasterPage.js # Reusable CRUD component
        ├── pages/
        │   ├── Login.js
        │   ├── Dashboard.js
        │   ├── masters/
        │   │   ├── Institutions.js
        │   │   ├── Campuses.js
        │   │   ├── Departments.js
        │   │   ├── Programs.js
        │   │   ├── AcademicYears.js
        │   │   └── SeatMatrix.js
        │   ├── applicants/
        │   │   ├── Applicants.js  # List with filters
        │   │   ├── ApplicantForm.js
        │   │   └── ApplicantDetail.js  ← Main workflow
        │   ├── admissions/
        │   │   └── Admissions.js
        │   └── admin/
        │       └── Users.js
        ├── App.js
        ├── index.js
        └── index.css
```

---

## ⚙️ Prerequisites

- **Node.js** v16+ 
- **MongoDB** v5+ running locally OR MongoDB Atlas connection string
- **npm** v8+

---

## 🚀 Setup Instructions

### 1. Clone / Download the repo

```bash
git clone <your-repo-url>
cd admission-mgmt
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/admission_mgmt
JWT_SECRET=your_super_secret_key_change_this
NODE_ENV=development
```

> **MongoDB Atlas:** Replace `MONGODB_URI` with your Atlas connection string.

### 3. Seed the Database

```bash
node seed.js
```

This creates:
- 3 default users (admin, officer, management)
- 1 sample institution (Reva University)
- 1 academic year (2025-26, marked as current)

### 4. Start the Backend

```bash
npm run dev      # With nodemon (auto-restart)
# OR
npm start        # Production
```

Backend runs on: `http://localhost:5000`

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

Create `.env`:
```bash
cp .env.example .env
```

`.env` content:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

```bash
npm start
```

Frontend runs on: `http://localhost:3000`

---

## 🔑 Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@edumerge.com | Admin@123 |
| **Admission Officer** | officer@edumerge.com | Officer@123 |
| **Management** | mgmt@edumerge.com | Mgmt@123 |

> Demo login buttons are available on the login page.

---

## 🗺️ User Journey Walkthrough

### Journey 1: System Setup (Admin)
1. Login as Admin
2. **Masters → Institutions** → Create institution
3. **Masters → Campuses** → Create campus under institution
4. **Masters → Departments** → Create department under campus
5. **Masters → Programs** → Create program (B.Tech CSE, etc.)
6. **Masters → Academic Years** → Create year, mark as current
7. **Masters → Seat Matrix** → Configure intake + quota distribution (KCET + COMEDK + Management must sum to total intake)

### Journey 2: Government Admission
1. Login as Admission Officer
2. **Applicants → New Applicant** → Fill 15-field form
   - Set Admission Mode: Government
   - Set Quota: KCET or COMEDK
   - Enter allotment number
3. **Applicant Detail** → Select seat matrix → Click **Allocate Seat**
   - System validates quota availability in real-time
   - Blocks if quota is full
4. Update document statuses (Pending → Submitted → Verified)
5. **Mark Fee as Paid** with amount
6. **Confirm Admission** → System generates unique admission number

### Journey 3: Management Admission
Same as above but Admission Mode = Management, Quota = Management

### Journey 4: Monitoring (Management Role)
- Login as Management
- View **Dashboard** → See filled seats, quota breakdown, pending fees, recent admissions

---

## 📐 Key System Rules Implemented

| Rule | Implementation |
|------|---------------|
| Quota seats cannot exceed intake | Pre-save validation in `SeatMatrix` model |
| No seat allocation if quota full | `hasAvailableSeats()` check before allocation |
| Admission number generated only once | `sparse: true, unique: true` + immutability check |
| Admission confirmed only if fee paid | Backend guard in `/admissions/:id/confirm` |
| Seat counters update in real time | `allocateSeat()` / `releaseSeat()` methods on model |
| Role-based access control | JWT middleware + `authorize(...roles)` on every route |

---

## 📊 Admission Number Format

```
INST/YEAR/COURSETYPE/PROGCODE/QUOTA/SEQUENCE
Example: REVA/2025/UG/CSE/KCET/0001
```

---

## 🎭 Role Permissions

| Feature | Admin | Officer | Management |
|---------|-------|---------|------------|
| Master Setup | ✅ | ❌ | ❌ |
| Create Applicants | ✅ | ✅ | ❌ |
| Seat Allocation | ✅ | ✅ | ❌ |
| Document Verification | ✅ | ✅ | ❌ |
| Confirm Admission | ✅ | ✅ | ❌ |
| Dashboard | ✅ | ✅ | ✅ |
| User Management | ✅ | ❌ | ❌ |

---

## 🔌 API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/register          (admin only)
GET    /api/auth/users             (admin only)

GET    /api/institutions
POST   /api/institutions           (admin only)
PUT    /api/institutions/:id       (admin only)

GET    /api/campuses?institution=
POST   /api/campuses
...similar for /departments, /programs

GET    /api/academic-years
GET    /api/academic-years/current
POST   /api/academic-years

GET    /api/seat-matrix?academicYear=&institution=
POST   /api/seat-matrix
GET    /api/seat-matrix/:id/availability/:quotaName

GET    /api/applicants?search=&status=&quotaType=&page=
POST   /api/applicants
GET    /api/applicants/:id
PUT    /api/applicants/:id
PATCH  /api/applicants/:id/documents/:docId
POST   /api/applicants/:id/allocate
PATCH  /api/applicants/:id/fee

POST   /api/admissions/:id/confirm
PATCH  /api/admissions/:id/status
GET    /api/admissions/admitted

GET    /api/dashboard?academicYear=&institution=
```

---

## 🤖 AI Disclosure

- **Tool Used:** Claude Sonnet (Anthropic)
- **AI-Assisted:** Full code generation including backend models, routes, frontend components, CSS design system, business logic
- **Candidate Understanding:** All logic including seat validation, admission number generation, RBAC, and quota management is understood and can be explained in interview

---

## 📝 Out of Scope (Not Built)

Per BRS requirements, the following were intentionally excluded:
- Payment gateway integration
- SMS/WhatsApp notifications  
- AI predictions
- Multi-college complex CRM
- Marketing automation
