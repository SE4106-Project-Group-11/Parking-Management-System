// frontend/js/employee.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Initial Setup and Authentication Check ---
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userNameFromStorage = localStorage.getItem('userName');

    // DOM elements for displaying user details and overview cards
    const employeeNameDisplay = document.getElementById('employeeNameDisplay');
    const employeeEmailDisplay = document.getElementById('employeeEmailDisplay');
    const employeeIdDisplay = document.getElementById('employeeIdDisplay');

    const currentPermitStatus = document.getElementById('currentPermitStatus');
    const currentPermitDetails = document.getElementById('currentPermitDetails');
    const pendingViolationsCount = document.getElementById('pendingViolationsCount');
    const permitsTableBody = document.getElementById('permitsTableBody');
    const violationsTableBody = document.getElementById('violationsTableBody');

    // Initial quick display from localStorage
    if (employeeNameDisplay) employeeNameDisplay.textContent = `Welcome, ${userNameFromStorage || 'Employee'}!`;
    if (employeeIdDisplay) employeeIdDisplay.textContent = 'ID: Loading...';
    if (employeeEmailDisplay) employeeEmailDisplay.textContent = 'Loading email...';


    // Redirect if not logged in or not an employee
    if (!token || userRole !== 'employee') {
        alert('Access denied. Please log in as an employee.');
        window.location.href = '../../index.html';
        return;
    }

    // --- Fetch Detailed Employee Data from Backend ---
    try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const responseData = await res.json();

        if (res.ok && responseData.user) {
            const employeeData = responseData.user;

            // 1. Update Header Display with fetched details
            if (employeeNameDisplay) employeeNameDisplay.textContent = `Welcome, ${employeeData.name || 'Employee'}!`;
            if (employeeEmailDisplay) employeeEmailDisplay.textContent = employeeData.email || 'N/A';
            if (employeeIdDisplay) employeeIdDisplay.textContent = `ID: ${employeeData.empID || 'N/A'}`;

            // 2. Populate "Request Permit" Modal fields dynamically
            const employeeIdInput = document.getElementById('employeeId');
            if (employeeIdInput) employeeIdInput.value = employeeData.empID || '';

            const vehicleNoInput = document.getElementById('vehicleNo');
            if (vehicleNoInput) vehicleNoInput.value = employeeData.vehicleNo || '';

            const vehicleTypeSelect = document.getElementById('vehicleType');
            if (vehicleTypeSelect) vehicleTypeSelect.value = employeeData.vehicleType || '';

            const ownerTypeSelect = document.getElementById('ownerType');
            if (ownerTypeSelect) {
                ownerTypeSelect.value = 'employee';
            }

            // 3. Populate Dashboard Overview Cards
            updatePermitCard(employeeData.permits);
            updateViolationsCard(employeeData.violations);
            // fetchAvailableParkingSpots(); // Uncomment if needed

            // 4. Populate Tables with fetched data
            renderPermitsTable(employeeData.permits);
            renderViolationsTable(employeeData.violations);

        } else {
            console.error('Failed to load employee data:', responseData.message || 'Unknown error');
            alert('Failed to load your profile data. Please try logging in again.');
            window.location.href = '../../index.html';
        }
    } catch (error) {
        console.error('Error fetching employee data:', error);
        alert('An error occurred while connecting to the server. Please check your network or server status.');
        window.location.href = '../../index.html';
    }

    // --- Helper Functions to Update UI ---

    function updatePermitCard(permits) {
        const activePermit = permits.find(p => p.status === 'approved' && new Date(p.endDate) >= new Date());

        if (activePermit) {
            currentPermitStatus.textContent = `Active until ${formatDate(activePermit.endDate)}`;
            currentPermitStatus.className = 'status-badge status-active';
            currentPermitDetails.textContent = `Permit ID: ${activePermit.permitId} | Vehicle: ${activePermit.vehicleNo} (${capitalizeFirstLetter(activePermit.vehicleType)})`;
        } else {
            currentPermitStatus.textContent = 'No Active Permit';
            currentPermitStatus.className = 'status-badge status-inactive';
            currentPermitDetails.textContent = 'Request a new permit to get started.';
        }
    }

    function updateViolationsCard(violations) {
        const pendingCount = violations.filter(v => v.status === 'pending' || v.status === 'disputed').length;
        pendingViolationsCount.textContent = pendingCount;
    }

    function renderPermitsTable(permits) {
        permitsTableBody.innerHTML = '';
        if (!permits || permits.length === 0) {
            permitsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No permit history found.</td></tr>';
            return;
        }
        permits.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        permits.forEach(p => {
            const row = document.createElement('tr');
            let statusText = capitalizeFirstLetter(p.status);
            let statusClass = `status-${p.status}`;

            if (p.status === 'approved' && new Date(p.endDate) >= new Date()) {
                statusClass = 'status-active';
                statusText = 'Active';
            } else if (p.status === 'approved' && new Date(p.endDate) < new Date()) {
                statusClass = 'status-inactive';
                statusText = 'Expired';
            }

            row.innerHTML = `
                <td>${p.permitId}</td>
                <td>${capitalizeFirstLetter(p.permitType)}</td>
                <td>${p.vehicleNo}</td>
                <td>${formatDate(p.startDate)}</td>
                <td>${formatDate(p.endDate || 'N/A')}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-info view-permit-btn" data-permit-id="${p._id}">View</button>
                    ${statusText === 'Expired' || statusText === 'Inactive' ? `<button class="btn btn-sm btn-secondary renew-permit-btn" data-permit-id="${p._id}">Renew</button>` : ''}
                </td>
            `;
            permitsTableBody.appendChild(row);
        });
    }

    function renderViolationsTable(violations) {
        violationsTableBody.innerHTML = '';
        if (!violations || violations.length === 0) {
            violationsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">No violation history found.</td></tr>';
            return;
        }
        violations.sort((a, b) => new Date(b.date) - new Date(a.date));

        violations.forEach(v => {
            const row = document.createElement('tr');
            let statusClass = `status-${v.status}`;
            let actionButtons = '';

            if (v.status === 'pending' || v.status === 'disputed') {
                statusClass = 'status-pending';
                actionButtons = `
                    <button class="btn btn-sm btn-primary pay-fine-btn" data-violation-id="${v._id}">Pay</button>
                    ${v.status === 'pending' ? `<button class="btn btn-sm btn-secondary dispute-btn" data-violation-id="${v._id}">Dispute</button>` : ''}
                `;
            } else if (v.status === 'paid') {
                statusClass = 'status-active';
            } else if (v.status === 'resolved') {
                statusClass = 'status-resolved';
            }

            row.innerHTML = `
                <td>${formatDate(v.date)}</td>
                <td>${v.vehicleNo}</td>
                <td>${v.violationType}</td>
                <td>$${v.fineAmount ? v.fineAmount.toFixed(2) : '0.00'}</td>
                <td><span class="status-badge ${statusClass}">${capitalizeFirstLetter(v.status)}</span></td>
                <td>${actionButtons}</td>
            `;
            violationsTableBody.appendChild(row);
        });
    }

    // --- Event Listeners for Modals and Actions ---

    const requestPermitBtn = document.getElementById('requestPermitBtn');
    if (requestPermitBtn) {
        requestPermitBtn.addEventListener('click', () => {
            const modal = document.getElementById('requestPermitModal');
            if (modal) {
                const permitIdField = document.getElementById('permitId');
                if (permitIdField) permitIdField.value = 'PER' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const startDateField = document.getElementById('startDate');
                if (startDateField) startDateField.value = new Date().toISOString().split('T')[0];

                const errorMessages = modal.querySelectorAll('.error-message');
                errorMessages.forEach(msg => msg.textContent = '');

                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('show'), 10);
            }
        });
    }
