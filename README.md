# Automated Parking Slot Ticket System

A full-stack web application for managing parking slots and generating tickets with database persistence.

## Features

- 🚗 Real-time parking slot management
- 🎫 Automated ticket generation
- 💾 SQLite database storage
- 💰 Automatic fee calculation based on duration and vehicle type
- 📊 Active ticket tracking
- 🔄 Real-time data synchronization
- 🖨️ Print-ready ticket format

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express.js
- **Database**: SQLite

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

3. **Access the application:**
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## API Endpoints

### Slots
- `GET /api/slots` - Get all parking slots
- `GET /api/slots/available` - Get only available slots

### Tickets
- `GET /api/tickets` - Get all tickets (last 100)
- `GET /api/tickets/active` - Get active tickets only
- `GET /api/tickets/:id` - Get ticket by ID
- `POST /api/tickets` - Create new ticket
- `POST /api/tickets/:id/exit` - Checkout and complete ticket

## Database Schema

### parking_slots
- `id` - Primary key
- `slot_number` - Unique slot identifier (1-20)
- `available` - Boolean (1 = available, 0 = occupied)
- `ticket_id` - Reference to current ticket
- `created_at` - Timestamp
- `updated_at` - Timestamp

### tickets
- `id` - Primary key (Ticket ID)
- `vehicle_number` - Vehicle registration number
- `vehicle_type` - Type of vehicle (car, motorcycle, truck, suv)
- `slot_id` - Parking slot number
- `driver_name` - Driver's name
- `contact_number` - Contact phone number
- `entry_time` - Entry timestamp
- `exit_time` - Exit timestamp (nullable)
- `status` - Ticket status (active, completed)
- `fee` - Parking fee (calculated on exit)
- `created_at` - Timestamp

## Parking Rates

- **Car**: $5/hour
- **Motorcycle**: $2/hour
- **Truck**: $8/hour
- **SUV**: $6/hour

Fees are calculated by rounding up to the nearest hour.

## File Structure

```
.
├── index.html          # Frontend HTML
├── style.css           # Frontend styling
├── script.js           # Frontend JavaScript (API client)
├── server.js           # Express server and API routes
├── database.js         # Database initialization
├── package.json        # Node.js dependencies
├── parking.db          # SQLite database (created automatically)
└── README.md           # This file
```

## Usage

1. **View Available Slots**: The dashboard displays all parking slots with color-coded status (green = available, red = occupied)

2. **Generate Ticket**: 
   - Fill in vehicle details
   - Select an available slot
   - Click "Generate Ticket"
   - A ticket preview modal will appear

3. **View Active Tickets**: All active tickets are displayed with real-time duration and fee calculation

4. **Exit Parking**: 
   - Click "Exit & Pay" on any active ticket
   - Confirm the checkout
   - The slot will be freed and the ticket marked as completed

## Notes

- The database file (`parking.db`) is created automatically on first run
- 20 parking slots are initialized automatically
- All data persists in the SQLite database
- The frontend automatically refreshes data every 30 seconds

## Development

To modify the number of parking slots, edit `PARKING_CONFIG.totalSlots` in both `script.js` and the initialization in `database.js`.

To change the server port, modify the `PORT` variable in `server.js` or set the `PORT` environment variable.
