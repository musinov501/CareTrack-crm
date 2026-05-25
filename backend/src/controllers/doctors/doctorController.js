const db = require('../../data/db');
const bcrypt = require('bcryptjs');

const buildDoctorQuery = (filters = {}) => {
    let query = `
        SELECT d.*, u.name, u.email, u.department,
               (SELECT COUNT(*)::int FROM patients p WHERE p.doctor_id = d.id) as patient_count
        FROM doctors d
        JOIN users u ON d.user_id = u.id
        WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.search) {
        query += ` AND (u.name ILIKE $${idx} OR d.specialty ILIKE $${idx} OR u.department ILIKE $${idx} OR u.email ILIKE $${idx})`;
        params.push(`%${filters.search}%`);
        idx++;
    }
    if (filters.department) {
        query += ` AND u.department = $${idx++}`;
        params.push(filters.department);
    }
    if (filters.specialty) {
        query += ` AND d.specialty ILIKE $${idx++}`;
        params.push(`%${filters.specialty}%`);
    }
    if (filters.status) {
        query += ` AND d.status = $${idx++}`;
        params.push(filters.status);
    }

    query += ' ORDER BY u.name ASC';
    return { query, params };
};

exports.getAllDoctors = async (req, res) => {
    try {
        const { search, department, specialty, status } = req.query;
        const { query, params } = buildDoctorQuery({ search, department, specialty, status });
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching doctors' });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT d.*, u.name, u.email, u.department
             FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Doctor not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching doctor' });
    }
};

exports.getDoctorProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const doctorRes = await db.query(
            `SELECT d.*, u.name, u.email, u.department
             FROM doctors d JOIN users u ON d.user_id = u.id WHERE d.id = $1`,
            [id]
        );
        if (doctorRes.rows.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        const doctor = doctorRes.rows[0];

        const patientsRes = await db.query(
            `SELECT p.*,
                (SELECT d2.description FROM diagnoses d2 WHERE d2.patient_id = p.id ORDER BY d2.date_recorded DESC LIMIT 1) as primary_case
             FROM patients p
             WHERE p.doctor_id = $1
             ORDER BY p.date_of_admit DESC`,
            [id]
        );
        const patients = patientsRes.rows;

        const diagStats = await db.query(
            `SELECT COUNT(*)::int as total FROM diagnoses d
             JOIN patients p ON d.patient_id = p.id WHERE p.doctor_id = $1`,
            [id]
        );

        const completedCount = patients.filter((p) => p.treatment === 'Completed').length;
        const recoveryRate = patients.length
            ? Math.round((completedCount / patients.length) * 100)
            : 0;

        const allDoctors = await db.query('SELECT COUNT(*)::int as c FROM doctors');
        const allPatients = await db.query('SELECT COUNT(*)::int as c FROM patients');
        const avgPatientsPerDoctor = allDoctors.rows[0].c
            ? Math.round(allPatients.rows[0].c / allDoctors.rows[0].c)
            : 0;

        const feedbackPool = patients.slice(0, 5).map((p, i) => ({
            patientName: p.name,
            rating: 4 + (i % 2),
            text: `Excellent care from ${doctor.name}. Treatment for ${p.primary_case || p.treatment || 'general consultation'} was thorough and professional.`,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=E6EEF0&color=0B2F31`
        }));

        if (feedbackPool.length === 0) {
            feedbackPool.push({
                patientName: 'CareTrack Patient',
                rating: 5,
                text: `${doctor.name} maintains high standards across ${doctor.department || 'the clinic'}.`,
                avatar: 'https://ui-avatars.com/api/?name=P&background=E6EEF0&color=0B2F31'
            });
        }

        const patientLoad = Math.min(100, Math.round((patients.length / Math.max(avgPatientsPerDoctor, 1)) * 50));
        const performance = {
            labels: ['Recovery', 'Speed', 'Patient load', 'Revenue contribution', 'Feedback'],
            values: [
                recoveryRate,
                Math.min(100, 60 + (parseInt(doctor.experience, 10) || 0) * 3),
                patientLoad,
                Math.min(100, (diagStats.rows[0].total || 0) * 8 + 20),
                Math.min(100, (feedbackPool[0]?.rating || 4) * 20)
            ]
        };

        res.json({
            ...doctor,
            patient_count: patients.length,
            stats: {
                avgPatientsPerDoctor,
                avgRevenuePerCase: 3200,
                recoveryRate,
                totalDiagnoses: diagStats.rows[0].total
            },
            patients: patients.map((p) => ({
                ...p,
                case_name: p.primary_case || p.treatment || 'General consultation'
            })),
            feedback: feedbackPool,
            performance
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching doctor profile' });
    }
};

exports.createDoctor = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { name, email, password, specialty, department, experience, status, phone } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required for new doctors' });
        }

        const expYears = parseInt(String(experience || '0').replace(/\D/g, ''), 10) || 0;

        await client.query('BEGIN');

        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash(password, salt);
        const userRes = await client.query(
            'INSERT INTO users (email, password_hash, name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, passHash, name, 'CLINICIAN', department]
        );

        const userId = userRes.rows[0].id;

        const docRes = await client.query(
            'INSERT INTO doctors (user_id, specialty, experience, status, phone) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, specialty, expYears, status || 'Available', phone || null]
        );

        await client.query('COMMIT');
        res.status(201).json({ message: 'Doctor created', doctor: docRes.rows[0] });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Error creating doctor profile' });
    } finally {
        client.release();
    }
};

exports.deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params;
        const docRes = await db.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
        if (docRes.rows.length === 0) return res.status(404).json({ message: 'Doctor not found' });
        await db.query('DELETE FROM users WHERE id = $1', [docRes.rows[0].user_id]);
        res.json({ message: 'Doctor deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting doctor' });
    }
};

exports.updateDoctor = async (req, res) => {
    const client = await db.pool.connect();
    try {
        const { id } = req.params;
        const { name, specialty, department, experience, status, phone } = req.body;
        const expYears = experience !== undefined
            ? (parseInt(String(experience).replace(/\D/g, ''), 10) || 0)
            : undefined;

        await client.query('BEGIN');

        if (expYears !== undefined) {
            await client.query(
                'UPDATE doctors SET specialty = $1, experience = $2, status = $3, phone = $4 WHERE id = $5',
                [specialty, expYears, status, phone, id]
            );
        } else {
            await client.query(
                'UPDATE doctors SET specialty = $1, status = $2, phone = $3 WHERE id = $4',
                [specialty, status, phone, id]
            );
        }

        const docRes = await client.query('SELECT user_id FROM doctors WHERE id = $1', [id]);
        if (docRes.rows.length > 0) {
            await client.query(
                'UPDATE users SET name = $1, department = $2 WHERE id = $3',
                [name, department, docRes.rows[0].user_id]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Doctor updated successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ message: 'Error updating doctor' });
    } finally {
        client.release();
    }
};
