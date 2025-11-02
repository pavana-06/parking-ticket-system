const express = require('express');
const cors = require('cors');
const { getDatabase } = require('./database');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve static files

// Initialize database on startup
let db;
getDatabase().then(database => {
    db = database;
    console.log('Database initialized successfully');
}).catch(err => {
    console.error('Database initialization failed:', err);
    process.exit(1);
});

// ==================== API ROUTES ====================

// Get all parking slots
app.get('/api/slots', (req, res) => {
    db.all("SELECT * FROM parking_slots ORDER BY slot_number", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => ({
                id: row.slot_number,
                available: row.available === 1,
                ticketId: row.ticket_id
            })));
        }
    });
});

// Get available slots only
app.get('/api/slots/available', (req, res) => {
    db.all("SELECT * FROM parking_slots WHERE available = 1 ORDER BY slot_number", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => ({
                id: row.slot_number,
                available: true
            })));
        }
    });
});

// Get all active tickets
app.get('/api/tickets/active', (req, res) => {
    db.all(`SELECT * FROM tickets WHERE status = 'active' ORDER BY entry_time DESC`, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => ({
                id: row.id,
                vehicleNumber: row.vehicle_number,
                vehicleType: row.vehicle_type,
                slotId: row.slot_id,
                driverName: row.driver_name,
                contactNumber: row.contact_number,
                entryTime: row.entry_time,
                status: row.status
            })));
        }
    });
});

// Get all tickets (including completed)
app.get('/api/tickets', (req, res) => {
    db.all("SELECT * FROM tickets ORDER BY entry_time DESC LIMIT 100", (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else {
            res.json(rows.map(row => ({
                id: row.id,
                vehicleNumber: row.vehicle_number,
                vehicleType: row.vehicle_type,
                slotId: row.slot_id,
                driverName: row.driver_name,
                contactNumber: row.contact_number,
                entryTime: row.entry_time,
                exitTime: row.exit_time,
                status: row.status,
                fee: row.fee
            })));
        }
    });
});

// Get single ticket by ID
app.get('/api/tickets/:id', (req, res) => {
    const ticketId = req.params.id;
    db.get("SELECT * FROM tickets WHERE id = ?", [ticketId], (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (!row) {
            res.status(404).json({ error: 'Ticket not found' });
        } else {
            res.json({
                id: row.id,
                vehicleNumber: row.vehicle_number,
                vehicleType: row.vehicle_type,
                slotId: row.slot_id,
                driverName: row.driver_name,
                contactNumber: row.contact_number,
                entryTime: row.entry_time,
                exitTime: row.exit_time,
                status: row.status,
                fee: row.fee
            });
        }
    });
});

// Create new ticket
app.post('/api/tickets', (req, res) => {
    const { vehicleNumber, vehicleType, slotId, driverName, contactNumber, ticketId } = req.body;

    if (!vehicleNumber || !vehicleType || !slotId || !driverName || !contactNumber || !ticketId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Start transaction
    db.serialize(() => {
        // Check if slot is available
        db.get("SELECT available, ticket_id FROM parking_slots WHERE slot_number = ?", [slotId], (err, slot) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!slot) {
                return res.status(404).json({ error: 'Slot not found' });
            }
            if (slot.available !== 1) {
                return res.status(400).json({ error: 'Slot is already occupied' });
            }

            // Insert ticket
            const entryTime = new Date().toISOString();
            db.run(`INSERT INTO tickets (id, vehicle_number, vehicle_type, slot_id, driver_name, contact_number, entry_time, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
                [ticketId, vehicleNumber.toUpperCase(), vehicleType, slotId, driverName, contactNumber, entryTime],
                function(err) {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Update slot to occupied
                    db.run(`UPDATE parking_slots 
                            SET available = 0, ticket_id = ?, updated_at = CURRENT_TIMESTAMP 
                            WHERE slot_number = ?`,
                        [ticketId, slotId],
                        (err) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }

                            // Return created ticket
                            db.get("SELECT * FROM tickets WHERE id = ?", [ticketId], (err, ticket) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.status(201).json({
                                    id: ticket.id,
                                    vehicleNumber: ticket.vehicle_number,
                                    vehicleType: ticket.vehicle_type,
                                    slotId: ticket.slot_id,
                                    driverName: ticket.driver_name,
                                    contactNumber: ticket.contact_number,
                                    entryTime: ticket.entry_time,
                                    status: ticket.status
                                });
                            });
                        });
                });
        });
    });
});

// Exit parking (checkout)
app.post('/api/tickets/:id/exit', (req, res) => {
    const ticketId = req.params.id;
    const hourlyRates = {
        car: 5,
        motorcycle: 2,
        truck: 8,
        suv: 6
    };

    db.serialize(() => {
        // Get ticket
        db.get("SELECT * FROM tickets WHERE id = ? AND status = 'active'", [ticketId], (err, ticket) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }
            if (!ticket) {
                return res.status(404).json({ error: 'Active ticket not found' });
            }

            // Calculate fee
            const entryTime = new Date(ticket.entry_time);
            const exitTime = new Date();
            const durationMs = exitTime - entryTime;
            const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
            const hourlyRate = hourlyRates[ticket.vehicle_type] || 5;
            const fee = durationHours * hourlyRate;

            // Update ticket
            db.run(`UPDATE tickets 
                    SET exit_time = ?, status = 'completed', fee = ? 
                    WHERE id = ?`,
                [exitTime.toISOString(), fee, ticketId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    }

                    // Free up slot
                    db.run(`UPDATE parking_slots 
                            SET available = 1, ticket_id = NULL, updated_at = CURRENT_TIMESTAMP 
                            WHERE slot_number = ?`,
                        [ticket.slot_id],
                        (err) => {
                            if (err) {
                                return res.status(500).json({ error: err.message });
                            }

                            // Return completed ticket
                            db.get("SELECT * FROM tickets WHERE id = ?", [ticketId], (err, completedTicket) => {
                                if (err) {
                                    return res.status(500).json({ error: err.message });
                                }
                                res.json({
                                    id: completedTicket.id,
                                    vehicleNumber: completedTicket.vehicle_number,
                                    vehicleType: completedTicket.vehicle_type,
                                    slotId: completedTicket.slot_id,
                                    driverName: completedTicket.driver_name,
                                    contactNumber: completedTicket.contact_number,
                                    entryTime: completedTicket.entry_time,
                                    exitTime: completedTicket.exit_time,
                                    status: completedTicket.status,
                                    fee: completedTicket.fee
                                });
                            });
                        });
                });
        });
    });
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Parking Management Server running on http://localhost:${PORT}`);
    console.log(`Access the application at http://localhost:${PORT}`);
});
