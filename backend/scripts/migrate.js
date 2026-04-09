const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function migrate() {
  try {
    const connection = await pool.getConnection();
    console.log('Starting database migration...');

    // Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement) {
        await connection.query(statement);
      }
    }

    connection.release();
    console.log('✅ Database migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migrate();

