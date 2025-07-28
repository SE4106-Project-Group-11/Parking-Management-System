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
   // const pendingViolationsCount = document.getElementById('pendingViolationsCount');
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
            //updateViolationsCard(employeeData.violations);
            // fetchAvailableParkingSpots(); // Uncomment if needed

            // 4. Populate Tables with fetched data
            renderPermitsTable(employeeData.permits);
           // renderViolationsTable(employeeData.violations);

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

   /* function updateViolationsCard(violations) {
        const pendingCount = violations.filter(v => v.status === 'pending' || v.status === 'disputed').length;
        pendingViolationsCount.textContent = pendingCount;
    }*/

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

    /*function renderViolationsTable(violations) {
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
*/
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