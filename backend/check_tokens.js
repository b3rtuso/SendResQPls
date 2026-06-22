const { Pool } = require('pg');
require('dotenv/config');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(`SELECT id, name, role, "pushToken" IS NOT NULL as has_token, LEFT("pushToken", 30) as token_preview FROM "User" ORDER BY role`)
  .then(r => { console.log(JSON.stringify(r.rows, null, 2)); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
