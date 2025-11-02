// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Parking System Configuration
const PARKING_CONFIG = {
    totalSlots: 20,
    hourlyRates: {
        car: 5,
        motorcycle: 2,
        truck: 8,
        suv: 6
    }
};

// State Management
let parkingSlots = [];
let activeTickets = [];

// API Helper Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API request failed');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        alert(`Error: ${error.message}`);
        throw error;
    }
}

// Initialize the parking system
async function initParkingSystem() {
    try {
        // Load slots from database
        parkingSlots = await apiCall('/slots');
        
        // Load active tickets from database
        activeTickets = await apiCall('/tickets/active');
        
        // Render slots
        renderSlots();
        
        // Update slot dropdown
        updateSlotDropdown();
        
        // Render active tickets
        renderActiveTickets();
    } catch (error) {
        console.error('Failed to initialize parking system:', error);
        alert('Failed to connect to server. Please ensure the backend server is running on port 3000.');
    }
}

// Generate unique ticket ID
function generateTicketId() {
    return `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Calculate parking fee
function calculateFee(entryTime, vehicleType) {
    const exitTime = new Date();
    const durationMs = exitTime - entryTime;
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to nearest hour
    const hourlyRate = PARKING_CONFIG.hourlyRates[vehicleType] || 5;
    return durationHours * hourlyRate;
}

// Format time
function formatTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// Format duration
function formatDuration(entryTime) {
    const entry = new Date(entryTime);
    const now = new Date();
    const durationMs = now - entry;
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

// Render parking slots
function renderSlots() {
    const slotsGrid = document.getElementById('slotsGrid');
    slotsGrid.innerHTML = '';
    
    parkingSlots.forEach(slot => {
        const slotElement = document.createElement('div');
        slotElement.className = `slot ${slot.available ? 'available' : 'occupied'}`;
        slotElement.innerHTML = `
            <div class="slot-number">Slot ${slot.id}</div>
            <div class="slot-status">${slot.available ? 'Available' : 'Occupied'}</div>
        `;
        slotsGrid.appendChild(slotElement);
    });
}

// Update slot dropdown
function updateSlotDropdown() {
    const select = document.getElementById('selectedSlot');
    select.innerHTML = '<option value="">Select Available Slot</option>';
    
    parkingSlots
        .filter(slot => slot.available)
        .forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.id;
            option.textContent = `Slot ${slot.id}`;
            select.appendChild(option);
        });
}

// Generate parking ticket
async function generateTicket(formData) {
    const slotId = parseInt(formData.selectedSlot);
    
    try {
        const ticketId = generateTicketId();
        const ticketData = {
            ticketId: ticketId,
            vehicleNumber: formData.vehicleNumber.toUpperCase(),
            vehicleType: formData.vehicleType,
            slotId: slotId,
            driverName: formData.driverName,
            contactNumber: formData.contactNumber
        };
        
        // Create ticket via API
        const ticket = await apiCall('/tickets', 'POST', ticketData);
        
        // Reload data from server
        await refreshData();
        
        // Show ticket preview
        showTicketPreview(ticket);
        
        return ticket;
    } catch (error) {
        console.error('Failed to generate ticket:', error);
    }
}

// Refresh data from server
async function refreshData() {
    try {
        parkingSlots = await apiCall('/slots');
        activeTickets = await apiCall('/tickets/active');
        
        renderSlots();
        updateSlotDropdown();
        renderActiveTickets();
    } catch (error) {
        console.error('Failed to refresh data:', error);
    }
}

// Show ticket preview in modal
function showTicketPreview(ticket) {
    const modal = document.getElementById('ticketModal');
    const preview = document.getElementById('ticketPreview');
    
    const entryTime = new Date(ticket.entryTime);
    
    preview.innerHTML = `
        <h3>PARKING TICKET</h3>
        <div class="preview-info">
            <label>Ticket ID:</label>
            <span>${ticket.id}</span>
        </div>
        <div class="preview-info">
            <label>Vehicle Number:</label>
            <span>${ticket.vehicleNumber}</span>
        </div>
        <div class="preview-info">
            <label>Vehicle Type:</label>
            <span>${ticket.vehicleType.toUpperCase()}</span>
        </div>
        <div class="preview-info">
            <label>Parking Slot:</label>
            <span>Slot ${ticket.slotId}</span>
        </div>
        <div class="preview-info">
            <label>Driver Name:</label>
            <span>${ticket.driverName}</span>
        </div>
        <div class="preview-info">
            <label>Contact Number:</label>
            <span>${ticket.contactNumber}</span>
        </div>
        <div class="preview-info">
            <label>Entry Time:</label>
            <span>${formatTime(entryTime)}</span>
        </div>
        <div class="preview-info">
            <label>Hourly Rate:</label>
            <span>$${PARKING_CONFIG.hourlyRates[ticket.vehicleType]}/hr</span>
        </div>
    `;
    
    modal.style.display = 'block';
}

// Exit parking (checkout)
async function exitParking(ticketId) {
    const ticket = activeTickets.find(t => t.id === ticketId);
    if (!ticket) return;
    
    const fee = calculateFee(ticket.entryTime, ticket.vehicleType);
    const duration = formatDuration(ticket.entryTime);
    
    if (confirm(`Exit Parking?\n\nDuration: ${duration}\nTotal Fee: $${fee.toFixed(2)}\n\nProceed with checkout?`)) {
        try {
            // Process exit via API
            const completedTicket = await apiCall(`/tickets/${ticketId}/exit`, 'POST');
            
            // Reload data from server
            await refreshData();
            
            alert(`Checkout Complete!\n\nTicket ID: ${completedTicket.id}\nDuration: ${duration}\nTotal Fee: $${completedTicket.fee.toFixed(2)}\n\nThank you for using our parking service!`);
        } catch (error) {
            console.error('Failed to process exit:', error);
        }
    }
}

// Render active tickets
function renderActiveTickets() {
    const container = document.getElementById('ticketsContainer');
    
    if (activeTickets.length === 0) {
        container.innerHTML = '<p class="no-tickets">No active tickets</p>';
        return;
    }
    
    container.innerHTML = '';
    
    activeTickets.forEach(ticket => {
        const ticketCard = document.createElement('div');
        ticketCard.className = 'ticket-card';
        
        const entryTime = new Date(ticket.entryTime);
        const duration = formatDuration(entryTime);
        const currentFee = calculateFee(entryTime, ticket.vehicleType);
        
        ticketCard.innerHTML = `
            <div class="ticket-header">
                <div class="ticket-id">${ticket.id}</div>
            </div>
            <div class="ticket-info">
                <label>Vehicle:</label>
                <span>${ticket.vehicleNumber} (${ticket.vehicleType})</span>
            </div>
            <div class="ticket-info">
                <label>Slot:</label>
                <span>Slot ${ticket.slotId}</span>
            </div>
            <div class="ticket-info">
                <label>Driver:</label>
                <span>${ticket.driverName}</span>
            </div>
            <div class="ticket-info">
                <label>Entry Time:</label>
                <span>${formatTime(entryTime)}</span>
            </div>
            <div class="ticket-info">
                <label>Duration:</label>
                <span>${duration}</span>
            </div>
            <div class="ticket-info">
                <label>Current Fee:</label>
                <span>$${currentFee.toFixed(2)}</span>
            </div>
            <button class="btn btn-exit" onclick="exitParking('${ticket.id}')">Exit & Pay</button>
        `;
        
        container.appendChild(ticketCard);
    });
}


// Update ticket durations in real-time
setInterval(() => {
    if (activeTickets.length > 0) {
        renderActiveTickets();
    }
}, 60000); // Update every minute

// Refresh data periodically from server
setInterval(async () => {
    if (document.visibilityState === 'visible') {
        await refreshData();
    }
}, 30000); // Refresh every 30 seconds

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initParkingSystem();
    
    // Form submission
    document.getElementById('ticketForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            vehicleNumber: document.getElementById('vehicleNumber').value,
            vehicleType: document.getElementById('vehicleType').value,
            selectedSlot: document.getElementById('selectedSlot').value,
            driverName: document.getElementById('driverName').value,
            contactNumber: document.getElementById('contactNumber').value
        };
        
        await generateTicket(formData);
        
        // Reset form
        document.getElementById('ticketForm').reset();
    });
    
    // Modal close
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('ticketModal').style.display = 'none';
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('ticketModal');
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
