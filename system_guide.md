# CareSphere — Complete System Guide
## Domain: Software Testing Techniques | Topic: Black Box Testing

---

## 1. Project Overview

**CareSphere** is a full-stack Hospital Management System (HMS) built with **React 19**, **Vite**, and **Supabase (PostgreSQL)**. It manages multi-role hospital workflows including patient registration, appointment scheduling, ward/bed management, staff recruitment, task assignment, and real-time dashboards — all secured behind Supabase Authentication and Role-Based Access Control (RBAC).

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 7 |
| Routing | react-router-dom v7 |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) |
| State Management | React Context API (`AuthContext.jsx`) |
| Styling | Vanilla CSS (glassmorphism, responsive) |
| Deployment | Vercel (SPA with `vercel.json` rewrites) |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐  │
│  │ Home    │  │ Login    │  │ SignUp   │  │ Dashboard   │  │
│  │ Contact │  │ Forgot   │  │ Apply    │  │ Users       │  │
│  │ Doctors │  │ Reset    │  │ Appoint. │  │ NotFound    │  │
│  └────┬────┘  └────┬─────┘  └────┬─────┘  └──────┬──────┘  │
│       └─────────────┴────────────┴───────────────┘          │
│                          │                                  │
│              ┌───────────┴───────────┐                      │
│              │    AuthContext.jsx     │ ← Global State       │
│              │  (API + State Broker)  │   & Controller       │
│              └───────────┬───────────┘                      │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTPS / WebSocket (Realtime)
┌──────────────────────────┼──────────────────────────────────┐
│                   SUPABASE BACKEND                          │
│  ┌───────────┐  ┌────────────┐  ┌────────────────────────┐  │
│  │ Auth      │  │ PostgreSQL │  │ Realtime Subscriptions │  │
│  │ (JWT)     │  │ (Tables)   │  │ (wardboytasks channel) │  │
│  └───────────┘  └────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### File Map
```
/src
 ├── /context
 │    └── AuthContext.jsx     ── Global state, all Supabase queries, auth logic
 ├── /components
 │    ├── Navbar.jsx          ── Site-wide navigation bar
 │    ├── Footer.jsx          ── Site-wide footer
 │    ├── Loader.jsx          ── Loading spinner component
 │    ├── Loader.css          ── Spinner animation styles
 │    ├── Navbar.css          ── Navigation styles
 │    └── ProtectedRoute.jsx  ── Route guard (redirects unauthenticated users)
 ├── /pages
 │    ├── Home.jsx            ── Public landing page (hero, departments, facilities)
 │    ├── Login.jsx           ── Email/password authentication portal
 │    ├── SignUp.jsx          ── Patient self-registration form
 │    ├── ForgotPassword.jsx  ── Password reset request form
 │    ├── ResetPassword.jsx   ── New password form (via email link)
 │    ├── Dashboard.jsx       ── Role-based dashboards (6 views inside one file)
 │    ├── Users.jsx           ── Admin user management (CRUD + modal edits)
 │    ├── Appointment.jsx     ── Public appointment booking page
 │    ├── Apply.jsx           ── Staff job application form (careers portal)
 │    ├── Doctors.jsx         ── Public doctor directory with department filter
 │    ├── Contact.jsx         ── Contact form + hospital info cards
 │    ├── NotFound.jsx        ── 404 error page
 │    ├── SharedPages.css     ── Shared page-level styles
 │    └── Home.css            ── Home page specific styles
 ├── App.jsx                  ── React Router route definitions
 ├── main.jsx                 ── React DOM entry point
 ├── supabaseClient.js        ── Supabase client initialization
 ├── dummyData.js             ── ROLES, DEPARTMENTS, and WARD_DATA constants
 └── index.css                ── Global CSS reset and base styles
```

---

## 3. Database Schema

### Entity Relationship
```
Departments (1) ──── (*) Doctor
             (1) ──── (*) Nurse
             (1) ──── (*) Receptionist
             (1) ──── (*) WardBoy
             (1) ──── (*) Ward
             (1) ──── (*) Appointment

Patient (1) ──── (*) Appointment
Doctor  (1) ──── (*) Appointment
WardBoy (1) ──── (*) WardBoyTasks

Admins ── standalone (admin credentials)
Applications ── standalone (recruitment pipeline)
```

### Core Tables