/*
    document.body.addEventListener('click', async function(e) {
        if (e.target.classList.contains('pay-fine-btn')) {
            const violationId = e.target.getAttribute('data-violation-id');
            const violationToPay = await fetchViolationDetails(violationId);

            if (violationToPay) {
                showPayViolationModal(violationToPay);
            } else {
                showNotification('Violation details could not be loaded.', 'error');
            }
        }
        if (e.target.classList.contains('dispute-btn')) {
            const violationId = e.target.getAttribute('data-violation-id');
            const violationToDispute = await fetchViolationDetails(violationId);

            if (violationToDispute) {
                showDisputeViolationModal(violationToDispute);
            } else {
                showNotification('Violation details could not be loaded.', 'error');
            }
        }
        if (e.target.classList.contains('view-permit-btn')) {
            const permitId = e.target.getAttribute('data-permit-id');
            showNotification(`Viewing details for Permit ID: ${permitId}`, 'info');
        }
        if (e.target.classList.contains('renew-permit-btn')) {
            const permitId = e.target.getAttribute('data-permit-id');
            showNotification(`Renewing Permit ID: ${permitId}`, 'info');
        }
    });

    // --- Helper Functions to Fetch Data for Modals ---

    async function fetchViolationDetails(violationDbId) {
        try {
            const res = await fetch(`http://localhost:5000/api/violations/${violationDbId}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                return data.violation;
            } else {
                console.error('Failed to fetch violation details:', data.message);
                return null;
            }
        } catch (error) {
            console.error('Error fetching violation details:', error);
            return null;
        }
    }

    // --- Functions to Show Modals with Dynamic Content ---
    // These functions assume `showModal` and `closeModal` are available globally from `script.js`

    function showPayViolationModal(violation) {
        const modalContent = `
            <div class="modal-header">
                <h2>Pay Violation Fine</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Violation ID:</strong> ${violation.violationId}</p>
                <p><strong>Vehicle:</strong> ${violation.vehicleNo}</p>
                <p><strong>Violation Type:</strong> ${violation.violationType}</p>
                <p><strong>Fine Amount:</strong> $${violation.fineAmount ? violation.fineAmount.toFixed(2) : '0.00'}</p>
                <form id="payFineForm" data-violation-id="${violation._id}">
                    <div class="form-group">
                        <label for="paymentMethod">Payment Method</label>
                        <select id="paymentMethod" class="form-control" required>
                            <option value="">Select Method</option>
                            <option value="card">Card</option>
                            <option value="paypal">Paypal</option>
                            <option value="cash">Cash</option>
                        </select>
                    </div>
                    <div class="modal-buttons">
                        <button type="submit" class="btn btn-primary">Confirm Payment</button>
                        <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        showModal(modalContent); // Assumes showModal is defined globally in script.js

        document.getElementById('payFineForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formViolationId = this.getAttribute('data-violation-id');
            const paymentMethod = document.getElementById('paymentMethod').value;
            if (!paymentMethod) {
                showNotification('Please select a payment method.', 'error');
                return;
            }

            try {
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';

                const res = await fetch(`http://localhost:5000/api/violations/${formViolationId}/pay`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ mode: paymentMethod })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showNotification('Payment successful! Violation status updated.', 'success');
                    closeModal(); // Assumes closeModal is defined globally in script.js
                    location.reload();
                } else {
                    showNotification(data.message || 'Payment failed.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm Payment';
                }
            } catch (error) {
                console.error('Error processing payment:', error);
                showNotification('An error occurred during payment.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm Payment';
            }
        });
    }

    function showDisputeViolationModal(violation) {
        const modalContent = `
            <div class="modal-header">
                <h2>Dispute Violation</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <p><strong>Violation ID:</strong> ${violation.violationId}</p>
                <p><strong>Vehicle:</strong> ${violation.vehicleNo}</p>
                <p><strong>Violation Type:</strong> ${violation.violationType}</p>
                <p><strong>Fine Amount:</strong> $${violation.fineAmount ? violation.fineAmount.toFixed(2) : '0.00'}</p>
                <form id="disputeForm" data-violation-id="${violation._id}">
                    <div class="form-group">
                        <label for="disputeReason">Reason for Dispute</label>
                        <select id="disputeReason" class="form-control" required>
                            <option value="">Select Reason</option>
                            <option value="incorrectVehicle">Incorrect Vehicle Information</option>
                            <option value="permissionGranted">Had Permission to Park</option>
                            <option value="emergencySituation">Emergency Situation</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="disputeExplanation">Detailed Explanation</label>
                        <textarea id="disputeExplanation" class="form-control" rows="5" required></textarea>
                    </div>
                    <div class="modal-buttons">
                        <button type="submit" class="btn btn-primary">Submit Dispute</button>
                        <button type="button" class="btn btn-secondary close-modal">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        showModal(modalContent); // Assumes showModal is defined globally in script.js

        document.getElementById('disputeForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const formViolationId = this.getAttribute('data-violation-id');
            const reason = document.getElementById('disputeReason').value;
            const explanation = document.getElementById('disputeExplanation').value;

            if (!reason || !explanation) {
                showNotification('Please fill all dispute fields.', 'error');
                return;
            }

            try {
                const submitBtn = this.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing...';

                const res = await fetch(`http://localhost:5000/api/violations/${formViolationId}/dispute`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ reason, explanation })
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showNotification('Dispute submitted! Status updated.', 'success');
                    closeModal();
                    location.reload();
                } else {
                    showNotification(data.message || 'Dispute submission failed.', 'error');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Submit Dispute';
                }
            } catch (error) {
                console.error('Error submitting dispute:', error);
                showNotification('An error occurred during dispute submission.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Submit Dispute';
            }
        });
    }
*/
    // --- Utility Functions (These were provided in your `script.js` - ensure global accessibility) ---
    // If you are still getting 'xxx is not defined', then `showNotification`, `showModal`, `closeModal`,
    // `formatDate`, `capitalizeFirstLetter` must be copied directly into `employee.js` (outside `DOMContentLoaded`).
    // For now, assuming they are accessible globally from script.js.

    // --- Global Event Listeners (also typically from script.js) ---

    // Logout Button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            alert('You have been logged out.');
            window.location.href = '../../index.html';
        });
    });

    // Sidebar Toggle
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
});