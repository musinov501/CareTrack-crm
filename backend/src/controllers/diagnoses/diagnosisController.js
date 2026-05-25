const db = require('../../data/db');

exports.getAllDiagnoses = async (req, res) => {
    try {
        const { search, severity, patient_id } = req.query;
        let query = `
            SELECT d.*, p.name as patient_name, p.patient_no 
            FROM diagnoses d
            JOIN patients p ON d.patient_id = p.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (search) {
            query += ` AND (d.description ILIKE $${idx} OR d.icd_code ILIKE $${idx} OR p.name ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }
        if (severity) {
            query += ` AND d.severity = $${idx++}`;
            params.push(severity);
        }
        if (patient_id) {
            query += ` AND d.patient_id = $${idx++}`;
            params.push(patient_id);
        }

        query += ' ORDER BY d.date_recorded DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching diagnoses' });
    }
};

exports.getDiagnosesByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = $1 ORDER BY date_recorded DESC',
            [patientId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching patient diagnoses' });
    }
};

exports.createDiagnosis = async (req, res) => {
    try {
        const { icd_code, description, severity, patient_id } = req.body;
        const result = await db.query(
            'INSERT INTO diagnoses (icd_code, description, severity, patient_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [icd_code, description, severity, patient_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating diagnosis' });
    }
};

exports.updateDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        const { icd_code, description, severity, patient_id } = req.body;
        const result = await db.query(
            'UPDATE diagnoses SET icd_code = $1, description = $2, severity = $3, patient_id = $4 WHERE id = $5 RETURNING *',
            [icd_code, description, severity, patient_id, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Diagnosis not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating diagnosis' });
    }
};

exports.deleteDiagnosis = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM diagnoses WHERE id = $1', [id]);
        res.json({ message: 'Diagnosis deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting diagnosis' });
    }
};
