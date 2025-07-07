document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Only run login-related code if the form exists
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
});

    // Sidebar toggle for mobile
    const sidebarToggleBtn = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    if (sidebarToggleBtn && sidebar) {
        sidebarToggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }

    // Handle logout button
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../index.html';
        });
    });

    // Initialize modals
    const modalTriggers = document.querySelectorAll('[data-modal-target]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal');

    // Open modal
    modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', () => {
            const modalId = trigger.getAttribute('data-modal-target');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                setTimeout(() => {
                    modal.classList.add('show');
                }, 10);
            }
        });
    });

    // Close modal with close button
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300); // Match transition duration in CSS
            }
        });
    });

    // Close modal when clicking outside of modal content
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300); // Match transition duration in CSS
            }
        });
    });

    // Handle permit request form submission 
    const submitPermitRequest = document.getElementById('submitPermitRequest');
    if (submitPermitRequest) {
        // Generate unique permit ID when the modal is opened
        const requestPermitBtn = document.querySelector('[data-modal-target="requestPermitModal"]');
        if (requestPermitBtn) {
            requestPermitBtn.addEventListener('click', function() {
                try {
                    // Generate a unique permit ID
                    const permitId = 'PER' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
                    const permitIdField = document.getElementById('permitId');
                    if (permitIdField) permitIdField.value = permitId;
                    
                    // Set default start date to today
                    const today = new Date().toISOString().split('T')[0];
                    const startDateField = document.getElementById('startDate');
                    if (startDateField) startDateField.value = today;
                    
                    // Reset form fields
                    const form = document.getElementById('permitRequestForm');
                    if (form) {
                        // Reset all error messages
                        const errorMessages = form.querySelectorAll('.error-message');
                        errorMessages.forEach(message => message.textContent = '');
                        
                        // Reset input fields except for readonly ones
                        const fields = form.querySelectorAll('input:not([readonly]), select, textarea');
                        fields.forEach(field => {
                            if (field.id !== 'permitId' && field.id !== 'startDate') {
                                if (field.id === 'ownerType') {
                                    field.value = 'employee';
                                } else {
                                    field.value = '';
                                }
                            }
                        });
                        
                        // Clear end date
                        const endDateField = document.getElementById('endDate');
                        if (endDateField) endDateField.value = '';
                    }
                } catch (error) {
                    console.error('Error initializing permit form:', error);
                }
            });
        }
        
        // Handle duration change to auto-calculate end date
        const durationSelect = document.getElementById('duration');
        if (durationSelect) {
            durationSelect.addEventListener('change', calculateEndDate);
        }
        
        const startDateField = document.getElementById('startDate');
        if (startDateField) {
            startDateField.addEventListener('change', calculateEndDate);
        }
        
        //get violation
        function loadUserViolations(userId) {
  fetch(`http://localhost:5000/api/violations/user/${userId}`)
    .then(res => res.json())
    .then(data => {
      // Populate your employee violations table
      console.log(data); // For now, show in console
    })
    .catch(err => console.error(" Failed to load user violations:", err));
}



        // Function to calculate end date based on duration and start date
        function calculateEndDate() {
            try {
                const duration = document.getElementById('duration')?.value;
                const startDate = document.getElementById('startDate')?.value;
                const endDateField = document.getElementById('endDate');
                
                if (!duration || !startDate || !endDateField) return;
                
                // Calculate end date based on duration
                let endDate = new Date(startDate);
                switch(duration) {
                    case '1-month':
                        endDate.setMonth(endDate.getMonth() + 1);
                        break;
                    case '3-months':
                        endDate.setMonth(endDate.getMonth() + 3);
                        break;
                    case '6-months':
                        endDate.setMonth(endDate.getMonth() + 6);
                        break;
                    case '1-year':
                        endDate.setFullYear(endDate.getFullYear() + 1);
                        break;
                    default:
                        return;
                }
                
                // Format end date
                const formattedEndDate = endDate.toISOString().split('T')[0];
                endDateField.value = formattedEndDate;
            } catch (error) {
                console.error('Error calculating end date:', error);
            }
        }
        
        // Add event listener for the cancel button
        const cancelPermitRequestBtn = document.getElementById('cancelPermitRequest');
        if (cancelPermitRequestBtn) {
            cancelPermitRequestBtn.addEventListener('click', function() {
                const modal = document.getElementById('requestPermitModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300); // Match transition duration in CSS
                }
            });
        }
        
        submitPermitRequest.addEventListener('click', function() {
            try {
                // Show loading spinner
                const spinner = this.querySelector('.fa-spinner');
                const buttonText = this.querySelector('span');
                if (spinner) spinner.style.display = 'inline-block';
                if (buttonText) buttonText.textContent = 'Processing...';
                this.disabled = true;
                
                const form = document.getElementById('permitRequestForm');
                if (!form) {
                    console.error('Permit request form not found');
                    resetSubmitButton();
                    return;
                }
                
                // Clear all previous error messages
                const errorMessages = form.querySelectorAll('.error-message');
                errorMessages.forEach(message => message.textContent = '');
                
                // Get form field values
                const permitId = document.getElementById('permitId')?.value;
                const employeeId = document.getElementById('employeeId')?.value;
                const permitType = document.getElementById('permitType')?.value;
                const ownerType = document.getElementById('ownerType')?.value;
                const duration = document.getElementById('duration')?.value;
                const vehicleNo = document.getElementById('vehicleNo')?.value;
                const vehicleType = document.getElementById('vehicleType')?.value;
                const startDate = document.getElementById('startDate')?.value;
                const endDate = document.getElementById('endDate')?.value;
                
                // Perform validation
                let isValid = true;
                
                if (!employeeId) {
                    const employeeIdError = document.getElementById('employeeIdError');
                    if (employeeIdError) employeeIdError.textContent = 'Employee ID is required';
                    isValid = false;
                }
                
                if (!permitType) {
                    const permitTypeError = document.getElementById('permitTypeError');
                    if (permitTypeError) permitTypeError.textContent = 'Permit type is required';
                    isValid = false;
                }
                
                if (!duration) {
                    const durationError = document.getElementById('durationError');
                    if (durationError) durationError.textContent = 'Duration is required';
                    isValid = false;
                }
                
                if (!vehicleNo) {
                    const vehicleNoError = document.getElementById('vehicleNoError');
                    if (vehicleNoError) vehicleNoError.textContent = 'Vehicle number is required';
                    isValid = false;
                } else if (vehicleNo.length < 5) {
                    const vehicleNoError = document.getElementById('vehicleNoError');
                    if (vehicleNoError) vehicleNoError.textContent = 'Please enter a valid vehicle number';
                    isValid = false;
                }
                
                if (!vehicleType) {
                    const vehicleTypeError = document.getElementById('vehicleTypeError');
                    if (vehicleTypeError) vehicleTypeError.textContent = 'Vehicle type is required';
                    isValid = false;
                }
                
                if (!startDate) {
                    const startDateError = document.getElementById('startDateError');
                    if (startDateError) startDateError.textContent = 'Start date is required';
                    isValid = false;
                }
                
                if (!isValid) {
                    resetSubmitButton();
                    return;
                }
                
                // Prepare data for submission (in a real app, this would be sent to the server)
                const permitData = {
                    permitId: permitId,
                    employeeId: employeeId,
                    permitType: permitType,
                    ownerType: ownerType,
                    duration: duration,
                    vehicleNo: vehicleNo,
                    vehicleType: vehicleType,
                    startDate: startDate,
                    endDate: endDate,
                    notes: document.getElementById('notes')?.value || ''
                };
                
                console.log('Permit request data:', permitData);
                
                // Simulate server request
                setTimeout(() => {
                    // Update the UI to show the new permit (for demo purposes)
                    const statusBadge = document.querySelector('.permit-status .status-badge');
                    if (statusBadge) {
                        statusBadge.textContent = `Active until ${endDate}`;
                        statusBadge.className = 'status-badge status-active';
                    }
                    
                    const permitDetail = document.querySelector('.permit-detail');
                    if (permitDetail) {
                        permitDetail.textContent = `Vehicle: ${vehicleNo} (${capitalizeFirstLetter(vehicleType)})`;
                    }
                    
                    // Submit the request
                    showNotification('Permit request submitted successfully!', 'success');
                    
                    // Close the modal
                    const modal = document.getElementById('requestPermitModal');
                    if (modal) {
                        modal.classList.remove('show');
                        setTimeout(() => {
                            modal.style.display = 'none';
                            // Reset form after modal is hidden
                            if (form) {
                                // Careful reset to maintain permitId and other needed fields
                                const inputs = form.querySelectorAll('input:not([readonly]), select:not(#ownerType), textarea');
                                inputs.forEach(input => {
                                    if (input.id !== 'permitId' && input.id !== 'startDate') {
                                        input.value = '';
                                    }
                                });
                            }
                            resetSubmitButton();
                        }, 300);
                    }
                }, 1000); // Simulate a 1-second server delay
                
            } catch (error) {
                console.error('Error submitting permit request:', error);
                showNotification('An error occurred. Please try again.', 'error');
                resetSubmitButton();
            }
        });
        
        // Helper function to reset the submit button state
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

    // Initialize date pickers if needed
    const datePickers = document.querySelectorAll('.date-picker');
    if (datePickers.length > 0 && typeof flatpickr !== 'undefined') {
        datePickers.forEach(dp => {
            flatpickr(dp, {
                enableTime: dp.classList.contains('with-time'),
                dateFormat: dp.classList.contains('with-time') ? "Y-m-d H:i" : "Y-m-d"
            });
        });
    }

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

    // Modal logic
    function showModal(contentHtml) {
        let modal = document.getElementById('dynamicModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'dynamicModal';
            modal.className = 'modal';
            modal.innerHTML = `<div class="modal-content"></div>`;
            document.body.appendChild(modal);
        }
        modal.querySelector('.modal-content').innerHTML = contentHtml;
        modal.classList.add('show');
        // Close modal on click outside or on close button
        modal.onclick = (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                modal.classList.remove('show');
            }
        };
    }

    // Notification logic
    function showNotification(message, type = 'success') {
        let notif = document.createElement('div');
        notif.className = `notification ${type}`;
        notif.textContent = message;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 10);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2500);
    }

    // Delegate Pay Fine/Dispute button clicks
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('pay-fine-btn')) {
            const idx = e.target.getAttribute('data-index');
            const v = violationsData[idx];
            showModal(`
                <div class="modal-header">
                    <h2>Pay Violation Fine</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Date:</strong> ${v.date}</p>
                    <p><strong>Vehicle:</strong> ${v.vehicle}</p>
                    <p><strong>Description:</strong> ${v.description}</p>
                    <p><strong>Fine Amount:</strong> $${v.fine.toFixed(2)}</p>
                    <button class="btn btn-primary confirm-pay-btn" data-index="${idx}">Confirm Payment</button>
                </div>
            `);
        }
        if (e.target.classList.contains('dispute-btn')) {
            const idx = e.target.getAttribute('data-index');
            const v = violationsData[idx];
            showModal(`
                <div class="modal-header">
                    <h2>Dispute Violation</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <p><strong>Date:</strong> ${v.date}</p>
                    <p><strong>Vehicle:</strong> ${v.vehicle}</p>
                    <p><strong>Description:</strong> ${v.description}</p>
                    <form id="disputeForm">
                        <label for="reason">Reason:</label>
                        <input type="text" id="reason" class="form-control" required>
                        <button class="btn btn-primary submit-dispute-btn" data-index="${idx}" type="submit">Submit Dispute</button>
                    </form>
                </div>
            `);
        }
        if (e.target.classList.contains('confirm-pay-btn')) {
            showNotification('Payment successful!', 'success');
            document.getElementById('dynamicModal').classList.remove('show');
        }
    });

    // Handle dispute form submit
    document.body.addEventListener('submit', function(e) {
        if (e.target && e.target.id === 'disputeForm') {
            e.preventDefault();
            showNotification('Dispute submitted!', 'success');
            document.getElementById('dynamicModal').classList.remove('show');
        }
    });

    // Registration link handling
    const registerLink = document.getElementById('registerLink');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'register.html';
        });
    }

    // Public parking link handling
    document.addEventListener('DOMContentLoaded', function () {
    const publicParkingLink = document.getElementById('publicParkingLink');
    if (publicParkingLink) {
        publicParkingLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '../Home.html';
         
        
        });
    }
});




// Utility function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Mock functions for API calls (in real app, these would make actual API calls)
function fetchUserData(userId) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: userId,
                name: 'John Doe',
                email: 'john.doe@example.com',
                role: 'employee'
            });
        }, 300);
    });
}

function fetchPermits(userId) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: '',
                    vehicle: 'ABC123',
                    type: 'Car',
                    validUntil: '',
                    status: 'active'
                }
            ]);
        }, 300);
    });
}

function fetchViolations(userId) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'V789012',
                    date: '2025-02-10',
                    description: 'Parked in unauthorized area',
                    fine: 50.00,
                    status: 'pending'
                }
            ]);
        }, 300);
    });
}

function fetchParkingHistory(userId) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([
                {
                    id: 'H123456',
                    vehicle: 'ABC123',
                    date: '2025-03-14',
                    entryTime: '09:15',
                    exitTime: '17:30',
                    slot: 'A12',
                    status: 'completed'
                }
            ]);
        }, 300);
    });
}

