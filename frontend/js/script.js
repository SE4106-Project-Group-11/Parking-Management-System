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
                    localStorage.setItem('userId', data.user.id); // Store MongoDB _id consistently

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
            localStorage.removeItem('userId'); // Remove consistently
            localStorage.removeItem('userVehicleType'); // Remove visitor's vehicle type if stored
            localStorage.removeItem('dbUserId'); // Clean up old key if it was ever used
            alert('You have been logged out.');
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


    // --- VIOLATION FUNCTIONALITY (Only applicable if included on the page) ---

    // Load user violations when on violations page (or a page that includes a data-table tbody)
    if (document.querySelector('.data-table tbody')) { // Check if violations table exists
        // Added this event listener to ensure loadUserViolations runs consistently on relevant pages
        window.addEventListener('load', loadUserViolations); // Using 'load' for initial fetch
    }

    // Function to load violations for the current user
    async function loadUserViolations() {
        const userId = localStorage.getItem('userId');
        const userType = localStorage.getItem('userRole');
        const token = localStorage.getItem('token');

        // Only load if user is employee or admin, and tokens are present
        if (!userId || !token || (userType !== 'employee' && userType !== 'admin')) {
             // If table exists, show specific message for visitors/non-employees if they navigate here
            const tableBody = document.querySelector('.data-table tbody');
            if (tableBody) {
                tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #666;">Violations are primarily for Employees/Admins.</td></tr>';
            }
            return showViolationError('Access restricted or no violations to display.');
        }

        try {
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
                showViolationError(data.error || data.message || 'Failed to fetch violations.');
            }
        } catch (error) {
            console.error('Error fetching user violations:', error);
            showViolationError('Could not load violations. Server or network issue.');
        }
    }

    // Function to populate violations table
    function populateViolationsTable(violations) {
        const tbody = document.querySelector('.data-table tbody');
        if (!tbody) return;
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
                <td>$${v.fineAmount ? v.fineAmount.toFixed(2) : '0.00'}</td>
                <td>${capitalizeFirstLetter(v.status || 'pending')}</td>
                <td>
                    ${v.status === 'pending' || v.status === 'disputed'
                        ? `<button class="btn btn-sm btn-primary pay-fine-btn" data-violation-id="${v._id}">Pay</button>
                           <button class="btn btn-sm btn-secondary dispute-btn" data-violation-id="${v._id}">Dispute</button>`
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
            pending: violations.filter(v => !v.status || v.status === 'pending' || v.status === 'disputed').length,
            paid: violations.filter(v => v.status === 'paid').length,
            resolved: violations.filter(v => v.status === 'resolved').length
        };

        const totalElement = document.getElementById('totalViolations');
        const pendingElement = document.getElementById('pendingViolations');
        const paidElement = document.getElementById('paidViolations'); // Assuming an element for paid
        const resolvedElement = document.getElementById('resolvedViolations');

        if (totalElement) totalElement.textContent = stats.total;
        if (pendingElement) pendingElement.textContent = stats.pending;
        if (paidElement) paidElement.textContent = stats.paid;
        if (resolvedElement) resolvedElement.textContent = stats.resolved;

        // For the employee dashboard's 'Pending Fines' overview
        const pendingFinesDisplay = document.getElementById('pendingFines');
        if (pendingFinesDisplay) {
            const totalPendingFine = violations
                                        .filter(v => v.status === 'pending' || v.status === 'disputed')
                                        .reduce((sum, v) => sum + (v.fineAmount || 0), 0);
            pendingFinesDisplay.textContent = `$${totalPendingFine.toFixed(2)}`;
        }
    }

    // Global functions for violation actions (pay, dispute, acknowledge, resolve)
    // These functions assume modals for pay/dispute are handled by page-specific JS (like employee.js)
    // Or, you could integrate showModal here if you want generic modals.
    // Given the employee.js handles modals, it's better to keep actions there.
    // The previous script.js had acknowledge/resolve directly, I'm keeping those.

    window.acknowledgeViolation = async function(violationId) {
        await updateViolationStatus(violationId, 'acknowledged');
    };

    window.resolveViolation = async function(violationId) {
        await updateViolationStatus(violationId, 'resolved');
    };

    // Function to update violation status (backend call)
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
                loadUserViolations(); // Reload to update table
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
        if (!tableBody) return;

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
        tableBody.innerHTML = errorHTML;
    }

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