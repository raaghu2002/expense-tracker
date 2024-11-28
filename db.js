// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./expenses.db'); // Database file path

// Create or update the expenses table
db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paid_by TEXT,               -- Column: who paid
    category TEXT,
    amount REAL,
    date TEXT,
    included_members TEXT       -- Column: members sharing the expense
)`);

module.exports = { db };
