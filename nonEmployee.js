// DOM Elements
const navLinks = document.querySelectorAll('.nav-links li');
const tabContents = document.querySelectorAll('.tab-content');
const logoutBtn = document.getElementById('logoutBtn');
const requestPermitBtn = document.getElementById('requestPermitBtn');
const permitModal = document.getElementById('permitModal');
const paymentModal = document.getElementById('paymentModal');
const permitForm = document.getElementById('permitForm');
const paymentForm = document.getElementById('paymentForm');

// Sample Non-Employee Data (In a real app, this would come from a database)
const currentNonEmployee = {
    id: 'NE001',
    name: 'Jane Smith',
    email: 'jane.smith@company.com'
};

let permits = [
    {
        id: 1,
        nonEmployeeId: 'NE001',
        vehicleNo: 'XYZ987',
        requestDate: '2025-04-01',
        status: 'approved',
        validUntil: '2025-05-01'
    }
];

let violations = [
    {
        id: 1,
        date: '2025-04-05',
        vehicleNo: 'XYZ987',
        type: 'Overstay',
        amount: 25,
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
        nonEmployeeId: currentNonEmployee.id,
        vehicleNo: document.getElementById('vehicleNumber').value,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        validUntil: ''
    };
    permits.push(newPermit);
    updatePermitsTable();
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
        hideModal(paymentModal);
        paymentForm.reset();
        alert('Payment processed successfully!');
    }
});

// Table Update Functions
function updatePermitsTable() {
    const tbody = document.getElementById('permitTableBody');
    tbody.innerHTML = '';

    const nonEmployeePermits = permits.filter(p => p.nonEmployeeId === currentNonEmployee.id);

    nonEmployeePermits.forEach(permit => {
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

function updateViolationsTable() {
    const tbody = document.getElementById('violationTableBody');
    tbody.innerHTML = '';

    const nonEmployeeViolations = violations.filter(v => v.vehicleNo === 'XYZ987');

    nonEmployeeViolations.forEach(violation => {
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
    const nonEmployeeViolations = violations.filter(v => v.vehicleNo === 'XYZ987');

    const totalFines = nonEmployeeViolations
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
updateViolationsTable();
updatePendingFines();
