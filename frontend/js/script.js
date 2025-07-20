// frontend/js/script.js

// --- GLOBAL UTILITY FUNCTIONS (Defined outside DOMContentLoaded for universal access) ---

// Function to toggle password visibility (used on login/register pages)
function togglePassword() {
    const passwordInput = document.getElementById("password");
    const icon = document.getElementById("toggleIcon");

    if (passwordInput && icon) { // Add null check for elements
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        } else {
            passwordInput.type = "password";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        }
    }
}

// Function to open dynamic modals
function showModal(contentHtml) {
    let modal = document.getElementById('dynamicModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"></div>`; // Append content div immediately inside
        document.body.appendChild(modal);
    }
    const modalContentDiv = modal.querySelector('.modal-content');
    if (modalContentDiv) {
        modalContentDiv.innerHTML = contentHtml;
    }
    modal.style.display = 'flex'; // Ensure flex display for centering
    setTimeout(() => { modal.classList.add('show'); }, 10); // Add 'show' class for transition

    // Re-attach close listeners for new content in dynamic modal
    // This relies on event delegation for buttons with 'close-modal' class, or click outside
}

// Function to close any active modal
function closeModal() {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
        openModal.classList.remove('show');
        setTimeout(() => { openModal.style.display = 'none'; }, 300);
    }
}

