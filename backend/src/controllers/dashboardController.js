const db = require('../data/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const role = req.user?.role;

        const doctorsCount = await db.query('SELECT COUNT(*) FROM doctors');
        const patientsCount = await db.query('SELECT COUNT(*) FROM patients');
        const diagnosesCount = await db.query('SELECT COUNT(*) FROM diagnoses');
        const referralsCount = await db.query("SELECT COUNT(*) FROM referrals WHERE status IN ('Pending', 'In Progress')");
        const availableDoctors = await db.query("SELECT COUNT(*) FROM doctors WHERE status = 'Available'");

        const recentPatients = await db.query(`
            SELECT p.*, u.name as doctor_name 
            FROM patients p 
            LEFT JOIN doctors d ON p.doctor_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id 
            ORDER BY p.created_at DESC LIMIT 5
        `);

        const recentDiagnoses = await db.query(`
            SELECT d.*, p.name as patient_name 
            FROM diagnoses d 
            JOIN patients p ON d.patient_id = p.id 
            ORDER BY d.date_recorded DESC LIMIT 5
        `);

        const severityDist = await db.query(`
            SELECT severity, COUNT(*)::int as count 
            FROM diagnoses 
            GROUP BY severity
        `);

        const deptDist = await db.query(`
            SELECT u.department, COUNT(d.id)::int as count
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            GROUP BY u.department
            ORDER BY count DESC
        `);

        // Generate a full 30-day series with zero-fill for days without registrations
        const admissionsTrend = await db.query(`
            SELECT
                gs.day::date AS day,
                COALESCE(COUNT(p.id)::int, 0) AS count
            FROM
                generate_series(
                    (NOW() - INTERVAL '29 days')::date,
                    NOW()::date,
                    '1 day'::interval
                ) AS gs(day)
            LEFT JOIN patients p
                ON DATE(p.date_of_admit) = gs.day::date
            GROUP BY gs.day
            ORDER BY gs.day ASC
        `);

        const doctorStatus = await db.query(`
            SELECT status, COUNT(*)::int as count FROM doctors GROUP BY status
        `);

        const pendingReferrals = await db.query(`
            SELECT r.*, p.name as patient_name, p.patient_no
            FROM referrals r
            JOIN patients p ON r.patient_id = p.id
            WHERE r.status IN ('Pending', 'In Progress')
            ORDER BY r.created_at DESC LIMIT 5
        `);

        const payload = {
            role,
            stats: {
                doctors: parseInt(doctorsCount.rows[0].count, 10),
                patients: parseInt(patientsCount.rows[0].count, 10),
                diagnoses: parseInt(diagnosesCount.rows[0].count, 10),
                referrals: parseInt(referralsCount.rows[0]?.count || 0, 10),
                availableDoctors: parseInt(availableDoctors.rows[0].count, 10)
            },
            recentPatients: recentPatients.rows,
            recentDiagnoses: recentDiagnoses.rows,
            severityDist: severityDist.rows,
            deptDist: deptDist.rows,
            admissionsTrend: admissionsTrend.rows,
            doctorStatus: doctorStatus.rows,
            pendingReferrals: pendingReferrals.rows
        };

        if (role === 'CLINICIAN') {
            delete payload.stats.doctors;
            delete payload.deptDist;
            delete payload.doctorStatus;
        } else if (role === 'RECEPTIONIST') {
            delete payload.stats.diagnoses;
            delete payload.severityDist;
            delete payload.recentDiagnoses;
        }

        res.json(payload);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching stats' });
    }
};
