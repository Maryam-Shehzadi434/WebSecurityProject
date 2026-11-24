// db-setup.js
// Creates database.db from seed-data.sql. Run this ONCE before starting the app:
//     node db-setup.js
const { DatabaseSync } = require('node:sqlite'); // SQLite is built into Node (v22+)
const fs = require('fs');

// Delete any old database so we always start fresh
if (fs.existsSync('./database.db')) fs.unlinkSync('./database.db');

// Create the database file and run all the SQL from seed-data.sql
const db = new DatabaseSync('./database.db');
const sql = fs.readFileSync('./seed-data.sql', 'utf8');
db.exec(sql);

console.log('Database created: database.db (users + comments seeded)');
db.close();
