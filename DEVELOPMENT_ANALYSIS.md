# Activity 4: MRMS Development, Testing, and Optimization Analysis

This document provides a comprehensive descriptive analysis of the CareTrack Medical Record Management System (MRMS) development process, implementation details, and optimizations, aligned with the assignment criteria (C.P4, C.P5, C.M3).

---

## 4.1 Development Process: Tools, Technologies, and Environment Setup

The CareTrack MRMS follows a modern Full-Stack architecture designed for scalability, security, and performance.

### **Technologies Used:**
- **Backend**: Node.js with Express.js (RESTful API architecture).
- **Database**: PostgreSQL (Relational database for ACID compliance).
- **Authentication**: JWT (JSON Web Tokens) for stateless session management.
- **Security**: Bcrypt.js for one-way password hashing.
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, and CSS3 for high-performance UI without heavy framework overhead.
- **Data Visualization**: Chart.js for real-time clinical analytics.

### **Environment Setup:**
- **Project Structure**: Organized into `backend/src` (controllers, routes, middleware, data) and `frontend` (modularized by feature).
- **Configuration**: Uses `.env` for securing sensitive keys like `DATABASE_URL` and `JWT_SECRET`.
- **Package Management**: Managed via `NPM` with scripts for development (`npm run dev`) and production (`npm start`).
- **Database Initialization**: Automated via `init.sql` and seeding scripts to ensure a consistent environment across different developer machines.

---

## 4.2 Implementation of Core CRUD Operations and Relational Data Linking (C.P4)

We implemented a robust system to handle clinical records, ensuring data integrity through strictly defined relationships.

### **Core CRUD Operations:**
- **Doctors**: Full life-cycle management. Creating a doctor involves a **SQL Transaction** that creates a base `User` record (for login) and a linked `Doctor` profile simultaneously.
- **Patients**: Registration system with unique ID generation (`patient_no`). Supports updating medical status and ward assignments.
- **Diagnoses**: Implementation of clinical records linked to patients using **ICD-10 standards** (via codes and descriptions).
- **Referrals**: A specialized module for inter-departmental transfers, tracking status from 'Pending' to 'Completed'.

### **Relational Data Linking:**
The system utilizes a 1:N and 1:1 relational model enforced by PostgreSQL foreign keys:
- **Users ↔ Doctors (1:1)**: Every doctor is a user, linked via `user_id`.
- **Doctors ↔ Patients (1:N)**: Each patient is assigned to a primary clinician via `doctor_id`.
- **Patients ↔ Diagnoses (1:N)**: A patient can have multiple historical diagnoses linked via `patient_id`.
- **Users ↔ Referrals (1:1)**: Tracks which staff member initiated a transfer via `referred_by`.

---

## 4.3 Security Implementation: Role-Based Access Control (RBAC) (C.P5)

Security is at the core of CareTrack, ensuring that sensitive medical data is only accessible to authorized personnel.

### **Implementation Details:**
- **JWT Protection**: Every API request (except login/register) requires a valid Bearer Token in the authorization header.
- **RBAC Middleware**: A custom `authorize(...roles)` middleware intercepts requests and checks the user's role extracted from the JWT.
- **Defined Roles**:
    - `ADMINISTRATOR`: Full access to the system, including deleting records and managing system settings.
    - `CLINICIAN`: Focused on clinical data. Can view and update patients/diagnoses but cannot manage system users or delete records.
    - `RECEPTIONIST`: Optimized for patient flow. Can register new patients and view doctor availability but has no access to sensitive diagnosis details.
- **UI Side Security**: The frontend dynamically hides or shows buttons (like "Add Doctor" or "Delete Patient") based on the logged-in user's role.

---

## 4.4 Comprehensive Testing: Functionality, Compatibility, and Usability

We performed multi-layered testing to ensure the system meets clinical standards.

### **Functionality Testing**: 
- Verified that deleting a user also cleans up linked doctor records (Cascade Delete).
- Validated that unauthorized roles (e.g., Receptionists) receive a `403 Forbidden` error when trying to access clinical diagnosis APIs.
- Tested search and filter logic with complex queries (e.g., searching for "Hypertension" in a database of thousands of records).

### **Compatibility & Usability**:
- **Cross-Browser Styling**: Used Vanilla CSS with modern flexbox/grid layouts to ensure consistent display across Chrome, Firefox, and Safari.
- **Responsiveness**: The UI is fully responsive, allowing doctors to view patient charts on tablets or mobile devices during rounds.
- **Visual Feedback**: Implemented real-time validation for forms and premium toast notifications for successful actions.

---

## 4.5 Optimization Results: ‘Before’ vs. ‘After’ System Evolution (C.M3)

The system underwent significant optimization to improve performance and developer experience.

### **Evolutionary Improvements:**
1. **Query Optimization**: 
   - *Before*: Dashboard metrics required multiple separate queries. 
   - *After*: Implemented PostgreSQL's `generate_series` for admissions trends, allowing a single query to populate 30 days of data with zero-fill for inactive days.
2. **Data Integrity**: 
   - *Before*: Potential for "orphan" user records if the doctor creation failed.
   - *After*: Implemented **ACID-compliant SQL Transactions** (`BEGIN/COMMIT`) in the `doctorController`, ensuring no partial data is saved.
3. **Frontend Efficiency**: 
   - *Before*: Page reloads for every action.
   - *After*: Transitioned to a **Single Page-like interaction** model using asynchronous `fetch()` calls, dramatically reducing perceived latency.
4. **Security Hardening**:
   - Implemented email normalization (trimming/lowercase) and strict role validation to prevent privilege escalation during registration.

---
**Conclusion**: The CareTrack MRMS successfully covers all requirements for Activity 4, providing a secure, optimized, and fully relational medical management platform.
