# CareTrack MRMS — Assignment Coverage (Activity 4)

## Implemented & working

| Requirement | Status |
|---|---|
| Doctor CRUD (name, specialty, dept, contact) | ✅ |
| Patient CRUD + assigned doctor | ✅ |
| Diagnosis CRUD (ICD, description, severity, patient) | ✅ |
| Full patient profile (doctor + diagnoses + referrals) | ✅ |
| Doctor profile page (click card) | ✅ |
| Search & filter (doctors, patients, diagnoses, referrals) | ✅ |
| RBAC — Administrator (full) | ✅ |
| RBAC — Clinician (patients + diagnoses only) | ✅ |
| RBAC — Receptionist (register patients + doctor schedules) | ✅ |
| Referral management | ✅ |
| Diagnosis report (print from patient profile) | ✅ |
| Dashboard stats & charts (role-aware) | ✅ |
| Admin system settings page | ✅ |
| After-hours emergency contact (sidebar) | ✅ |
| Login / register (email normalised, auto-login after register) | ✅ |

## For written submission (Activities 1–3, 5)

Still required as **documents/screenshots** (not code): research report, wireframes/ERD, design feedback, test plan & results, evaluation, client report.

## Run

```bash
npm run dev
# http://localhost:5000
node scripts/fix_admin_password.js   # if login fails for seeded admin
```

Demo: `musinovmuhammaader@gmail.com` / `password123` or register a new account.