| Table | Primary Key | Key Columns | Purpose |
|-------|------------|-------------|---------|
| `departments` | `depid` | `departmentname` | Hospital departments (Emergency, Surgical, etc.) |
| `doctor` | `docid` | `name`, `email`, `depid`, `shift_start`, `shift_end` | Doctor profiles with shift times |
| `nurse` | `nurseid` | `nursename`, `email`, `depid`, `shift_start`, `shift_end` | Nurse profiles |
| `receptionist` | `repid` | `name`, `email`, `depid`, `shift_start`, `shift_end` | Receptionist profiles |
| `wardboy` | `wardbid` | `wardbname`, `email`, `depid`, `shift_start`, `shift_end` | Ward staff profiles |
| `patient` | `pid` | `pname`, `email`, `bloodgroup`, `disease` | Patient records |
| `admins` | `adminid` | `username`, `passwordhash`, `role` | Admin credentials |
| `appointment` | `apid` | `pid`, `docid`, `depid`, `appointmentdate`, `status` | Appointment bookings |
| `ward` | `wardid` | `wardno`, `totalbeds`, `availablebeds`, `depid` | Ward bed capacity |
| `applications` | `id` | `name`, `email`, `role`, `status`, `coverletter` | Staff job applications |
| `wardboytasks` | `taskid` | `wardbid`, `taskdescription`, `status`, `assignedbyrole` | Wardboy task assignments |

---

## 4. User Roles & Access Control

Six distinct roles exist, each with specific permissions and dashboard views:

| Role | Dashboard View | Can Access | Key Capabilities |
|------|---------------|------------|-----------------|
| **Admin** | `AdminView` | Everything | Manage users, wards, departments, appointments, applications, assign tasks |
| **Doctor** | `DoctorView` | Own appointments, task assignment | Approve/reject appointments, assign wardboy tasks |
| **Receptionist** | `ReceptionistView` | All appointments, wards, tasks | Confirm/cancel appointments, manage wards, assign wardboy tasks |
| **Nurse** | `NurseView` | Ward info (read-only stats) | View patient/medication stats |
| **Patient** | `PatientView` | Own appointments only | Book appointments, cancel own pending appointments |
| **Wardboy** | `WardBoyView` | Own tasks only | View pending tasks, mark tasks completed, view task history |

### Authentication Flow
1. User submits email + password on `/login`
2. Supabase Auth issues a JWT session
3. `AuthContext` queries all 6 role tables to match the email
4. The first match determines `user.role`, `user.id`, `user.name`
5. `ProtectedRoute` wrapper allows/blocks access to `/dashboard` and `/users`

---

## 5. Black Box Testing — Theory & Application

### 5.1 What is Black Box Testing?

Black Box Testing is a software testing method where the tester examines the **functionality** of an application without looking at its internal code or logic. The tester only knows the **inputs** and **expected outputs** — the system is treated as an opaque "black box."

### 5.2 Key Black Box Testing Techniques

| Technique | Definition | When to Use |
|-----------|-----------|-------------|
| **Equivalence Partitioning (EP)** | Divide inputs into classes where all values in a class behave the same way | Forms with ranges, dropdowns, typed inputs |
| **Boundary Value Analysis (BVA)** | Test at the exact boundaries of input ranges | Numeric fields, date ranges, password length |
| **Decision Table Testing** | Create a table of input conditions and their resulting actions | Multi-condition logic like role permissions |
| **State Transition Testing** | Track how the system moves between states based on events | Appointment status flow, task lifecycle |
| **Error Guessing** | Use experience and intuition to guess where errors might hide | Authentication, edge cases in forms |
| **Use Case Testing** | Model end-to-end scenarios that simulate real user workflows | Full user journeys from login to action |

---

## 6. Black Box Test Cases for CareSphere

### 6.1 Module: User Authentication (Login)

