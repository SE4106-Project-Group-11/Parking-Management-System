// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logoutBtn');
const requestPermitBtn = document.getElementById('requestPermitBtn');
const permitModal = document.getElementById('permitModal');
const paymentModal = document.getElementById('paymentModal');
const permitForm = document.getElementById('permitForm');
const paymentForm = document.getElementById('paymentForm');

// Sample Employee Data (In a real app, this would come from a database)
const currentEmployee = {
    id: 'EMP001',
    name: 'John Doe',
    email: 'john.doe@company.com'
};

let permits = [
    {
        id: 1,
        employeeId: 'EMP001',
        vehicleNo: 'ABC123',
        requestDate: '2025-03-14',
        status: 'approved',
        validUntil: '2026-03-14'
    }
];

let violations = [
    {
        id: 1,
        date: '2025-03-14',
        vehicleNo: 'ABC123',
        type: 'Wrong Parking',
        amount: 50,
        status: 'unpaid'
    }
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
requestPermitBtn.addEventListener('click', () => showModal(permitModal));

document.querySelectorAll('.cancel').forEach(btn => {
    btn.addEventListener('click', () => {
        hideModal(permitModal);
        hideModal(paymentModal);
    });
});

// Form Submissions
permitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPermit = {
        id: permits.length + 1,
        employeeId: currentEmployee.id,
        vehicleNo: document.getElementById('vehicleNumber').value,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        validUntil: ''
    };
    permits.push(newPermit);
    updatePermitsTable();
    updateCurrentPermitStatus();
    hideModal(permitModal);
    permitForm.reset();
    alert('Permit request submitted successfully!');
});

paymentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const violationId = paymentForm.getAttribute('data-violation-id');
    const violation = violations.find(v => v.id === parseInt(violationId));
    if (violation) {
        violation.status = 'paid';
        updateViolationsTable();
        updatePendingFines();
        hideModal(paymentModal);
        paymentForm.reset();
        alert('Payment processed successfully!');
    }
});

// Table Update Functions
function updatePermitsTable() {
    const tbody = document.getElementById('permitTableBody');
    tbody.innerHTML = '';
    
    const employeePermits = permits.filter(p => p.employeeId === currentEmployee.id);
    
    employeePermits.forEach(permit => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${permit.requestDate}</td>
            <td>${permit.vehicleNo}</td>
            <td><span class="status-badge status-${permit.status}">${permit.status}</span></td>
            <td>${permit.validUntil || 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateCurrentPermitStatus() {
    const statusDiv = document.getElementById('currentPermitStatus');
    const activePermit = permits.find(p => 
        p.employeeId === currentEmployee.id && 
        p.status === 'approved' &&
        new Date(p.validUntil) > new Date()
    );
    
    if (activePermit) {
        statusDiv.innerHTML = `
            <span class="status-badge status-approved">Active until ${activePermit.validUntil}</span>
            <p>Vehicle: ${activePermit.vehicleNo}</p>
        `;
    } else {
        const pendingPermit = permits.find(p => 
            p.employeeId === currentEmployee.id && 
            p.status === 'pending'
        );
        
        if (pendingPermit) {
            statusDiv.innerHTML = `
                <span class="status-badge status-pending">Request Pending</span>
                <p>Vehicle: ${pendingPermit.vehicleNo}</p>
            `;
        } else {
            statusDiv.innerHTML = `
                <span class="status-badge status-none">No Active Permit</span>
            `;
        }
    }
}

function updateViolationsTable() {
    const tbody = document.getElementById('violationTableBody');
    tbody.innerHTML = '';
    
    const employeeViolations = violations.filter(v => {
        const employeePermits = permits.filter(p => p.employeeId === currentEmployee.id);
        return employeePermits.some(p => p.vehicleNo === v.vehicleNo);
    });
    
    employeeViolations.forEach(violation => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${violation.date}</td>
            <td>${violation.vehicleNo}</td>
            <td>${violation.type}</td>
            <td>$${violation.amount}</td>
            <td><span class="status-badge status-${violation.status}">${violation.status}</span></td>
            <td>
                ${violation.status === 'unpaid' ? `
                    <button class="action-btn pay-btn" onclick="showPaymentModal(${violation.id})">Pay Fine</button>
                ` : ''}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function updatePendingFines() {
    const employeeViolations = violations.filter(v => {
        const employeePermits = permits.filter(p => p.employeeId === currentEmployee.id);
        return employeePermits.some(p => p.vehicleNo === v.vehicleNo);
    });
    
    const totalFines = employeeViolations
        .filter(v => v.status === 'unpaid')
        .reduce((sum, v) => sum + v.amount, 0);
    
    document.getElementById('pendingFines').textContent = `$${totalFines}`;
}

function showPaymentModal(violationId) {
    const violation = violations.find(v => v.id === violationId);
    if (violation) {
        document.getElementById('paymentViolationType').textContent = violation.type;
        document.getElementById('paymentAmount').textContent = violation.amount;
        paymentForm.setAttribute('data-violation-id', violationId);
        showModal(paymentModal);
    }
}

// Initialize tables and status
updatePermitsTable();
updateCurrentPermitStatus();
updateViolationsTable();
updatePendingFines();

// Theme Toggle Functionality
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Check for saved theme preference or default to dark mode
const currentTheme = localStorage.getItem('theme') || 'dark';
body.setAttribute('data-theme', currentTheme);

themeToggle.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});