const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function init() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../backend/src/data/init.sql'), 'utf8');
        await pool.query(sql);
        console.log('Database clinic_db initialized with tables.');
        
        // Add the superuser requested by user
        const passHash = '$12a$10$P2N5Z3u1QoD2r4k4z1o5Z.q4r1eH2Xk7k7eJ8pK6H8w9zZ4y1X3.G'; // password123
        await pool.query(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
            ['musinovmuhammaader@gmail.com', passHash, 'Muhammad Musinov', 'ADMINISTRATOR']
        );
        console.log('Superuser added to clinic_db.');

    } catch (err) {
        console.error('Initialization error:', err.message);
    } finally {
        await pool.end();
    }
}

init();
