const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function run() {
    const hash = await bcrypt.hash('password123', 10);
    await pool.query(
        `UPDATE users SET password_hash = $1 WHERE email IN ('admin@caretrack.clinic', 'musinovmuhammaader@gmail.com')`,
        [hash]
    );
    console.log('Admin passwords reset to: password123');
    await pool.end();
}

run();
