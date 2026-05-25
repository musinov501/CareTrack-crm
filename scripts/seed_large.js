const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function seed() {
    try {
        console.log('Starting seed process...');
        const salt = await bcrypt.genSalt(10);
        const passHash = await bcrypt.hash('password123', salt);

        // 1. Clear existing data
        await pool.query('TRUNCATE users, doctors, patients, diagnoses RESTART IDENTITY CASCADE');

        // 2. Add Superuser
        await pool.query(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)",
            ['musinovmuhammaader@gmail.com', passHash, 'Muhammad Musinov', 'ADMINISTRATOR']
        );

        // 3. Add 20 Doctors
        const specialties = ['Cardiology', 'Neurology', 'Dermatology', 'Orthopaedics', 'Pediatrics'];
        for (let i = 1; i <= 20; i++) {
            const name = `Dr. Specialist ${i}`;
            const email = `doctor${i}@caretrack.clinic`;
            const dept = specialties[i % specialties.length];
            
            const userRes = await pool.query(
                "INSERT INTO users (email, password_hash, name, role, department) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                [email, passHash, name, 'CLINICIAN', dept]
            );
            
            await pool.query(
                "INSERT INTO doctors (user_id, specialty, experience, status) VALUES ($1, $2, $3, $4)",
                [userRes.rows[0].id, dept, (i % 10) + 2, 'Available']
            );
        }
        console.log('20 Doctors seeded.');

        // 4. Add 20 Patients — spread across the last 30 days for realistic graph data
        const docIds = (await pool.query('SELECT id FROM doctors')).rows.map(r => r.id);
        for (let i = 1; i <= 20; i++) {
            const name = `Patient ${i}`;
            const pNo = `PAT-${String(i).padStart(5, '0')}`;
            const docId = docIds[i % docIds.length];

            // Random day offset between 0 (today) and 29 days ago
            const daysAgo = Math.floor(Math.random() * 30);
            const admitDate = new Date();
            admitDate.setDate(admitDate.getDate() - daysAgo);
            const admitStr = admitDate.toISOString().substring(0, 10); // "YYYY-MM-DD"

            await pool.query(
                "INSERT INTO patients (patient_no, name, date_of_admit, treatment, ward_no, doctor_id) VALUES ($1, $2, $3, $4, $5, $6)",
                [pNo, name, admitStr, 'Ongoing', `B${100 + i}`, docId]
            );
        }
        console.log('20 Patients seeded.');

        // 5. Add 20 Diagnoses
        const patientIds = (await pool.query('SELECT id FROM patients')).rows.map(r => r.id);
        const codes = ['I10', 'E78.5', 'G43.9', 'L40.0', 'M17.1', 'J45.9', 'K21.9', 'N39.0'];
        const severities = ['Mild', 'Moderate', 'Severe'];
        
        for (let i = 0; i < 20; i++) {
            const pId = patientIds[i];
            await pool.query(
                "INSERT INTO diagnoses (icd_code, description, severity, patient_id) VALUES ($1, $2, $3, $4)",
                [codes[i % codes.length], `Diagnosis Detail ${i + 1}`, severities[i % severities.length], pId]
            );
        }
        console.log('20 Diagnoses seeded.');

        console.log('Full dataset successfully seeded into clinic_db!');
    } catch (err) {
        console.error('Seed error:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
