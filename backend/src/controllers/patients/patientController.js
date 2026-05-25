const db = require('../../data/db');
const { generatePatientId } = require('../../utils/generateid');

exports.getAllPatients = async (req, res) => {
    try {
        const { search, department, doctor_id, treatment } = req.query;
        let query = `
            SELECT p.*, u.name as doctor_name, u.department 
            FROM patients p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (search) {
            query += ` AND (p.name ILIKE $${idx} OR p.patient_no ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }
        if (department) {
            query += ` AND u.department = $${idx++}`;
            params.push(department);
        }
        if (doctor_id) {
            query += ` AND p.doctor_id = $${idx++}`;
            params.push(doctor_id);
        }
        if (treatment) {
            query += ` AND p.treatment ILIKE $${idx++}`;
            params.push(`%${treatment}%`);
        }

        query += ' ORDER BY p.created_at DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching patients' });
    }
};

exports.getPatientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM patients WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching patient' });
    }
};

exports.getPatientProfile = async (req, res) => {
    try {
        const { id } = req.params;

        const patientQuery = `
            SELECT p.*, u.name as doctor_name, u.department, d.specialty as doctor_specialty, d.phone as doctor_phone
            FROM patients p
            LEFT JOIN doctors d ON p.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE p.id = $1
        `;
        const patientResult = await db.query(patientQuery, [id]);

        if (patientResult.rows.length === 0) {
            return res.status(404).json({ message: 'Patient not found' });
        }

        const patient = patientResult.rows[0];
        const diagResult = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = $1 ORDER BY date_recorded DESC',
            [id]
        );
        const refResult = await db.query(
            `SELECT r.*, u.name as referred_by_name FROM referrals r
             LEFT JOIN users u ON r.referred_by = u.id
             WHERE r.patient_id = $1 ORDER BY r.created_at DESC`,
            [id]
        );

        res.json({
            ...patient,
            diagnoses: diagResult.rows,
            referrals: refResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching patient profile' });
    }
};

exports.getPatientDiagnosisReport = async (req, res) => {
    try {
        const { id } = req.params;
        const profile = await exports.getPatientProfileData(id);
        if (!profile) return res.status(404).json({ message: 'Patient not found' });
        res.json({
            generatedAt: new Date().toISOString(),
            clinic: 'CareTrack Clinic',
            patient: {
                id: profile.patient_no,
                name: profile.name,
                ward: profile.ward_no,
                admitted: profile.date_of_admit,
                treatment: profile.treatment
            },
            assignedDoctor: {
                name: profile.doctor_name,
                department: profile.department,
                specialty: profile.doctor_specialty
            },
            diagnoses: profile.diagnoses,
            summary: {
                totalDiagnoses: profile.diagnoses.length,
                severeCount: profile.diagnoses.filter(d => d.severity === 'Severe' || d.severity === 'Critical').length
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error generating report' });
    }
};

exports.getPatientProfileData = async (id) => {
    const patientResult = await db.query(`
        SELECT p.*, u.name as doctor_name, u.department, d.specialty as doctor_specialty
        FROM patients p
        LEFT JOIN doctors d ON p.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        WHERE p.id = $1
    `, [id]);
    if (patientResult.rows.length === 0) return null;
    const patient = patientResult.rows[0];
    const diagResult = await db.query(
        'SELECT * FROM diagnoses WHERE patient_id = $1 ORDER BY date_recorded DESC',
        [id]
    );
    return { ...patient, diagnoses: diagResult.rows };
};

exports.createPatient = async (req, res) => {
    try {
        const { name, date_of_admit, treatment, ward_no, doctor_id } = req.body;
        const patientNo = generatePatientId();

        const result = await db.query(
            'INSERT INTO patients (patient_no, name, date_of_admit, treatment, ward_no, doctor_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [patientNo, name, date_of_admit, treatment || 'Ongoing', ward_no, doctor_id || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating patient' });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, treatment, ward_no, doctor_id, date_of_admit } = req.body;
        const result = await db.query(
            `UPDATE patients SET name = $1, treatment = $2, ward_no = $3, doctor_id = $4,
             date_of_admit = COALESCE($5, date_of_admit) WHERE id = $6 RETURNING *`,
            [name, treatment, ward_no, doctor_id, date_of_admit, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating patient' });
    }
};

exports.deletePatient = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM patients WHERE id = $1', [id]);
        res.json({ message: 'Patient deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting patient' });
    }
};
