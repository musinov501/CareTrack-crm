const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString || connectionString.includes('localhost')) {
        console.error('❌ Error: Please provide a valid EXTERNAL DATABASE_URL.');
        console.log('Example: $env:DATABASE_URL="postgres://user:pass@host/db"; node migrate.js');
        process.exit(1);
    }

    console.log('⏳ Connecting to Render database...');
    const pool = new Pool({ 
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Render/external connections
    });

    try {
        const sqlPath = path.join(__dirname, 'backend', 'src', 'data', 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('🚀 Running init.sql...');
        await pool.query(sql);
        console.log('✅ Success! Tables created successfully.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
