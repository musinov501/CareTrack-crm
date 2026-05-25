const db = require('../../data/db');

exports.getAllReferrals = async (req, res) => {
    try {
        const { status, department, search } = req.query;
        let query = `
            SELECT r.*, p.name as patient_name, p.patient_no, u.name as referred_by_name
            FROM referrals r
            JOIN patients p ON r.patient_id = p.id
            LEFT JOIN users u ON r.referred_by = u.id
            WHERE 1=1
        `;
        const params = [];
        let idx = 1;

        if (status) {
            query += ` AND r.status = $${idx++}`;
            params.push(status);
        }
        if (department) {
            query += ` AND (r.from_department ILIKE $${idx} OR r.to_department ILIKE $${idx})`;
            params.push(`%${department}%`);
            idx++;
        }
        if (search) {
            query += ` AND (p.name ILIKE $${idx} OR p.patient_no ILIKE $${idx} OR r.reason ILIKE $${idx})`;
            params.push(`%${search}%`);
            idx++;
        }

        query += ' ORDER BY r.created_at DESC';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching referrals' });
    }
};

exports.createReferral = async (req, res) => {
    try {
        const { patient_id, from_department, to_department, reason, status } = req.body;
        const result = await db.query(
            `INSERT INTO referrals (patient_id, from_department, to_department, reason, status, referred_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [patient_id, from_department, to_department, reason, status || 'Pending', req.user.id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error creating referral' });
    }
};

exports.updateReferral = async (req, res) => {
    try {
        const { id } = req.params;
        const { from_department, to_department, reason, status } = req.body;
        const result = await db.query(
            `UPDATE referrals SET from_department = $1, to_department = $2, reason = $3, status = $4
             WHERE id = $5 RETURNING *`,
            [from_department, to_department, reason, status, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Referral not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating referral' });
    }
};

exports.deleteReferral = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM referrals WHERE id = $1', [id]);
        res.json({ message: 'Referral deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error deleting referral' });
    }
};

exports.getReferralsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const result = await db.query(
            'SELECT * FROM referrals WHERE patient_id = $1 ORDER BY created_at DESC',
            [patientId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error fetching patient referrals' });
    }
};
