const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'parking.db');

// Initialize database
function initDatabase() {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                createTables(db).then(() => resolve(db)).catch(reject);
            }
        });
    });
}

// Create tables
function createTables(db) {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Parking slots table
            db.run(`CREATE TABLE IF NOT EXISTS parking_slots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                slot_number INTEGER UNIQUE NOT NULL,
                available INTEGER DEFAULT 1,
                ticket_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) reject(err);
            });

            // Tickets table
            db.run(`CREATE TABLE IF NOT EXISTS tickets (
                id TEXT PRIMARY KEY,
                vehicle_number TEXT NOT NULL,
                vehicle_type TEXT NOT NULL,
                slot_id INTEGER NOT NULL,
                driver_name TEXT NOT NULL,
                contact_number TEXT NOT NULL,
                entry_time DATETIME NOT NULL,
                exit_time DATETIME,
                status TEXT DEFAULT 'active',
                fee REAL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (slot_id) REFERENCES parking_slots(slot_number)
            )`, (err) => {
                if (err) reject(err);
            });

            // Initialize parking slots if they don't exist
            db.get("SELECT COUNT(*) as count FROM parking_slots", (err, row) => {
                if (err) {
                    reject(err);
                } else if (row.count === 0) {
                    // Insert 20 default slots
                    const stmt = db.prepare("INSERT INTO parking_slots (slot_number, available) VALUES (?, 1)");
                    for (let i = 1; i <= 20; i++) {
                        stmt.run(i);
                    }
                    stmt.finalize((err) => {
                        if (err) reject(err);
                        else {
                            console.log('Initialized 20 parking slots');
                            resolve();
                        }
                    });
                } else {
                    resolve();
                }
            });
        });
    });
}

// Get database instance
let dbInstance = null;

async function getDatabase() {
    if (!dbInstance) {
        dbInstance = await initDatabase();
    }
    return dbInstance;
}

module.exports = { getDatabase, initDatabase };
