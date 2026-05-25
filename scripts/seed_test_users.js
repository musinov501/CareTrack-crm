const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function seed() {
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('password123', salt);

    const users = [
        ['clinician@caretrack.clinic', 'Dr. Jane Clinician', 'CLINICIAN', 'Cardiology'],
        ['reception@caretrack.clinic', 'Sarah Reception', 'RECEPTIONIST', 'General Practice']
    ];

    for (const [email, name, role, dept] of users) {
        await pool.query(
            `INSERT INTO users (email, password_hash, name, role, department)
             VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = $4`,
            [email, passHash, name, role, dept]
        );
        console.log(`Upserted ${role}: ${email} / password123`);
    }
    await pool.end();
}

seed();
