const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:postgres@localhost:5432/postgres' });
const email = 'musinovmuhammaader@gmail.com';
const passHash = '$12a$10$P2N5Z3u1QoD2r4k4z1o5Z.q4r1eH2Xk7k7eJ8pK6H8w9zZ4y1X3.G'; // password123

async function addSuperuser() {
    try {
        await pool.query(
            "INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING",
            [email, passHash, 'Muhammad Musinov', 'ADMINISTRATOR']
        );
        console.log('Superuser added successfully');
    } catch (err) {
        console.error('Error adding superuser:', err.message);
    } finally {
        await pool.end();
    }
}

addSuperuser();
