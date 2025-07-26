// frontend/js/visitor.js
document.addEventListener('DOMContentLoaded', async () => {
    // --- Initial Setup and Authentication Check ---
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userNameFromStorage = localStorage.getItem('userName');
    const dbUserId = localStorage.getItem('userId'); // Needed for API calls

    // DOM elements for displaying user details and overview cards
    const visitorNameDisplay = document.getElementById('visitorNameDisplay');
    const visitorEmailDisplay = document.getElementById('visitorEmailDisplay');
    const visitorVehicleDisplay = document.getElementById('visitorVehicleDisplay');

    const currentPermitStatus = document.getElementById('currentPermitStatus');
    const currentPermitDetails = document.getElementById('currentPermitDetails');
    const permitsTableBody = document.getElementById('permitsTableBody');

    // Initial quick display from localStorage
    if (visitorNameDisplay) visitorNameDisplay.textContent = `Welcome, ${userNameFromStorage || 'Visitor'}!`;
    if (visitorEmailDisplay) visitorEmailDisplay.textContent = 'Loading email...';
    if (visitorVehicleDisplay) visitorVehicleDisplay.textContent = 'Loading vehicle...';

    // Redirect if not logged in or not a visitor
    if (!token || userRole !== 'visitor') {
        alert('Access denied. Please log in as a visitor.');
        window.location.href = '../../index.html';
        return;
    }

    // --- Fetch Detailed Visitor Data from Backend ---
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
            const visitorData = responseData.user; // This will contain visitor details

            // 1. Update Header Display with fetched details
            if (visitorNameDisplay) visitorNameDisplay.textContent = `Welcome, ${visitorData.name || 'Visitor'}!`;
            if (visitorEmailDisplay) visitorEmailDisplay.textContent = visitorData.email || 'N/A';
            if (visitorVehicleDisplay) visitorVehicleDisplay.textContent = visitorData.vehicleNo || 'N/A';

            // 2. Populate "Request Permit" Modal fields dynamically
            // Note: Visitor schema doesn't have empID, so skip that.
            const vehicleNoInput = document.getElementById('vehicleNo');
            if (vehicleNoInput) vehicleNoInput.value = visitorData.vehicleNo || '';

            const vehicleTypeSelect = document.getElementById('vehicleType');
            if (vehicleTypeSelect) vehicleTypeSelect.value = visitorData.vehicleType || ''; // Assuming vehicleType in Visitor model

            const ownerTypeInput = document.getElementById('ownerType');
            if (ownerTypeInput) {
                ownerTypeInput.value = 'visitor'; // Ensure ownerType is 'visitor'
            }

            // 3. Populate Dashboard Overview Cards (Permit Status)
            updatePermitCard(visitorData.permits);

            // 4. Populate Tables with fetched data (Permits only for visitors)
            renderPermitsTable(visitorData.permits);

        } else {
            console.error('Failed to load visitor data:', responseData.message || 'Unknown error');
            alert('Failed to load your profile data. Please try logging in again.');
            window.location.href = '../../index.html';
        }
    } catch (error) {
        console.error('Error fetching visitor data:', error);
        alert('An error occurred while connecting to the server. Please check your network or server status.');
        window.location.href = '../../index.html';
    }

    // --- Helper Functions to Update UI (Copied/Adapted from employee.js) ---
    // Make sure these utility functions are available, either by including a global script.js
    // or by defining them directly in this file outside the DOMContentLoaded listener.
    // For simplicity, assuming `formatDate` and `capitalizeFirstLetter` are global or defined here.

    function formatDate(dateString) {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function capitalizeFirstLetter(string) {
      if (!string) return '';
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    function updatePermitCard(permits) {
        // Find an active permit (approved and not expired)
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

    function renderPermitsTable(permits) {
        permitsTableBody.innerHTML = ''; // Clear existing rows
        if (!permits || permits.length === 0) {
            permitsTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No permit history found.</td></tr>';
            return;
        }
        // Sort permits by start date (most recent first)
        permits.sort((a, b) => new Date(b.createdAt || b.startDate) - new Date(a.createdAt || a.startDate));

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

    // --- Event Listeners for Modals and Actions ---

    // Get modal elements
    const requestPermitModal = document.getElementById('requestPermitModal');
    const permitRequestForm = document.getElementById('permitRequestForm');
    const closeButtons = document.querySelectorAll('.close-modal');
    const permitIdField = document.getElementById('permitId');
    const startDateField = document.getElementById('startDate');
    const endDateField = document.getElementById('endDate');
    const permitTypeSelect = document.getElementById('permitType');
    const vehicleTypeSelectForm = document.getElementById('vehicleType'); // For the form, might be same as pre-filled one
    const vehicleNoInputForm = document.getElementById('vehicleNo'); // For the form

    // Error message elements
    const vehicleNoError = document.getElementById('vehicleNoError');
    const vehicleTypeError = document.getElementById('vehicleTypeError');
    const permitTypeError = document.getElementById('permitTypeError');
    const startDateError = document.getElementById('startDateError');
    const endDateError = document.getElementById('endDateError');

    // Show request permit modal
    const requestPermitBtn = document.getElementById('requestPermitBtn');
    if (requestPermitBtn) {
        requestPermitBtn.addEventListener('click', () => {
            // Reset form and errors
            permitRequestForm.reset();
            permitRequestForm.querySelector('button[type="submit"]').disabled = false;
            permitRequestForm.querySelector('button[type="submit"]').textContent = 'Submit Request';
            document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

            // Pre-fill permit ID and start date
            permitIdField.value = 'PER' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            startDateField.value = new Date().toISOString().split('T')[0];
            endDateField.value = ''; // Clear end date initially

            // Pre-fill vehicle info from visitorData if available
            if (visitorVehicleDisplay && visitorVehicleDisplay.textContent !== 'N/A') {
                vehicleNoInputForm.value = visitorVehicleDisplay.textContent;
            }
            if (vehicleTypeSelectForm && visitorVehicleDisplay && visitorVehicleDisplay.textContent !== 'N/A') {
                // Assuming you have vehicleType in visitorData as well
                const currentVehicleType = localStorage.getItem('userVehicleType'); // If stored during login
                if (currentVehicleType) {
                    vehicleTypeSelectForm.value = currentVehicleType;
                }
            }


            requestPermitModal.style.display = 'flex';
            setTimeout(() => requestPermitModal.classList.add('show'), 10);
        });
    }

    // Handle permit type change to calculate end date
    permitTypeSelect.addEventListener('change', () => {
        const type = permitTypeSelect.value;
        const startDate = new Date(startDateField.value);
        let endDate = new Date(startDate);

        if (!isNaN(startDate.getTime())) { // Check if startDate is a valid date
            switch (type) {
                case 'day':
                    endDate.setDate(startDate.getDate() + 1); // Valid for 1 day
                    break;
                case 'week':
                    endDate.setDate(startDate.getDate() + 7);
                    break;
                case 'month':
                    endDate.setMonth(startDate.getMonth() + 1);
                    break;
                case 'annual':
                    endDate.setFullYear(startDate.getFullYear() + 1);
                    break;
                default:
                    endDateField.value = '';
                    return;
            }
            endDateField.value = endDate.toISOString().split('T')[0];
        } else {
            endDateField.value = ''; // Clear if start date is invalid
        }
    });


    // Close modal functionality
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            requestPermitModal.classList.remove('show');
            setTimeout(() => requestPermitModal.style.display = 'none', 300);
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target === requestPermitModal) {
            requestPermitModal.classList.remove('show');
            setTimeout(() => requestPermitModal.style.display = 'none', 300);
        }
    });

    // Handle permit request form submission
    permitRequestForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

        const permitId = permitIdField.value;
        const duration = permitTypeSelect.value; // Using 'duration' as per backend permitType
        const vehicleNo = vehicleNoInputForm.value.trim();
        const vehicleType = vehicleTypeSelectForm.value;
        const startDate = startDateField.value;
        const endDate = endDateField.value; // Auto-calculated based on duration
        const notes = document.getElementById('notes').value.trim();
        const permitType = duration; // Map duration to permitType

        // Basic client-side validation
        let isValid = true;
        if (!vehicleNo) { vehicleNoError.textContent = 'Vehicle number is required.'; isValid = false; }
        if (!vehicleType) { vehicleTypeError.textContent = 'Vehicle type is required.'; isValid = false; }
        if (!duration) { permitTypeError.textContent = 'Permit duration is required.'; isValid = false; }
        if (!startDate) { startDateError.textContent = 'Start date is required.'; isValid = false; }
        // End date is auto-calculated, so only check if a valid date resulted
        if (!endDate || new Date(endDate).toString() === 'Invalid Date') { endDateError.textContent = 'End date could not be calculated. Please select a start date and permit duration.'; isValid = false; }


        if (!isValid) {
            showNotification('Please correct the errors in the form.', 'error');
            return;
        }

        const submitBtn = permitRequestForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting...';

        try {
            const res = await fetch('http://localhost:5000/api/permits', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    permitId,
                    duration, // Mapped to permitType in backend
                    vehicleNo,
                    vehicleType,
                    startDate,
                    endDate,
                    notes,
                    permitType // Also sending permitType explicitly
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                showNotification('Permit request submitted successfully! Awaiting admin approval.', 'success');
                requestPermitModal.classList.remove('show');
                setTimeout(() => requestPermitModal.style.display = 'none', 300);
                location.reload(); // Reload page to update permits table
            } else {
                showNotification(data.message || 'Failed to submit permit request.', 'error');
            }
        } catch (error) {
            console.error('Error submitting permit request:', error);
            showNotification('An error occurred while submitting your permit request.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Submit Request';
        }
    });


    // --- Global Event Listeners (Copied from employee.js for completeness) ---
    // Logout Button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('dbUserId'); // Remove visitor's user ID
            localStorage.removeItem('userVehicleType'); // Remove visitor's vehicle type if stored
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

    // Tab switching logic (from employee.js - adapt if your navigation is different)
    const navLinks = document.querySelectorAll('.nav-links li');
    const tabContents = document.querySelectorAll('.tab-content');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(item => item.classList.remove('active'));
            link.classList.add('active');

            const tabId = link.getAttribute('data-tab');
            tabContents.forEach(content => {
                if (content.id === tabId) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Notification function (assuming global or defined here)
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('hide');
            notification.addEventListener('transitionend', () => notification.remove());
        }, 3000);
    }

    // Modal show/close (assuming global or defined here, adapted from employee.js's general approach)
    // The modal logic for requestPermitModal is handled directly above.
    // If you have a general showModal/closeModal in script.js, you can use that.
});