// Function to show transient notifications
function showNotification(message, type = 'success') {
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 4px;
        font-weight: 500;
        z-index: 1000;
        transform: translateX(120%);
        transition: transform 0.3s ease-out;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0.95;
    `;
    const iconClass = type === 'success' ? 'check-circle' : type === 'error' ? 'times-circle' : 'info-circle';
    notification.innerHTML = `
        <i class="fas fa-${iconClass}"></i>
        <span>${message}</span>
        <button class="notification-close" style="background: none; border: none; color: white; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">&times;</button>
    `;
    document.body.appendChild(notification);

    notification.querySelector('.notification-close').addEventListener('click', () => notification.remove());

    setTimeout(() => notification.style.transform = 'translateX(0)', 10);

    setTimeout(() => {
        notification.style.transform = 'translateX(120%)';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Utility function to format date for display
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    try {
        return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (e) {
        console.error("Invalid date string:", dateString, e);
        return dateString;
    }
}

// Utility function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// --- DOMContentLoaded for page-specific initialization and event listeners ---
document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN FORM LOGIC (Only runs on pages with a loginForm element) ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const userType = document.getElementById('userType').value;

            try {
                const res = await fetch('http://localhost:5000/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, userType })
                });

                const data = await res.json();

                if (res.ok) {
                    alert('Login successful!');
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('userRole', data.user.role);
                    localStorage.setItem('userName', data.user.name);
                    localStorage.setItem('userId', data.user.id); // Store MongoDB _id

                    if (data.user.role === 'admin') {
                        window.location.href = 'pages/admin/dashboard.html';
                    } else if (data.user.role === 'employee') {
                        window.location.href = 'pages/employee/dashboard.html';
                    } else if (data.user.role === 'visitor') {
                        window.location.href = 'pages/visitor/dashboard.html';
                    } else if (data.user.role === 'nonemployee') {
                        window.location.href = 'pages/nonemployee/dashboard.html';
                    } else {
                        alert('Unknown user role. Cannot redirect.');
                    }
                } else {
                    alert(data.message || 'Login failed.');
                }
            } catch (err) {
                console.error(err);
                alert('An error occurred during login.');
            }
        });
    }


    // --- COMMON DASHBOARD/SITEWIDE FUNCTIONALITY (Applies to most pages that include script.js) ---

    // Sidebar toggle for mobile
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Handle logout button (common for all dashboards)
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            localStorage.removeItem('userId');
            window.location.href = '../../index.html'; // Redirect to login page
        });
    });

    // Initialize modals (for modals opened by data-modal-target attributes)
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Open modal by trigger
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => { modal.classList.add('show'); }, 10);
            }
        });
    });

    // Close modal with close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });

    // Close modal when clicking outside of modal content
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => { modal.style.display = 'none'; }, 300);
            }
        });
    });


    // --- GENERIC PERMIT REQUEST FORM LOGIC (if not handled specifically by dashboard JS) ---
    const submitPermitRequest = document.getElementById('submitPermitRequest');
    if (submitPermitRequest) {
        // Initialize permit form fields when modal opens
        const requestPermitBtn = document.querySelector('[data-modal-target="requestPermitModal"]');
        if (requestPermitBtn) {
            requestPermitBtn.addEventListener('click', function() {
                const permitIdField = document.getElementById('permitId');
                if (permitIdField) permitIdField.value = 'PER' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                const today = new Date().toISOString().split('T')[0];
                const startDateField = document.getElementById('startDate');
                if (startDateField) startDateField.value = today;

                const form = document.getElementById('permitRequestForm');
                if (form) {
                    const errorMessages = form.querySelectorAll('.error-message');
                    errorMessages.forEach(message => message.textContent = '');
                }
                calculateEndDate(); // Initial calculation
            });
        }

        // Auto-calculate end date based on duration and start date
        const durationSelect = document.getElementById('duration');
        if (durationSelect) durationSelect.addEventListener('change', calculateEndDate);
        const startDateField = document.getElementById('startDate');
        if (startDateField) startDateField.addEventListener('change', calculateEndDate);

        function calculateEndDate() {
            const duration = document.getElementById('duration')?.value;
            const startDate = document.getElementById('startDate')?.value;
            const endDateField = document.getElementById('endDate');

            if (!duration || !startDate || !endDateField) return;

            let endDate = new Date(startDate);
            switch(duration) {
                case '1-month': endDate.setMonth(endDate.getMonth() + 1); break;
                case '3-months': endDate.setMonth(endDate.getMonth() + 3); break;
                case '6-months': endDate.setMonth(endDate.getMonth() + 6); break;
                case '1-year': endDate.setFullYear(endDate.getFullYear() + 1); break;
                default: return;
            }
            endDateField.value = endDate.toISOString().split('T')[0];
        }

        // Cancel permit request button (closes modal)
        const cancelPermitRequestBtn = document.getElementById('cancelPermitRequest');
        if (cancelPermitRequestBtn) {
            cancelPermitRequestBtn.addEventListener('click', function() {
                const modal = document.getElementById('requestPermitModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => { modal.style.display = 'none'; }, 300);
                }
            });
        }

        // Generic permit request submission logic (if not overridden by specific dashboard JS)
        submitPermitRequest.addEventListener('click', async function() {
            const form = document.getElementById('permitRequestForm');
            if (!form) { console.error('Permit request form not found'); resetSubmitButton(); return; }

            const submitBtn = this;
            const spinner = submitBtn.querySelector('.fa-spinner');
            const buttonText = submitBtn.querySelector('span');
            spinner.style.display = 'inline-block';
            buttonText.textContent = 'Processing...';
            submitBtn.disabled = true;

            const errorMessages = form.querySelectorAll('.error-message');
            errorMessages.forEach(message => message.textContent = '');

            const permitData = {
                permitId: document.getElementById('permitId')?.value,
                employeeId: document.getElementById('employeeId')?.value, // This is `empID`
                permitType: document.getElementById('permitType')?.value,
                ownerType: document.getElementById('ownerType')?.value,
                duration: document.getElementById('duration')?.value,
                vehicleNo: document.getElementById('vehicleNo')?.value,
                vehicleType: document.getElementById('vehicleType')?.value,
                startDate: document.getElementById('startDate')?.value,
                endDate: document.getElementById('endDate')?.value,
                notes: document.getElementById('notes')?.value || ''
            };

            let isValid = true;
            if (!permitData.employeeId) { document.getElementById('employeeIdError').textContent = 'Employee ID is required'; isValid = false; }
            if (!permitData.permitType) { document.getElementById('permitTypeError').textContent = 'Permit type is required'; isValid = false; }
            if (!permitData.duration) { document.getElementById('durationError').textContent = 'Duration is required'; isValid = false; }
            if (!permitData.vehicleNo) { document.getElementById('vehicleNoError').textContent = 'Vehicle number is required'; isValid = false; }
            else if (permitData.vehicleNo.length < 5) { document.getElementById('vehicleNoError').textContent = 'Please enter a valid vehicle number'; isValid = false; }
            if (!permitData.vehicleType) { document.getElementById('vehicleTypeError').textContent = 'Vehicle type is required'; isValid = false; }
            if (!permitData.startDate) { document.getElementById('startDateError').textContent = 'Start date is required'; isValid = false; }

            if (!isValid) {
                resetSubmitButton();
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:5000/api/permits', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(permitData)
                });
                const data = await res.json();

                if (res.ok && data.success) {
                    showNotification('Permit request submitted successfully!', 'success');
                    closeModal();
                } else {
                    showNotification(data.message || 'Failed to submit permit request.', 'error');
                }
            } catch (error) {
                console.error('Error submitting permit request:', error);
                showNotification('An error occurred. Please try again.', 'error');
            } finally {
                resetSubmitButton();
            }
        });

        function resetSubmitButton() {
            const submitBtn = document.getElementById('submitPermitRequest');
            if (submitBtn) {
                const spinner = submitBtn.querySelector('.fa-spinner');
                const buttonText = submitBtn.querySelector('span');
                if (spinner) spinner.style.display = 'none';
                if (buttonText) buttonText.textContent = 'Submit Request';
                submitBtn.disabled = false;
            }
        }
    }


    // Initialize date pickers (using flatpickr)
    const datePickers = document.querySelectorAll('.date-picker');
    if (datePickers.length > 0 && typeof flatpickr !== 'undefined') {
        datePickers.forEach(dp => {
            flatpickr(dp, {
                enableTime: dp.classList.contains('with-time'),
                dateFormat: dp.classList.contains('with-time') ? "Y-m-d H:i" : "Y-m-d"
            });
        });
    }

       
    // ===== NEW VIOLATION FUNCTIONALITY =====
    
    // Load user violations when on violations page
    if (window.location.pathname.includes('violations.html')) {
        loadUserViolations();
    }

    // Function to load violations for the current user
    async function loadUserViolations() {
  const userId   = localStorage.getItem('userId');
  const userType = localStorage.getItem('userRole');
  const token    = localStorage.getItem('token');

  if (!userId || !token) return showViolationError('Please log in.');

  const res = await fetch(
    `http://localhost:5000/api/violations/user/${userId}?userType=${userType}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );

            
  const data = await res.json();
  if (data.success) {
    populateViolationsTable(data.violations);
    updateViolationStats(data.violations);
  } else {
    showViolationError(data.error);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (location.pathname.endsWith('violations.html')) {
    loadUserViolations();
  }
});

    // Function to populate violations table
    function populateViolationsTable(violations) {
  const tbody = document.querySelector('.data-table tbody');
  tbody.innerHTML = '';

  if (violations.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6">No violations found.</td></tr>';
    return;
  }

  violations.forEach(v => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDate(v.date)}</td>
      <td>${v.vehicleNo}</td>
      <td>${v.violationType}</td>
      <td>$${v.fineAmount.toFixed(2)}</td>
      <td>${capitalizeFirstLetter(v.status || 'pending')}</td>
      <td>
        ${v.status === 'pending'
          ? `<button onclick="acknowledgeViolation('${v._id}')">Ack</button>
             <button onclick="resolveViolation('${v._id}')">Resolve</button>`
          : `<span>—</span>`
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

    // Function to update violation statistics
    function updateViolationStats(violations) {
        const stats = {
            total: violations.length,
            pending: violations.filter(v => !v.status || v.status === 'pending').length,
            acknowledged: violations.filter(v => v.status === 'acknowledged').length,
            resolved: violations.filter(v => v.status === 'resolved' || v.resolved).length
        };

        // Update stats in UI if elements exist
        const totalElement = document.getElementById('totalViolations');
        const pendingElement = document.getElementById('pendingViolations');
        const acknowledgedElement = document.getElementById('acknowledgedViolations');
        const resolvedElement = document.getElementById('resolvedViolations');

        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (acknowledgedElement) acknowledgedElement.textContent = stats.acknowledged;
        if (resolvedElement) resolvedElement.textContent = stats.resolved;
    }

    //resolve
    async function resolveViolation(id) {
  const token = localStorage.getItem('token');
  const res = await fetch(`http://localhost:5000/api/violations/${id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status: 'resolved' })
  });
  const data = await res.json();
  if (data.success) loadUserViolations();
}


    // Global functions for violation actions
    window.acknowledgeViolation = async function(violationId) {
        await updateViolationStatus(violationId, 'acknowledged');
    };

    window.resolveViolation = async function(violationId) {
        await updateViolationStatus(violationId, 'resolved');
    };

    // Function to update violation status
    async function updateViolationStatus(violationId, status) {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showNotification('Authentication required', 'error');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/api/violations/${violationId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                showNotification(`Violation ${status} successfully!`, 'success');
                // Reload violations to show updated status
                loadUserViolations();
            } else {
                throw new Error(data.error || 'Failed to update status');
            }
        } catch (error) {
            console.error('Error updating violation status:', error);
            showNotification('Failed to update violation status', 'error');
        }
    }

    // Helper function to show violation loading error
    function showViolationError(message) {
        const tableBody = document.querySelector('.data-table tbody');
        
        const errorHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 2rem;">
                    <div style="color: #e74c3c;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <h3 style="margin: 0 0 1rem 0;">Error Loading Violations</h3>
                        <p style="margin: 0 0 1rem 0;">${message}</p>
                        <button class="btn btn-primary" onclick="loadUserViolations()">Retry</button>
                    </div>
                </td>
            </tr>
        `;
        
        if (tableBody) {
            tableBody.innerHTML = errorHTML;
        }
    }

    // ===== END VIOLATION FUNCTIONALITY =====

    // Dynamic Violations Table Rendering (for all dashboards)
    const violationsData = [
        {
            date: '',
            vehicle: '',
            description: '',
            fine: 5.00,
            status: ''
        }
       
    ];

    function renderViolationsTable(tableSelector, data) {
        const table = document.querySelector(tableSelector);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;
        tbody.innerHTML = '';
        data.forEach((v, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${v.date}</td>
                <td>${v.vehicle}</td>
                <td>${v.description}</td>
                <td>$${v.fine.toFixed(2)}</td>
                <td><span class="status-badge status-pending">Pending</span></td>
                <td>
                    <button class="btn btn-primary btn-sm pay-fine-btn" data-index="${idx}">Pay Fine</button>
                    <button class="btn btn-secondary btn-sm dispute-btn" data-index="${idx}">Dispute</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Render violations if table exists
    renderViolationsTable('.card .data-table', violationsData);

    // Registration link handling (from index.html)
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }
// Public parking link handling (from index.html)
    const publicParkingLink = document.getElementById('publicParkingLink');
    if (publicParkingLink) {
        publicParkingLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'Home.html';
        });
    }
}); // End of DOMContentLoaded