**Page:** `/login` — **Component:** `Login.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| AUTH-01 | Valid login with correct email and password | `email: admin@hospital.pk`, `password: Admin123!` | Redirect to `/dashboard`, user name displayed | Use Case |
| AUTH-02 | Invalid email format | `email: "notanemail"`, `password: "any"` | HTML5 validation prevents submission | EP |
| AUTH-03 | Correct email, wrong password | `email: admin@hospital.pk`, `password: wrong` | Red error message: "Invalid login credentials" | Error Guessing |
| AUTH-04 | Empty email field | Submit form with email blank | HTML `required` attribute blocks submission | BVA |
| AUTH-05 | Empty password field | Submit form with password blank | HTML `required` attribute blocks submission | BVA |
| AUTH-06 | Email with extra spaces/caps | `email: " Admin@Hospital.PK "` | Login succeeds (system trims and lowercases) | EP |
| AUTH-07 | SQL injection attempt in email | `email: "' OR 1=1 --"` | Login fails gracefully, no data breach | Error Guessing |
| AUTH-08 | Double-click login button | Click "Login" rapidly twice | Only one auth request is sent, button disables | Error Guessing |
| AUTH-09 | Already logged in user visits /login | Navigate to `/login` while authenticated | Auto-redirect to `/dashboard` | State Transition |
| AUTH-10 | Login as each role type | Login as admin, doctor, nurse, receptionist, patient, wardboy | Each gets their correct dashboard view | Decision Table |

---

### 6.2 Module: Patient Registration (SignUp)

**Page:** `/signup` — **Component:** `SignUp.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| REG-01 | Valid full registration | All fields filled with valid data | Green success message: "Account created!" | Use Case |
| REG-02 | Duplicate email | Email already exists in system | Error message from Supabase (user already registered) | EP |
| REG-03 | Password too short | Password < 6 characters | Supabase rejects with error message | BVA |
| REG-04 | Password exactly 6 chars | Password = "Ab12!x" (6 chars) | Registration succeeds (boundary: minimum accepted) | BVA |
| REG-05 | Missing required field | Leave "Phone" blank | HTML validation blocks submission | EP |
| REG-06 | Invalid blood group | Select dropdown — only valid options exist | System restricts to [A+, A-, B+, B-, AB+, AB-, O+, O-] | EP |
| REG-07 | Future date of birth | Set DOB to a future date | System should accept (no validation exists — potential defect) | BVA |
| REG-08 | XSS in name field | `name: "<script>alert('xss')</script>"` | Text stored as-is, rendered safely by React | Error Guessing |
| REG-09 | Submit button after success | Click "Register" again after success message | Button is disabled; can't double-submit | State Transition |

---

### 6.3 Module: Appointment Booking

**Page:** `/appointment` and Patient Dashboard — **Components:** `Appointment.jsx`, `PatientView` in `Dashboard.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| APT-01 | Book valid appointment | Select department, doctor, valid future date | "Appointment requested" success alert | Use Case |
| APT-02 | Time not on 15-min interval | Select time 10:07 AM | Alert: "Appointments can only be booked in exact 15-minute intervals" | BVA |
| APT-03 | Time exactly on interval | Select time 10:15 AM | Booking proceeds successfully | BVA |
| APT-04 | Doctor outside shift hours | Select Dr. X (shift 09:00-17:00), book at 20:00 | Alert: "Dr. X is only available between 09:00 and 17:00" | BVA |
| APT-05 | Time at shift boundary start | Book at exactly 09:00 (shift start) | Booking succeeds (boundary: inclusive) | BVA |
| APT-06 | Time at shift boundary end | Book at exactly 17:00 (shift end) | Booking succeeds (boundary: inclusive) | BVA |
| APT-07 | "Any Doctor (Random)" option | Select random with valid time | System picks a random available doctor | EP |
| APT-08 | Random doctor, no one available | Select random, all doctors off-shift at chosen time | Alert: "No doctors currently available" | EP |
| APT-09 | Non-logged-in user visits page | Access `/appointment` without auth | Alert + redirect to `/signup` | State Transition |
| APT-10 | Cancel pending appointment | Click "Cancel" on a Pending appointment | Status changes to "Canceled" in table | State Transition |

#### Appointment State Transition Diagram
```
     ┌──────────┐
     │ Pending  │
     └────┬─────┘
          │
    ┌─────┼──────────┐
    ▼     ▼          ▼
Confirmed Approved  Canceled/Rejected
    │     │
    ▼     ▼
  Completed (auto: if appointment date is in the past)
```

---

### 6.4 Module: Ward & Bed Management

**Component:** `WardDataDisplay` in `Dashboard.jsx` — available to Admin & Receptionist

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| WRD-01 | Add new ward with valid data | WardNo: "N-601", Dept: "Emergency", Beds: 20 | Ward appears in table | Use Case |
| WRD-02 | Add ward with 0 beds | TotalBeds = 0 | Ward created with 0/0 beds (edge case) | BVA |
| WRD-03 | Add ward with negative beds | TotalBeds = -5 | HTML `min="1"` blocks submission | BVA |
| WRD-04 | Decrease beds below 0 | Click "−" when availableBeds = 0 | Button is disabled (cannot go below 0) | BVA |
| WRD-05 | Increase beds | Click "+" on any ward | TotalBeds and AvailableBeds both increase by 1 | EP |
| WRD-06 | Edit ward details | Change WardNo from "E-101" to "E-999" | Ward number updates in table after save | Use Case |
| WRD-07 | Delete ward | Click "Remove" → confirm dialog | Ward disappears from table | Use Case |
| WRD-08 | Cancel delete dialog | Click "Remove" → click Cancel | Ward remains unchanged | Error Guessing |
| WRD-09 | Add department | Type "Dermatology" → click Add | New department appears in all department dropdowns | Use Case |
| WRD-10 | Duplicate ward number | Add ward with same WardNo as existing | Database UNIQUE constraint error | EP |

---

### 6.5 Module: Staff Application (Careers)

**Page:** `/apply` — **Component:** `Apply.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| APP-01 | Submit doctor application | Fill all doctor-specific fields (license, certification) | Success alert, redirect to `/` | Use Case |
| APP-02 | Submit nurse application | Fill nursing license + shift preference | Success alert | Use Case |
| APP-03 | Submit wardboy application | Fill years experience + shift availability | Success alert | Use Case |
| APP-04 | Submit receptionist application | Fill admin experience + languages | Success alert | Use Case |
| APP-05 | No role selected | Leave role dropdown blank | "Submit" button disabled + helper text shown | State Transition |
| APP-06 | Change role mid-form | Select Doctor → fill fields → switch to Nurse | Doctor-specific fields reset, nurse fields appear | State Transition |
| APP-07 | Missing cover letter | Leave cover letter blank | HTML `required` blocks submission | EP |

