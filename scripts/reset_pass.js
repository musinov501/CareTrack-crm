const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function reset() {
    try {
        const hash = await bcrypt.hash('password123', 10);
        const result = await pool.query(
            "UPDATE users SET password_hash = $1 WHERE email = $2",
            [hash, 'musinovmuhammaader@gmail.com']
        );
        console.log('Password hash successfully reset for superuser.');
    } catch (err) {
        console.error('Reset error:', err.message);
    } finally {
        await pool.end();
    }
}

reset();
