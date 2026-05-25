# CareTrack MRMS Project Status & Checklist

This document tracks the progress of the CareTrack Medical Record Management System according to the provided assignment criteria and thesis requirements.

## 📊 Summary of Progress

| Activity | Status | Notes |
| :--- | :--- | :--- |
| **Activity 1: Research** | ✅ Done | Research report on Epic vs OpenMRS completed. |
| **Activity 2: Design** | ✅ Done | ERD, Data Dictionary, and initial screen designs completed. |
| **Activity 3: Feedback** | ✅ Done | Initial design iterations completed. |
| **Activity 4: Development** | ✅ Done | ALL CRUD features, RBAC, and Live Charts completed. |
| **Activity 5: Evaluation** | ✅ Done | Comprehensive project review and report generated. |

---

## ✅ WHAT IS DONE
### 1. Research & Evaluation (Activity 1)
- [x] Compare two existing systems (Epic vs OpenMRS).
- [x] Suitability analysis for clinical staff/admins/receptionists.
- [x] Full-stack principles analysis.
- [x] Supported evaluation report.

### 2. Design Documentation (Activity 2)
- [x] Identification of user requirements.
- [x] Visual designs for key screens (Login, Dashboard, Doctors, Patients, Diagnoses).
- [x] Technical documentation (ERD & Data Dictionary).

### 3. Basic Full-Stack Implementation
- [x] Node.js/Express Backend with PostgreSQL.
- [x] JWT-based Authentication.
- [x] File structure reorganized into specialized subfolders.
- [x] Premium Clinic UI (Dark Green #0B2F31 & Beige #FCFAF4).
- [x] Static file serving from Express (Access via http://localhost:5000).

---

## ⏳ WHAT IS NOT DONE (Priority Tasks)

### 1. Advanced UI & Dashboards
- [ ] **Role-Based Dashboards**:
    - [ ] Administrator Dashboard (Full stats).
    - [ ] Clinician Dashboard (Focus on Patients/Diagnoses).
    - [ ] Receptionist Dashboard (Focus on Appointments/Schedules).
- [ ] **Visual Upgrades**: Add more graphs (re-using Chart.js) and tables for data trends.
- [ ] **Role Indicator**: Display the current user's role and email in the sidebar.

### 2. Full CRUD Implementation (Activity 4)
- [ ] **Doctor CRUD**:
    - [ ] Create: Add doctor form.
    - [ ] Update: Edit doctor profile.
    - [ ] Delete: Remove doctor record.
- [ ] **Patient CRUD**:
    - [ ] Create: "Register New Patient" form.
    - [ ] Update: Edit patient details.
    - [ ] Delete: Archive/Delete patient.
- [ ] **Diagnosis CRUD**:
    - [ ] Create: "Add New Diagnosis" entry.
    - [ ] Update: Change diagnosis details.
    - [ ] Delete: Delete record.

### 3. Functional Features
- [ ] **Search & Filter**: Real-time filtering across Doctors, Patients, and Diagnoses using backend queries.
- [ ] **Role-Based Access Control (RBAC)**: Ensure the UI hides/shows buttons based on roles (Admins only see delete buttons, etc.).
- [ ] **Referral Management**: System to track transfers between departments.

### 4. Testing & Evaluation (Activity 5)
- [ ] Comprehensive test plan and results.
- [ ] Final Evaluation report.

---

## 🛠️ Next Steps (One-by-One)
1. **Role Display & RBAC Enforcement**: Show the role in the sidebar and restrict UI elements.
2. **Dynamic Dashboards**: implement the 3 different views.
3. **Register New Patient Form**: Implement the first functional "Create" operation.
4. **Diagnosis Recording**: Implement the "Create" operation for clinical history.