#### Admin Application Decision Table

| Condition: Application Status | Action: Approve | Action: Reject | Action: Remove |
|-------------------------------|:-:|:-:|:-:|
| Pending | ✅ Available | ✅ Available | ✅ Available |
| Approved | ❌ Hidden | ❌ Hidden | ✅ Available |
| Rejected | ❌ Hidden | ❌ Hidden | ✅ Available |

---

### 6.6 Module: Wardboy Task Management

**Component:** `TaskManagement` in `Dashboard.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| TSK-01 | Assign task to wardboy | Select wardboy, enter description, click Assign | Task appears in Active Tasks tab immediately (optimistic UI) | Use Case |
| TSK-02 | Wardboy marks task completed | Click "Mark Completed" on a pending task | Task moves from "Active Tasks" tab to "History" tab | State Transition |
| TSK-03 | Completed task in history | Mark task done, switch to "History" tab | Task visible with green "Completed" badge | State Transition |
| TSK-04 | Cross-browser realtime | Assign task in Browser A, open wardboy dashboard in Browser B | Task appears in Browser B within 1-2 seconds (Supabase Realtime) | Use Case |
| TSK-05 | Empty task description | Leave description blank, click Assign | HTML `required` blocks submission | EP |
| TSK-06 | No wardboy selected | Leave wardboy dropdown empty, click Assign | HTML `required` blocks submission | EP |
| TSK-07 | Wardboy sees only own tasks | Login as Wardboy A | Only tasks assigned to Wardboy A are visible | EP |
| TSK-08 | Admin/Doctor/Receptionist sees all | Login as admin | All tasks across all wardboys are visible | Decision Table |

#### Task State Transition Diagram
```
  ┌─────────┐    Mark Completed    ┌───────────┐
  │ Pending │ ──────────────────▶  │ Completed │
  └─────────┘                      └───────────┘
  (Active Tab)                     (History Tab)
```

---

### 6.7 Module: User Management (Admin)

**Page:** `/users` — **Component:** `Users.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| USR-01 | Create new staff user | Name, email, password, role → click Add | User appears in directory grid | Use Case |
| USR-02 | Duplicate email | Add user with existing email | Error: "User already registered" | EP |
| USR-03 | Search by name | Type partial name in search box | Grid filters in real-time | EP |
| USR-04 | Filter by role | Select "Doctor" from dropdown | Only doctors displayed | EP |
| USR-05 | Edit doctor shift times | Open modal → change shift_start to 08:00 | Doctor's availability window changes | Use Case |
| USR-06 | Delete another user | Open modal → click "Remove User" → confirm | User removed from grid | Use Case |
| USR-07 | Admin cannot delete self | Open own user card modal | "Remove User" button is hidden | Decision Table |
| USR-08 | Non-admin access attempt | Manual navigate to `/users` as Patient | "Access Denied" message | Decision Table |

---

### 6.8 Module: Password Reset

