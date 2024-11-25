// db.js
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./expenses.db'); // Your database file path

// Create the members table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT
)`);

// Function to fetch members from the database
function getAllMembers(callback) {
    db.all('SELECT * FROM members', [], (err, rows) => {
        if (err) {
            console.error("Error fetching members:", err);
            callback(err, null);
        } else {
            callback(null, rows);  // Pass members to callback
        }
    });
}

module.exports = { db, getAllMembers };
