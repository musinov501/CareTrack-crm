const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:qwerty@localhost:5432/clinic_db'
});

async function run() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../backend/src/data/migrations.sql'), 'utf8');
        await pool.query(sql);
        console.log('Migrations applied successfully.');
    } catch (err) {
        console.error('Migration error:', err.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

run();
