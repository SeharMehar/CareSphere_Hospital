# CareSphere — Hospital Management System

> **Domain:** Software Testing Techniques  
> **Topic:** Black Box Testing

CareSphere is a comprehensive, real-time Hospital Management System built with **React 19**, **Vite**, and **Supabase (PostgreSQL)**. It features role-based dashboards for six hospital roles, appointment scheduling with shift validation, ward/bed management, an automated recruitment pipeline, and real-time wardboy task assignment with cross-browser instant updates.

---

## Features

- **Role-Based Access Control (RBAC):** Six specialized dashboard views — Admin, Doctor, Nurse, Receptionist, Wardboy, and Patient — each with distinct permissions and capabilities.
- **Appointment Management:** Patients book consultations with 15-minute interval enforcement and doctor shift validation. Staff members can confirm, approve, reject, or cancel appointments.
- **Ward & Facility Management:** Real-time bed capacity tracking with Add, Edit, Remove, and increment/decrement controls. Department creation and ward assignment.
- **Automated Recruitment Pipeline:** Public careers portal (`/apply`) with role-specific dynamic form fields. Admin queue for reviewing, approving, and rejecting applications with detailed cover letter modals.
- **Wardboy Task System:** Admins, Doctors, and Receptionists assign tasks to wardboys. Tasks appear instantly via Supabase Realtime (WebSocket). Completed tasks persist in a History tab — they never disappear.
- **User Management:** Admin panel for creating, editing, and removing hospital users. Includes shift time configuration, department assignment, salary, and contact details.
- **Secure Authentication:** Email/password login via Supabase Auth. Includes patient self-registration, password reset flow (request link → set new password), and protected route guards.
- **404 Error Handling:** Custom Not Found page for invalid URLs.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7, Vanilla CSS |
| Routing | react-router-dom v7 |
| Backend & Database | Supabase (PostgreSQL + Auth + Realtime) |
| State Management | React Context API (`AuthContext.jsx`) |
| Deployment | Vercel (SPA rewrites) |

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/musman2403/caresphere.git
cd caresphere
npm install
```

### 2. Configure Environment
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### 3. Database Setup
Run the following SQL scripts in your **Supabase SQL Editor**, in order:
1. `database_schema.sql` — Creates all tables and seeds departments/wards
2. `setup_wardboy_tasks.sql` — Creates task table, disables RLS, enables Realtime
3. `fix_rls_policies.sql` — Configures Row Level Security policies
4. `seed_data.sql` *(optional)* — Seeds sample data for development

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Application Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page — hero, departments, facilities, testimonials |
| `/doctors` | Public | Doctor directory with department filter |
| `/contact` | Public | Contact information and message form |
| `/appointment` | Authenticated (Patient) | Appointment booking form |
| `/apply` | Public | Staff job application (careers portal) |
| `/login` | Public | Email/password authentication |
| `/signup` | Public | Patient self-registration |
| `/forgot-password` | Public | Password reset request |
| `/reset-password` | Via email link | Set new password form |
| `/dashboard` | Authenticated | Role-based dashboard (6 views) |
| `/users` | Admin/Doctor only | User management panel |
| `/*` | Public | 404 Not Found page |

---

## User Roles & Permissions

| Capability | Admin | Doctor | Receptionist | Nurse | Patient | Wardboy |
|------------|:-----:|:------:|:------------:|:-----:|:-------:|:-------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Manage Wards & Departments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View All Appointments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Approve/Cancel Appointments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Book Appointments | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Review Staff Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Wardboy Tasks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Complete Tasks | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

> *Doctors can access user management but cannot create admin accounts or delete users.

---

## Black Box Testing Overview

This project is documented for **Black Box Testing** — a testing technique where we validate software behavior based solely on **inputs and expected outputs**, without examining internal code.

### Testing Techniques Applied

| Technique | Description | CareSphere Application |
|-----------|-------------|----------------------|
| **Equivalence Partitioning** | Group inputs into valid/invalid classes | Email formats, role types, blood groups |
| **Boundary Value Analysis** | Test at exact boundaries | Password length (5 vs 6 chars), appointment intervals (14 vs 15 min), shift times |
| **Decision Table Testing** | Map conditions to actions | Role-based access permissions, application status actions |
| **State Transition Testing** | Track state changes from events | Appointment lifecycle (Pending → Confirmed → Completed), Task lifecycle (Pending → Completed) |
| **Error Guessing** | Anticipate error-prone scenarios | SQL injection, XSS, double-click prevention, expired links |
| **Use Case Testing** | End-to-end user workflows | Patient books appointment, Admin approves application, Wardboy completes task |

### Test Case Summary

| Module | Test Cases | Primary Techniques |
|--------|:---------:|-------------------|
| Authentication (Login) | 10 | EP, BVA, State Transition, Error Guessing |
| Patient Registration | 9 | EP, BVA, State Transition, Error Guessing |
| Appointment Booking | 10 | BVA, EP, State Transition, Use Case |
| Ward Management | 10 | BVA, EP, Use Case, Error Guessing |
| Staff Applications | 7 | EP, State Transition, Decision Table |
| Wardboy Tasks | 8 | State Transition, EP, Use Case, Decision Table |
| User Management | 8 | EP, Use Case, Decision Table |
| Password Reset | 7 | BVA, EP, State Transition, Error Guessing |
| Navigation & 404 | 4 | EP, State Transition, Use Case |
| **Total** | **73** | |

> 📄 For the complete test case tables with inputs, expected outputs, and technique labels, see the [System Guide](system_guide.md).

---

## Project Structure

```
caresphere/
├── src/
│   ├── context/
│   │   └── AuthContext.jsx      # Global state, Supabase queries, auth logic
│   ├── components/
│   │   ├── Navbar.jsx           # Site-wide navigation
│   │   ├── Footer.jsx           # Site-wide footer
│   │   ├── Loader.jsx           # Loading spinner
│   │   └── ProtectedRoute.jsx   # Auth guard wrapper
│   ├── pages/
│   │   ├── Home.jsx             # Landing page
│   │   ├── Login.jsx            # Authentication
│   │   ├── SignUp.jsx           # Patient registration
│   │   ├── ForgotPassword.jsx   # Password reset request
│   │   ├── ResetPassword.jsx    # New password form
│   │   ├── Dashboard.jsx        # 6 role-based dashboard views
│   │   ├── Users.jsx            # Admin user management
│   │   ├── Appointment.jsx      # Appointment booking
│   │   ├── Apply.jsx            # Careers portal
│   │   ├── Doctors.jsx          # Doctor directory
│   │   ├── Contact.jsx          # Contact form
│   │   └── NotFound.jsx         # 404 error page
│   ├── App.jsx                  # Route definitions
│   ├── main.jsx                 # React entry point
│   ├── supabaseClient.js       # Supabase client init
│   └── dummyData.js            # Constants (roles, departments)
├── database_schema.sql          # Core database tables
├── setup_wardboy_tasks.sql      # Task table + Realtime setup
├── fix_rls_policies.sql         # Row Level Security config
├── seed_data.sql                # Sample data for development
├── vercel.json                  # Vercel SPA deployment config
├── package.json
└── README.md
```

---

## Database Schema (11 Tables)

| Table | Primary Key | Purpose |
|-------|------------|---------|
| `departments` | `depid` | Hospital departments |
| `doctor` | `docid` | Doctor profiles with shifts |
| `nurse` | `nurseid` | Nurse profiles with shifts |
| `receptionist` | `repid` | Receptionist profiles |
| `wardboy` | `wardbid` | Wardboy profiles |
| `patient` | `pid` | Patient records |
| `admins` | `adminid` | Admin credentials |
| `appointment` | `apid` | Patient-Doctor appointment bookings |
| `ward` | `wardid` | Ward bed capacity tracking |
| `applications` | `id` | Staff job applications |
| `wardboytasks` | `taskid` | Wardboy task assignments |

---

## Build & Deploy

```bash
npm run build       # Production build → /dist
npm run preview     # Preview production build locally
npm run lint        # Run ESLint
```

**Vercel:** Push to GitHub → connect repo in Vercel → auto-deploys with SPA rewrites.

---

## Author

**Muhammad Usman**  
GitHub: [@musman2403](https://github.com/musman2403)
