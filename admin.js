// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logoutBtn');
const addViolationBtn = document.getElementById('addViolationBtn');
const addVisitorBtn = document.getElementById('addVisitorBtn');
const violationModal = document.getElementById('violationModal');
const visitorModal = document.getElementById('visitorModal');
const violationForm = document.getElementById('violationForm');
const visitorForm = document.getElementById('visitorForm');

// Sample Data (In a real app, this would come from a database)
let permits = [
    { id: 1, employeeId: 'EMP001', name: 'John Doe', vehicleNo: 'ABC123', requestDate: '2025-03-14', status: 'pending' },
    { id: 2, employeeId: 'EMP002', name: 'Jane Smith', vehicleNo: 'XYZ789', requestDate: '2025-03-13', status: 'approved' }
];

let employees = [
    { id: 'EMP001', name: 'John Doe', vehicleNo: 'ABC123', permitStatus: 'pending' },
    { id: 'EMP002', name: 'Jane Smith', vehicleNo: 'XYZ789', permitStatus: 'approved' }
];

let violations = [
    { id: 1, date: '2025-03-14', vehicleNo: 'ABC123', type: 'Wrong Parking', amount: 50, status: 'unpaid' }
];

let visitors = [
    { id: 1, name: 'Mike Johnson', vehicleNo: 'DEF456', purpose: 'Meeting', phone: '1234567890', entryTime: '09:30 AM', status: 'active' }
];

// Tab Navigation
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        if (link.id === 'logoutBtn') {
            window.location.href = 'index.html';
            return;
        }

        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');

        const tabId = link.getAttribute('data-tab');
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabId) {
                content.classList.add('active');
            }
        });
    });
});

// Modal Functions
function showModal(modal) {
    modal.classList.add('active');
}

function hideModal(modal) {
    modal.classList.remove('active');
}

// Event Listeners for Modals
addViolationBtn.addEventListener('click', () => showModal(violationModal));
addVisitorBtn.addEventListener('click', () => showModal(visitorModal));

document.querySelectorAll('.cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        hideModal(violationModal);
        hideModal(visitorModal);
    });
});

// Form Submissions
violationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newViolation = {
        id: violations.length + 1,
        date: new Date().toISOString().split('T')[0],
        vehicleNo: document.getElementById('violationVehicle').value,
        type: document.getElementById('violationType').value,
        amount: document.getElementById('fineAmount').value,
        status: 'unpaid'
    };
    violations.push(newViolation);
    updateViolationsTable();
    hideModal(violationModal);
    violationForm.reset();
});

visitorForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newVisitor = {
        id: visitors.length + 1,
        name: document.getElementById('visitorName').value,
        vehicleNo: document.getElementById('visitorVehicle').value,
        purpose: document.getElementById('visitPurpose').value,
        phone: document.getElementById('visitorPhone').value,
        entryTime: new Date().toLocaleTimeString(),
        status: 'active'
    };
    visitors.push(newVisitor);
    updateVisitorsTable();
    hideModal(visitorModal);
    visitorForm.reset();
});

// Table Update Functions
function updatePermitsTable() {
    const tbody = document.getElementById('permitTableBody');
    tbody.innerHTML = '';
    
    permits.forEach(permit => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${permit.employeeId}</td>
            <td>${permit.name}</td>
            <td>${permit.vehicleNo}</td>
            <td>${permit.requestDate}</td>
            <td><span class="status-badge status-${permit.status}">${permit.status}</span></td>
            <td>
                ${permit.status === 'pending' ? `
                    <button class="action-btn approve-btn" onclick="updatePermitStatus(${permit.id}, 'approved')">Approve</button>
                    <button class="action-btn reject-btn" onclick="updatePermitStatus(${permit.id}, 'rejected')">Reject</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    updatePermitCounts();
}

function updateEmployeesTable() {
    const tbody = document.getElementById('employeeTableBody');
    tbody.innerHTML = '';
    
    employees.forEach(employee => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${employee.id}</td>
            <td>${employee.name}</td>
            <td>${employee.vehicleNo}</td>
            <td><span class="status-badge status-${employee.permitStatus}">${employee.permitStatus}</span></td>
            <td>
                <button class="action-btn" onclick="viewEmployeeDetails('${employee.id}')">View Details</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('totalEmployees').textContent = employees.length;
}

function updateViolationsTable() {
    const tbody = document.getElementById('violationTableBody');
    tbody.innerHTML = '';
    
    violations.forEach(violation => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${violation.date}</td>
            <td>${violation.vehicleNo}</td>
            <td>${violation.type}</td>
            <td>$${violation.amount}</td>
            <td><span class="status-badge status-${violation.status}">${violation.status}</span></td>
            <td>
                ${violation.status === 'unpaid' ? `
                    <button class="action-btn mark-paid-btn" onclick="markViolationPaid(${violation.id})">Mark Paid</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updateVisitorsTable() {
    const tbody = document.getElementById('visitorTableBody');
    tbody.innerHTML = '';
    
    visitors.forEach(visitor => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${visitor.name}</td>
            <td>${visitor.vehicleNo}</td>
            <td>${visitor.purpose}</td>
            <td>${visitor.phone}</td>
            <td>${visitor.entryTime}</td>
            <td><span class="status-badge status-${visitor.status}">${visitor.status}</span></td>
            <td>
                ${visitor.status === 'active' ? `
                    <button class="action-btn" onclick="markVisitorExit(${visitor.id})">Mark Exit</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Update Permit Counts
function updatePermitCounts() {
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('approvedCount').textContent = approved;
}

// Action Functions
function updatePermitStatus(id, status) {
    const permit = permits.find(p => p.id === id);
    if (permit) {
        permit.status = status;
        const employee = employees.find(e => e.id === permit.employeeId);
        if (employee) {
            employee.permitStatus = status;
        }
        updatePermitsTable();
        updateEmployeesTable();
    }
}

function markViolationPaid(id) {
    const violation = violations.find(v => v.id === id);
    if (violation) {
        violation.status = 'paid';
        updateViolationsTable();
    }
}

function markVisitorExit(id) {
    const visitor = visitors.find(v => v.id === id);
    if (visitor) {
        visitor.status = 'exited';
        updateVisitorsTable();
    }
}

// Initialize tables
updatePermitsTable();
updateEmployeesTable();
updateViolationsTable();
updateVisitorsTable();