**Pages:** `/forgot-password`, `/reset-password` — **Components:** `ForgotPassword.jsx`, `ResetPassword.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| PWD-01 | Request reset for valid email | Enter registered email | "Check your inbox" success view | Use Case |
| PWD-02 | Request reset for unknown email | Enter non-existent email | Supabase still says "sent" (security by design — no email enumeration) | Error Guessing |
| PWD-03 | Click expired reset link | Use link after expiry | "Invalid Link" view with "Request New Link" button | State Transition |
| PWD-04 | Passwords don't match | New = "ABC123", Confirm = "ABC124" | Error: "Passwords do not match" | EP |
| PWD-05 | Password < 6 characters | New = "Ab1!" (4 chars) | Error: "Password must be at least 6 characters" | BVA |
| PWD-06 | Password = exactly 6 chars | New = "Ab12!x" | Password updates successfully | BVA |
| PWD-07 | Successful reset | Enter matching valid passwords | "Success!" view → auto-redirect to `/login` after 2.5s | State Transition |

---

### 6.9 Module: Navigation & 404

**Components:** `Navbar.jsx`, `NotFound.jsx`, `App.jsx`

| Test ID | Test Case | Input | Expected Output | Technique |
|---------|-----------|-------|-----------------|-----------|
| NAV-01 | Invalid URL | Navigate to `/xyz123` | 404 page with "Go Back Home" link | EP |
| NAV-02 | Protected route without auth | Navigate to `/dashboard` when logged out | Redirect to `/login` | State Transition |
| NAV-03 | Public routes accessible | Navigate to `/`, `/doctors`, `/contact` | Pages load without auth | EP |
| NAV-04 | Home department links | Click "Emergency" department card | Navigates to `/doctors?dept=Emergency` | Use Case |

---

## 7. Equivalence Partitioning Summary

| Input Field | Valid Partition | Invalid Partition |
|-------------|---------------|-------------------|
| Email | `user@domain.com` format | Missing `@`, empty, spaces only |
| Password | 6+ characters | < 6 chars, empty |
| Patient Name | 1+ alphabetic characters | Empty string |
| Phone Number | Numeric string | Empty (if required) |
| Blood Group | One of [A+, A-, B+, B-, AB+, AB-, O+, O-] | Any other value |
| Gender | Male / Female / Other | Empty (if required) |
| Ward Beds | Integer ≥ 1 | 0, negative, non-numeric |
| Appointment Time | HH:MM where minutes % 15 = 0 | 10:07, 10:22, etc. |
| Doctor Shift | Time between shift_start and shift_end | Before start, after end |
| User Role | admin, doctor, nurse, receptionist, wardboy, patient | Any other string |

---

## 8. Boundary Value Analysis Summary

| Field | Min Boundary | Max Boundary | Below Min | Above Max |
|-------|-------------|-------------|-----------|-----------|
| Password length | 6 chars ✅ | Unlimited | 5 chars ❌ | N/A |
| Ward beds (add) | 1 ✅ | No limit | 0 ❌ (UI blocks) | N/A |
| Ward beds (remove) | 0 ✅ (disabled) | Current total | -1 ❌ | N/A |
| Appointment minute | 0, 15, 30, 45 ✅ | 45 ✅ | 1 ❌ | 59 ❌ |
| Shift boundary start | shift_start ✅ | shift_end ✅ | shift_start - 1 ❌ | shift_end + 1 ❌ |

---

## 9. Decision Table — Role Access Permissions

| Feature | Admin | Doctor | Receptionist | Nurse | Patient | Wardboy |
|---------|:-----:|:------:|:------------:|:-----:|:-------:|:-------:|
| View Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manage Users (`/users`) | ✅ | ✅* | ❌ | ❌ | ❌ | ❌ |
| Add/Edit Wards | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Add Departments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View All Appointments | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| View Own Appointments | — | ✅ | — | — | ✅ | — |
| Book Appointments | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve/Reject Appointments | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approve/Reject Applications | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Wardboy Tasks | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Complete Own Tasks | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| View Task History | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

> *Doctors can access `/users` but cannot create Admin accounts or delete users.

---

## 10. Environment & Deployment

### Local Setup
```bash
git clone https://github.com/musman2403/caresphere.git
cd caresphere
npm install
npm run dev         # Starts Vite dev server on http://localhost:5173
```

### Environment Variables (`.env`)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

### Production Build
```bash
npm run build       # Outputs to /dist
npm run preview     # Preview production build locally
```

### Vercel Deployment
The `vercel.json` file includes SPA rewrite rules:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 11. SQL Scripts Reference

| Script | Purpose |
|--------|---------|
| `database_schema.sql` | Creates all core tables + seeds departments and wards |
| `create_wardboy_tasks.sql` | Creates WardBoyTasks table |
| `setup_wardboy_tasks.sql` | Combined: Creates table + disables RLS + enables Realtime |
| `fix_rls_policies.sql` | Configures Row Level Security policies for all tables |
| `seed_data.sql` | Seeds sample data for development/testing |
| `make_admin.sql` | Promotes a user to admin role |
| `update_doctor_shifts.sql` | Sets default shift times for doctors |
| `update_all_staff_shifts.sql` | Adds shift columns to all staff tables |

---
