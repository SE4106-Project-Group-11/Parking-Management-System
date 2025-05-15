// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Sample data
    const permitRequests = [
        {
            employeeId: 'EMP001',
            name: 'John Doe',
            vehicleNo: 'ABC123',
            requestDate: '2025-03-14',
            status: 'rejected'
        },
        {
            employeeId: 'EMP002',
            name: 'Jane Smith',
            vehicleNo: 'XYZ789',
            requestDate: '2025-03-13',
            status: 'approved'
        }
    ];

    // Sample user data for search functionality
    const users = [
        {
            id: 'EMP001',
            name: 'John Doe',
            email: 'john.doe@example.com',
            department: 'IT Department',
            vehicleNo: 'ABC123',
            permitStatus: 'Expired',
            userType: 'employee'
        },
        {
            id: 'EMP002',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            department: 'HR Department',
            vehicleNo: 'XYZ789',
            permitStatus: 'Active',
            userType: 'employee'
        },
        {
            id: 'VIS001',
            name: 'Bob Johnson',
            email: 'bob.johnson@example.com',
            department: 'N/A',
            vehicleNo: 'DEF456',
            permitStatus: 'Active',
            userType: 'visitor'
        },
        {
            id: 'NEM001',
            name: 'Sarah Wilson',
            email: 'sarah.wilson@example.com',
            department: 'N/A',
            vehicleNo: 'GHI789',
            permitStatus: 'Active',
            userType: 'nonemployee'
        }
    ];

    // Sample violations data
    const violations = [
        {
            id: 'VIO001',
            vehicleNo: 'ABC123',
            date: '2025-02-10',
            violationType: 'Parking in unauthorized area',
            fineAmount: 50.00,
            userType: 'employee',
            userId: 'EMP001'
        },
        {
            id: 'VIO002',
            vehicleNo: 'DEF456',
            date: '2025-03-01',
            violationType: 'Overstayed parking limit',
            fineAmount: 30.00,
            userType: 'visitor',
            userId: 'VIS001'
        }
    ];

    // Sample visitors data
    const visitors = [
        {
            id: 'VIS001',
            name: 'Bob Johnson',
            nic: '956123789V',
            username: 'bob.johnson',
            password: 'password123',
            phone: '555-123-4567',
            email: 'bob.johnson@example.com',
            address: '123 Main St, Anytown, USA',
            purpose: 'Business Meeting',
            vehicleNo: 'DEF456'
        },
        {
            id: 'VIS002',
            name: 'Alice Brown',
            nic: '986543210V',
            username: 'alice.brown',
            password: 'securepass',
            phone: '555-987-6543',
            email: 'alice.brown@example.com',
            address: '456 Oak Ave, Somewhere, USA',
            purpose: 'Interview',
            vehicleNo: 'JKL012'
        }
    ];

    // Sample non-employees data
    const nonEmployees = [
        {
            id: 'NEM001',
            name: 'Sarah Wilson',
            nic: '978654321V',
            username: 'sarah.wilson',
            password: 'pass456',
            phone: '555-567-8901',
            email: 'sarah.wilson@example.com',
            address: '789 Pine Rd, Somewhere, USA',
            vehicleNo: 'GHI789',
            permitType: 'monthly',
            permitStatus: 'Active',
            permitValidUntil: '2025-04-15'
        },
        {
            id: 'NEM002',
            name: 'Michael Davis',
            nic: '912345678V',
            username: 'michael.davis',
            password: 'securepass123',
            phone: '555-234-5678',
            email: 'michael.davis@example.com',
            address: '101 Maple St, Somewhere, USA',
            vehicleNo: 'MNO345',
            permitType: 'quarterly',
            permitStatus: 'Active',
            permitValidUntil: '2025-06-20'
        }
    ];

    // Initialize the dashboard
    initAdminDashboard();

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

    // Function to initialize the admin dashboard
    function initAdminDashboard() {
        populatePermitRequestsTable();
        updateStatusCounts();
        setupSearchFunctionality();
        setupViolationForm();
        setupVisitorsTable();
        setupNonEmployeesTable();
        setupVisitorForm();
        setupNonEmployeeForm();
        updateViolationsTable();
        setupBulkQRCodeGeneration();
        setupModalControls(); // Initialize modal controls
    }

    // Function to populate the permit requests table
    function populatePermitRequestsTable() {
        const tableBody = document.getElementById('permitRequestsTable');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        permitRequests.forEach(permit => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${permit.employeeId}</td>
                <td>${permit.name}</td>
                <td>${permit.vehicleNo}</td>
                <td>${permit.requestDate}</td>
                <td><span class="status-badge ${permit.status}">${permit.status}</span></td>
                <td class="btn-actions">
                    ${permit.status === 'pending' ? 
                        `<button class="btn btn-primary btn-sm approve-btn" data-id="${permit.employeeId}">Approve</button>
                         <button class="btn btn-danger btn-sm reject-btn" data-id="${permit.employeeId}">Reject</button>` : 
                        `<button class="btn btn-primary btn-sm view-btn" data-id="${permit.employeeId}">View</button>`
                    }
                </td>
            `;
            
            tableBody.appendChild(row);
        });

        // Add event listeners for the approve/reject buttons
        document.querySelectorAll('.approve-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const employeeId = this.getAttribute('data-id');
                approvePermitRequest(employeeId);
            });
        });

        document.querySelectorAll('.reject-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const employeeId = this.getAttribute('data-id');
                rejectPermitRequest(employeeId);
            });
        });
    }

    // Function to update the status counts
    function updateStatusCounts() {
        const pendingCount = permitRequests.filter(permit => permit.status === 'pending').length;
        const approvedCount = permitRequests.filter(permit => permit.status === 'approved').length;
        
        const pendingCountEl = document.getElementById('pendingCount');
        const approvedCountEl = document.getElementById('approvedCount');
        
        if (pendingCountEl) pendingCountEl.textContent = pendingCount;
        if (approvedCountEl) approvedCountEl.textContent = approvedCount;
    }

    // Function to approve a permit request
    function approvePermitRequest(employeeId) {
        const permitIndex = permitRequests.findIndex(permit => permit.employeeId === employeeId);
        if (permitIndex !== -1) {
            permitRequests[permitIndex].status = 'approved';
            showNotification(`Permit for ${permitRequests[permitIndex].name} approved successfully.`, 'success');
            
            // Refresh the dashboard
            initAdminDashboard();
        }
    }

    // Function to reject a permit request
    function rejectPermitRequest(employeeId) {
        const permitIndex = permitRequests.findIndex(permit => permit.employeeId === employeeId);
        if (permitIndex !== -1) {
            permitRequests[permitIndex].status = 'rejected';
            showNotification(`Permit for ${permitRequests[permitIndex].name} rejected.`, 'error');
            
            // Refresh the dashboard
            initAdminDashboard();
        }
    }

    // Setup search functionality
    function setupSearchFunctionality() {
        const searchBtn = document.getElementById('searchBtn');
        const employeeSearch = document.getElementById('employeeSearch');
        const searchResultsContainer = document.getElementById('searchResults');
        
        if (!searchBtn || !employeeSearch) return;
        
        searchBtn.addEventListener('click', function() {
            const searchTerm = employeeSearch.value.trim().toLowerCase();
            if (!searchTerm) {
                showNotification('Please enter a search term', 'error');
                return;
            }
            
            // Search for users by ID or vehicle number
            const results = users.filter(user => 
                user.id.toLowerCase().includes(searchTerm) || 
                user.vehicleNo.toLowerCase().includes(searchTerm)
            );
            
            // Display search results
            displaySearchResults(results, searchResultsContainer);
        });
    }
    
    // Display search results in the container
    function displaySearchResults(results, container) {
        if (!container) return;
        
        if (results.length === 0) {
            container.innerHTML = '<div class="card"><div class="card-body"><p>No results found.</p></div></div>';
            return;
        }
        
        let html = '<div class="card"><div class="card-body">';
        html += '<h3>Search Results</h3>';
        html += '<table class="data-table">';
        html += '<thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Vehicle No.</th><th>Permit Status</th><th>User Type</th><th>Actions</th></tr></thead>';
        html += '<tbody>';
        
        results.forEach(user => {
            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${user.vehicleNo}</td>
                    <td><span class="status-badge ${user.permitStatus.toLowerCase()}">${user.permitStatus}</span></td>
                    <td>${capitalizeFirstLetter(user.userType)}</td>
                    <td class="btn-actions">
                        <button class="btn btn-primary btn-sm view-user-btn" data-id="${user.id}">View Details</button>
                        <button class="btn btn-warning btn-sm create-violation-btn" data-vehicle="${user.vehicleNo}" data-user="${user.userType}" data-id="${user.id}">Create Violation</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div></div>';
        container.innerHTML = html;
        
        // Add event listeners for the view and create violation buttons
        document.querySelectorAll('.view-user-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const userId = this.getAttribute('data-id');
                viewUserDetails(userId);
            });
        });
        
        document.querySelectorAll('.create-violation-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const vehicleNo = this.getAttribute('data-vehicle');
                const userType = this.getAttribute('data-user');
                const userId = this.getAttribute('data-id');
                openViolationModal(vehicleNo, userType, userId);
            });
        });
    }
    
    // View user details
    function viewUserDetails(userId) {
        const user = users.find(u => u.id === userId);
        if (!user) return;
        
        let html = `
            <div class="modal-header">
                <h2>User Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="user-details">
                    <p><strong>ID:</strong> ${user.id}</p>
                    <p><strong>Name:</strong> ${user.name}</p>
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Vehicle No.:</strong> ${user.vehicleNo}</p>
                    <p><strong>Permit Status:</strong> <span class="status-badge ${user.permitStatus.toLowerCase()}">${user.permitStatus}</span></p>
                    <p><strong>User Type:</strong> ${capitalizeFirstLetter(user.userType)}</p>
                    ${user.userType === 'employee' ? `<p><strong>Department:</strong> ${user.department}</p>` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-warning create-violation-btn" data-vehicle="${user.vehicleNo}" data-user="${user.userType}" data-id="${user.id}">Create Violation</button>
                <button class="btn btn-primary generate-qr-btn" data-id="${user.id}" data-type="${user.userType}">Generate QR Code</button>
            </div>
        `;
        
        openModal(html);
        
        // Add event listener for create violation button
        document.querySelector('.modal .create-violation-btn').addEventListener('click', function() {
            const vehicleNo = this.getAttribute('data-vehicle');
            const userType = this.getAttribute('data-user');
            const userId = this.getAttribute('data-id');
            closeModal();
            openViolationModal(vehicleNo, userType, userId);
        });

        // Add event listener for QR code generation
        document.querySelector('.modal .generate-qr-btn').addEventListener('click', function() {
            const userId = this.getAttribute('data-id');
            const userType = this.getAttribute('data-type');
            generateQRCode(userId, userType);
        });
    }
    
    // Setup violation form
    function setupViolationForm() {
        const createViolationBtn = document.getElementById('createViolationBtn');
        if (createViolationBtn) {
            createViolationBtn.addEventListener('click', function() {
                openViolationModal();
            });
        }
    }
    
    // Open violation modal
    function openViolationModal(vehicleNo = '', userType = '', userId = '') {
        const nextViolationId = 'VIO' + (violations.length + 1).toString().padStart(3, '0');
        const currentDate = new Date().toISOString().split('T')[0];
        
        let html = `
            <div class="modal-header">
                <h2>Create Violation</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <form id="violationForm">
                    <div class="form-group">
                        <label for="violationId">Violation ID</label>
                        <input type="text" id="violationId" class="form-control" value="${nextViolationId}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="violationVehicleNo">Vehicle No.</label>
                        <input type="text" id="violationVehicleNo" class="form-control" value="${vehicleNo}" required>
                    </div>
                    <div class="form-group">
                        <label for="violationDate">Date</label>
                        <input type="date" id="violationDate" class="form-control" value="${currentDate}" required>
                    </div>
                    <div class="form-group">
                        <label for="violationType">Violation Type</label>
                        <select id="violationType" class="form-control" required>
                            <option value="">Select Violation Type</option>
                            <option value="Parking in unauthorized area">Parking in unauthorized area</option>
                            <option value="Overstayed parking limit">Overstayed parking limit</option>
                            <option value="Parking without permit">Parking without permit</option>
                            <option value="Blocking emergency access">Blocking emergency access</option>
                            <option value="Improper parking">Improper parking</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="fineAmount">Fine Amount ($)</label>
                        <input type="number" id="fineAmount" class="form-control" min="1" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="violationMessage">Message</label>
                        <textarea id="violationMessage" class="form-control" rows="3" placeholder="Additional details about the violation"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="userType">Owner Type</label>
                        <select id="userType" class="form-control" required>
                            <option value="">Select Owner Type</option>
                            <option value="employee" ${userType === 'employee' ? 'selected' : ''}>Employee</option>
                            <option value="nonemployee" ${userType === 'nonemployee' ? 'selected' : ''}>Non-Employee</option>
                            <option value="visitor" ${userType === 'visitor' ? 'selected' : ''}>Visitor</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="userId">User ID</label>
                        <input type="text" id="userId" class="form-control" value="${userId}" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Cancel</button>
                <button class="btn btn-primary" id="submitViolationBtn">Submit Violation</button>
            </div>
        `;
        
        let modal = document.querySelector('.modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Add event listener for submit violation button
        document.getElementById('submitViolationBtn').addEventListener('click', function() {
            submitViolation();
        });
        
        // Close modal when clicking close button or outside modal
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Submit violation
    function submitViolation() {
        const violationId = document.getElementById('violationId').value;
        const vehicleNo = document.getElementById('violationVehicleNo').value;
        const date = document.getElementById('violationDate').value;
        const violationType = document.getElementById('violationType').value;
        const fineAmount = parseFloat(document.getElementById('fineAmount').value);
        const violationMessage = document.getElementById('violationMessage')?.value || '';
        const userType = document.getElementById('userType').value;
        const userId = document.getElementById('userId').value;
        
        // Validate form
        if (!vehicleNo || !date || !violationType || isNaN(fineAmount) || !userType || !userId) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        // Create new violation
        const newViolation = {
            id: violationId,
            vehicleNo,
            date,
            violationType,
            fineAmount,
            message: violationMessage,
            userType,
            userId
        };
        
        // Add to violations array (in a real app, this would be an API call)
        violations.push(newViolation);
        
        // Show success notification
        showNotification('Violation created successfully', 'success');
        
        // Close modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
        
        // Update violations table if it exists
        updateViolationsTable();
    }
    
    // Update violations table
    function updateViolationsTable() {
        const violationsTable = document.getElementById('violationsTable');
        if (!violationsTable) return;
        
        violationsTable.innerHTML = '';
        
        violations.forEach(violation => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${violation.id}</td>
                <td>${violation.vehicleNo}</td>
                <td>${violation.date}</td>
                <td>${violation.violationType}</td>
                <td>$${violation.fineAmount.toFixed(2)}</td>
                <td>${capitalizeFirstLetter(violation.userType)}</td>
                <td>${violation.userId}</td>
                <td class="btn-actions">
                    <button class="btn btn-primary btn-sm view-violation-btn" data-id="${violation.id}">View</button>
                    <button class="btn btn-danger btn-sm delete-violation-btn" data-id="${violation.id}">Delete</button>
                </td>
            `;
            
            violationsTable.appendChild(row);
        });
        
        // Add event listeners for view and delete buttons
        document.querySelectorAll('.view-violation-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const violationId = this.getAttribute('data-id');
                viewViolation(violationId);
            });
        });
        
        document.querySelectorAll('.delete-violation-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const violationId = this.getAttribute('data-id');
                deleteViolation(violationId);
            });
        });

        // Update violation counts
        updateViolationCounts();
    }

    // Update violation counts
    function updateViolationCounts() {
        const newCountEl = document.getElementById('newCount');
        const resolvedCountEl = document.getElementById('resolvedCount');
        
        // For demo purposes - consider violations in last 7 days as "new"
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const newViolations = violations.filter(v => new Date(v.date) >= oneWeekAgo);
        
        if (newCountEl) newCountEl.textContent = newViolations.length;
        if (resolvedCountEl) resolvedCountEl.textContent = violations.length - newViolations.length;
    }
    
    // View violation
    function viewViolation(violationId) {
        const violation = violations.find(v => v.id === violationId);
        if (!violation) return;
        
        let html = `
            <div class="modal-header">
                <h2>Violation Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="violation-details">
                    <p><strong>Violation ID:</strong> ${violation.id}</p>
                    <p><strong>Vehicle No.:</strong> ${violation.vehicleNo}</p>
                    <p><strong>Date:</strong> ${violation.date}</p>
                    <p><strong>Violation Type:</strong> ${violation.violationType}</p>
                    <p><strong>Fine Amount:</strong> $${violation.fineAmount.toFixed(2)}</p>
                    <p><strong>Owner Type:</strong> ${capitalizeFirstLetter(violation.userType)}</p>
                    <p><strong>User ID:</strong> ${violation.userId}</p>
                    ${violation.message ? `<p><strong>Message:</strong> ${violation.message}</p>` : ''}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-danger delete-violation-btn" data-id="${violation.id}">Delete</button>
            </div>
        `;
        
        let modal = document.querySelector('.modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `<div class="modal-content">${html}</div>`;
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Add event listener for delete button
        document.querySelector('.modal .delete-violation-btn').addEventListener('click', function() {
            const violationId = this.getAttribute('data-id');
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                deleteViolation(violationId);
            }, 300);
        });
        
        // Close modal when clicking close button or outside modal
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            });
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Delete violation
    function deleteViolation(violationId) {
        const violationIndex = violations.findIndex(v => v.id === violationId);
        if (violationIndex === -1) return;
        
        violations.splice(violationIndex, 1);
        
        showNotification('Violation deleted successfully', 'success');
        
        updateViolationsTable();
    }
    
    // Open modal
    function openModal(htmlOrId) {
        let modal = document.querySelector('.modal');
        
        // Check if htmlOrId is an ID string (for existing modals)
        if (typeof htmlOrId === 'string' && document.getElementById(htmlOrId)) {
            const modalElement = document.getElementById(htmlOrId);
            if (modalElement) {
                modalElement.style.display = 'flex';
                // Add the show class for animation
                setTimeout(() => {
                    modalElement.classList.add('show');
                }, 10);
                return;
            }
        }
        
        // If not an ID or element not found, treat as HTML content
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            document.body.appendChild(modal);
        }
        
        modal.innerHTML = `<div class="modal-content">${htmlOrId}</div>`;
        modal.style.display = 'block';
        
        // Close modal when clicking close button or outside modal
        const closeButtons = modal.querySelectorAll('.close-modal');
        closeButtons.forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Close modal
    function closeModal(modalId) {
        if (typeof modalId === 'string') {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
                return;
            }
        }
        
        // If no specific modal or modal not found, close any visible modal
        const modal = document.querySelector('.modal.show');
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    }

    // Function to show notification
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
    
    // Capitalize first letter of string
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
    
    // Setup visitors table
    function setupVisitorsTable() {
        const visitorsTable = document.getElementById('visitorsTable');
        if (!visitorsTable) return;
        
        visitorsTable.innerHTML = '';
        
        visitors.forEach(visitor => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${visitor.id}</td>
                <td>${visitor.name}</td>
                <td>${visitor.nic}</td>
                <td>${visitor.phone}</td>
                <td>${visitor.email}</td>
                <td>${visitor.purpose}</td>
                <td class="btn-actions">
                    <button class="btn btn-primary btn-sm view-visitor-btn" data-id="${visitor.id}">View</button>
                    <button class="btn btn-danger btn-sm delete-visitor-btn" data-id="${visitor.id}">Delete</button>
                </td>
            `;
            
            visitorsTable.appendChild(row);
        });
        
        // Add event listeners for visitor actions
        document.querySelectorAll('.view-visitor-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const visitorId = this.getAttribute('data-id');
                viewVisitor(visitorId);
            });
        });
        
        document.querySelectorAll('.delete-visitor-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const visitorId = this.getAttribute('data-id');
                deleteVisitor(visitorId);
            });
        });
        
        // Update visitor counts
        updateVisitorCounts();
    }
    
    // Update visitor counts
    function updateVisitorCounts() {
        const todayCountEl = document.getElementById('todayCount');
        const weekCountEl = document.getElementById('weekCount');
        
        if (todayCountEl) todayCountEl.textContent = visitors.length;
        if (weekCountEl) weekCountEl.textContent = visitors.length + 4; // Just for demo purposes
    }
    
    // Setup visitor form
    function setupVisitorForm() {
        const addVisitorBtn = document.getElementById('addVisitorBtn');
        if (!addVisitorBtn) return;
        
        addVisitorBtn.addEventListener('click', function() {
            const modal = document.getElementById('addVisitorModal');
            if (!modal) return;
            
            // Reset the form first
            const form = document.getElementById('visitorForm');
            if (form) form.reset();
            
            // Hide QR code section and print button
            const qrSection = document.getElementById('visitorQRCodeSection');
            if (qrSection) qrSection.style.display = 'none';
            
            const printBtn = document.getElementById('printVisitorQRBtn');
            if (printBtn) printBtn.style.display = 'none';
            
            // Show submit button
            const submitBtn = document.getElementById('submitVisitorBtn');
            if (submitBtn) submitBtn.style.display = 'block';
            
            // Generate a unique Visitor ID (for demo)
            const visitorIdField = document.getElementById('visitorId');
            if (visitorIdField) {
                visitorIdField.value = 'VIS' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            }
            
            // Show the modal
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });

        // Form submission handler
        const submitVisitorBtn = document.getElementById('submitVisitorBtn');
        if (submitVisitorBtn) {
            submitVisitorBtn.addEventListener('click', function() {
                if (validateForm('visitorForm')) {
                    // Create new visitor object from form
                    const newVisitor = {
                        id: document.getElementById('visitorId').value,
                        nic: document.getElementById('nic').value,
                        name: document.getElementById('visitorName').value,
                        username: document.getElementById('username').value,
                        password: document.getElementById('password').value,
                        phone: document.getElementById('phone').value,
                        email: document.getElementById('email').value,
                        address: document.getElementById('address').value,
                        purpose: document.getElementById('purpose').value,
                        vehicleNo: document.getElementById('vehicleNo').value || 'N/A'
                    };
                    
                    // Add to visitors array (in a real app, this would be an API call)
                    visitors.push(newVisitor);
                    
                    // Also add to users array for search functionality
                    users.push({
                        id: newVisitor.id,
                        name: newVisitor.name,
                        email: newVisitor.email,
                        department: 'N/A',
                        vehicleNo: newVisitor.vehicleNo,
                        permitStatus: 'N/A',
                        userType: 'visitor'
                    });
                    
                    showNotification('Visitor registered successfully', 'success');
                    
                    // Generate and show QR code
                    generateVisitorQRCode(newVisitor);
                    
                    // Update visitors table
                    setupVisitorsTable();
                }
            });
        }
        
        // Print QR code button
        const printVisitorQRBtn = document.getElementById('printVisitorQRBtn');
        if (printVisitorQRBtn) {
            printVisitorQRBtn.addEventListener('click', function() {
                const visitorId = document.getElementById('qrVisitorId').textContent;
                const visitor = visitors.find(v => v.id === visitorId);
                if (visitor) {
                    const qrImage = document.getElementById('visitorQRImage').src;
                    printVisitorQRCode(visitor, qrImage);
                }
            });
        }
        
        // Add specific event listeners for the Cancel button in visitor modal
        const visitorModalCancelBtns = document.querySelectorAll('#addVisitorModal .close-modal');
        visitorModalCancelBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = document.getElementById('addVisitorModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
    
    // Function to generate visitor QR code in the form
    function generateVisitorQRCode(visitor) {
        // Generate QR code data
        const qrData = JSON.stringify({
            id: visitor.id,
            name: visitor.name,
            userType: 'visitor',
            vehicleNo: visitor.vehicleNo,
            purpose: visitor.purpose
        });
        
        // Create QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        
        // Update QR code section
        document.getElementById('visitorQRImage').src = qrCodeUrl;
        document.getElementById('qrVisitorId').textContent = visitor.id;
        document.getElementById('qrVisitorName').textContent = visitor.name;
        document.getElementById('qrVisitorPurpose').textContent = visitor.purpose;
        document.getElementById('qrVisitorVehicle').textContent = visitor.vehicleNo;
        
        // Show QR code section
        document.getElementById('visitorQRCodeSection').style.display = 'block';
        
        // Hide submit button and show print button
        document.getElementById('submitVisitorBtn').style.display = 'none';
        document.getElementById('printVisitorQRBtn').style.display = 'block';
    }
    
    // Function to print visitor QR code
    function printVisitorQRCode(visitor, qrCodeUrl) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Visitor QR Code - ${visitor.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    .print-container {
                        width: 100%;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        text-align: center;
                    }
                    .qr-code-img {
                        margin-bottom: 20px;
                    }
                    .qr-info {
                        text-align: left;
                        margin-top: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        color: #1a3c6e;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="logo">
                        Parking Management System
                    </div>
                    <h2>Visitor QR Code - ${visitor.name}</h2>
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code">
                    </div>
                    <div class="qr-info">
                        <p><strong>ID:</strong> ${visitor.id}</p>
                        <p><strong>Name:</strong> ${visitor.name}</p>
                        <p><strong>Purpose:</strong> ${visitor.purpose}</p>
                        <p><strong>Vehicle No.:</strong> ${visitor.vehicleNo}</p>
                    </div>
                    <div class="footer">
                        <p>This QR code can be used for quick identification at parking entries and exits.</p>
                        <p>Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    // View visitor details
    function viewVisitor(visitorId) {
        const visitor = visitors.find(v => v.id === visitorId);
        if (!visitor) return;
        
        let html = `
            <div class="modal-header">
                <h2>Visitor Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="visitor-details">
                    <p><strong>Visitor ID:</strong> ${visitor.id}</p>
                    <p><strong>NIC:</strong> ${visitor.nic}</p>
                    <p><strong>Name:</strong> ${visitor.name}</p>
                    <p><strong>Username:</strong> ${visitor.username}</p>
                    <p><strong>Phone:</strong> ${visitor.phone}</p>
                    <p><strong>Email:</strong> ${visitor.email}</p>
                    <p><strong>Address:</strong> ${visitor.address}</p>
                    <p><strong>Purpose:</strong> ${visitor.purpose}</p>
                    <p><strong>Vehicle No.:</strong> ${visitor.vehicleNo || 'N/A'}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-danger delete-visitor-btn" data-id="${visitor.id}">Delete</button>
                <button class="btn btn-primary generate-qr-btn" data-id="${visitor.id}" data-type="visitor">Generate QR Code</button>
            </div>
        `;
        
        openModal(html);
        
        // Add event listener for delete button
        document.querySelector('.modal .delete-visitor-btn').addEventListener('click', function() {
            const visitorId = this.getAttribute('data-id');
            closeModal();
            deleteVisitor(visitorId);
        });

        // Add event listener for QR code generation
        document.querySelector('.modal .generate-qr-btn').addEventListener('click', function() {
            const visitorId = this.getAttribute('data-id');
            const userType = this.getAttribute('data-type');
            generateQRCode(visitorId, userType);
        });
    }
    
    // Delete visitor
    function deleteVisitor(visitorId) {
        const visitorIndex = visitors.findIndex(v => v.id === visitorId);
        if (visitorIndex === -1) return;
        
        // Also remove from users array
        const userIndex = users.findIndex(u => u.id === visitorId);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
        }
        
        visitors.splice(visitorIndex, 1);
        
        showNotification('Visitor deleted successfully', 'success');
        
        setupVisitorsTable();
    }

    // View non-employee details
    function viewNonEmployee(neId) {
        const ne = nonEmployees.find(n => n.id === neId);
        if (!ne) return;
        
        let html = `
            <div class="modal-header">
                <h2>Non-Employee Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="ne-details">
                    <p><strong>ID:</strong> ${ne.id}</p>
                    <p><strong>NIC:</strong> ${ne.nic}</p>
                    <p><strong>Name:</strong> ${ne.name}</p>
                    <p><strong>Username:</strong> ${ne.username}</p>
                    <p><strong>Phone:</strong> ${ne.phone}</p>
                    <p><strong>Email:</strong> ${ne.email}</p>
                    <p><strong>Address:</strong> ${ne.address}</p>
                    <p><strong>Vehicle No.:</strong> ${ne.vehicleNo}</p>
                    <p><strong>Permit Type:</strong> ${capitalizeFirstLetter(ne.permitType)}</p>
                    <p><strong>Permit Status:</strong> <span class="status-badge ${ne.permitStatus.toLowerCase()}">${ne.permitStatus}</span></p>
                    <p><strong>Valid Until:</strong> ${ne.permitValidUntil}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-danger delete-ne-btn" data-id="${ne.id}">Delete</button>
                <button class="btn btn-primary generate-qr-btn" data-id="${ne.id}" data-type="nonemployee">Generate QR Code</button>
            </div>
        `;
        
        openModal(html);
        
        // Add event listener for delete button
        document.querySelector('.modal .delete-ne-btn').addEventListener('click', function() {
            const neId = this.getAttribute('data-id');
            closeModal();
            deleteNonEmployee(neId);
        });

        // Add event listener for QR code generation
        document.querySelector('.modal .generate-qr-btn').addEventListener('click', function() {
            const neId = this.getAttribute('data-id');
            const userType = this.getAttribute('data-type');
            generateQRCode(neId, userType);
        });
    }

    // Function to generate QR code
    function generateQRCode(userId, userType) {
        // Get user details based on user type
        let user;
        let permitValidUntil = '';
        let vehicleNo = '';
        
        switch(userType) {
            case 'employee':
                user = users.find(u => u.id === userId && u.userType === 'employee');
                permitValidUntil = 'N/A';
                vehicleNo = user ? user.vehicleNo : 'N/A';
                break;
            case 'nonemployee':
                user = nonEmployees.find(n => n.id === userId);
                permitValidUntil = user ? user.permitValidUntil : 'N/A';
                vehicleNo = user ? user.vehicleNo : 'N/A';
                break;
            case 'visitor':
                user = visitors.find(v => v.id === userId);
                permitValidUntil = 'N/A';
                vehicleNo = user && user.vehicleNo ? user.vehicleNo : 'N/A';
                break;
            default:
                break;
        }
        
        if (!user) {
            showNotification('User not found', 'error');
            return;
        }
        
        // Generate QR code data
        const qrData = JSON.stringify({
            id: user.id,
            name: user.name,
            userType: userType,
            vehicleNo: vehicleNo,
            validUntil: permitValidUntil
        });
        
        // Create QR code modal
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        
        let html = `
            <div class="modal-header">
                <h2>QR Code - ${user.name}</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="qr-code-container">
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code">
                    </div>
                    <div class="qr-code-info">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>User Type:</strong> ${capitalizeFirstLetter(userType)}</p>
                        <p><strong>Vehicle No.:</strong> ${vehicleNo}</p>
                        ${permitValidUntil !== 'N/A' ? `<p><strong>Valid Until:</strong> ${permitValidUntil}</p>` : ''}
                    </div>
                </div>
                <div class="qr-code-instructions">
                    <p><i class="fas fa-info-circle"></i> This QR code can be used for quick identification at parking entries and exits.</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-primary" id="printQRCode">Print QR Code</button>
            </div>
        `;
        
        openModal(html);
        
        // Add event listener for print button
        document.getElementById('printQRCode').addEventListener('click', function() {
            printQRCode(user, qrCodeUrl, userType, vehicleNo, permitValidUntil);
        });
    }
    
    // Function to print QR code
    function printQRCode(user, qrCodeUrl, userType, vehicleNo, permitValidUntil) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>QR Code - ${user.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    .print-container {
                        width: 100%;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        text-align: center;
                    }
                    .qr-code-img {
                        margin-bottom: 20px;
                    }
                    .qr-info {
                        text-align: left;
                        margin-top: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        color: #1a3c6e;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="logo">
                        <i class="fas fa-parking"></i> Parking Management System
                    </div>
                    <h2>QR Code - ${user.name}</h2>
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code">
                    </div>
                    <div class="qr-info">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>User Type:</strong> ${capitalizeFirstLetter(userType)}</p>
                        <p><strong>Vehicle No.:</strong> ${vehicleNo}</p>
                        ${permitValidUntil !== 'N/A' ? `<p><strong>Valid Until:</strong> ${permitValidUntil}</p>` : ''}
                    </div>
                    <div class="footer">
                        <p>This QR code can be used for quick identification at parking entries and exits.</p>
                        <p>Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    // Function to setup bulk QR code generation
    function setupBulkQRCodeGeneration() {
        const bulkQRCodeBtn = document.getElementById('bulkQRCodeBtn');
        if (!bulkQRCodeBtn) return;
        
        bulkQRCodeBtn.addEventListener('click', function() {
            // Determine which page we're on
            let userType = '';
            let userData = [];
            
            if (document.querySelector('.employees-table')) {
                userType = 'employee';
                userData = users.filter(u => u.userType === 'employee');
            } else if (document.querySelector('.nonemployees-table')) {
                userType = 'nonemployee';
                userData = nonEmployees;
            } else if (document.querySelector('.visitors-table')) {
                userType = 'visitor';
                userData = visitors;
            } else {
                // We're on the dashboard, default to employees
                userType = 'employee';
                userData = users.filter(u => u.userType === 'employee');
            }
            
            if (userData.length === 0) {
                showNotification('No data available for QR code generation', 'error');
                return;
            }
            
            // Open bulk QR code modal
            openBulkQRCodeModal(userType, userData);
        });
    }
    
    // Function to open bulk QR code modal
    function openBulkQRCodeModal(userType, userData) {
        // Generate the modal content
        let qrCodesHtml = '';
        
        userData.forEach(user => {
            let vehicleNo = '';
            let permitValidUntil = '';
            
            switch(userType) {
                case 'employee':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = 'N/A';
                    break;
                case 'nonemployee':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = user.permitValidUntil || 'N/A';
                    break;
                case 'visitor':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = 'N/A';
                    break;
            }
            
            // Generate QR code data
            const qrData = JSON.stringify({
                id: user.id,
                name: user.name,
                userType: userType,
                vehicleNo: vehicleNo,
                validUntil: permitValidUntil
            });
            
            // Create QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
            
            qrCodesHtml += `
                <div class="bulk-qr-item">
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code - ${user.id}">
                    </div>
                    <div class="qr-code-info-compact">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>Vehicle:</strong> ${vehicleNo}</p>
                        ${permitValidUntil !== 'N/A' ? `<p><strong>Valid Until:</strong> ${permitValidUntil}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        let html = `
            <div class="modal-header">
                <h2>Bulk QR Codes - ${capitalizeFirstLetter(userType)}s</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="bulk-qr-instructions">
                    <p><i class="fas fa-info-circle"></i> These QR codes can be used for quick identification at parking entries and exits.</p>
                </div>
                <div class="bulk-qr-container">
                    ${qrCodesHtml}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-primary" id="printBulkQRCodes">Print All QR Codes</button>
            </div>
        `;
        
        openModal(html);
        
        // Add event listener for print button
        document.getElementById('printBulkQRCodes').addEventListener('click', function() {
            printBulkQRCodes(userType, userData);
        });
    }
    
    // Function to print bulk QR codes
    function printBulkQRCodes(userType, userData) {
        const printWindow = window.open('', '_blank');
        let qrCodesHtml = '';
        
        userData.forEach(user => {
            let vehicleNo = '';
            let permitValidUntil = '';
            
            switch(userType) {
                case 'employee':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = 'N/A';
                    break;
                case 'nonemployee':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = user.permitValidUntil || 'N/A';
                    break;
                case 'visitor':
                    vehicleNo = user.vehicleNo || 'N/A';
                    permitValidUntil = 'N/A';
                    break;
            }
            
            // Generate QR code data
            const qrData = JSON.stringify({
                id: user.id,
                name: user.name,
                userType: userType,
                vehicleNo: vehicleNo,
                validUntil: permitValidUntil
            });
            
            // Create QR code URL
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
            
            qrCodesHtml += `
                <div class="print-qr-item">
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code - ${user.id}">
                    </div>
                    <div class="qr-info">
                        <p><strong>ID:</strong> ${user.id}</p>
                        <p><strong>Name:</strong> ${user.name}</p>
                        <p><strong>User Type:</strong> ${capitalizeFirstLetter(userType)}</p>
                        <p><strong>Vehicle No.:</strong> ${vehicleNo}</p>
                        ${permitValidUntil !== 'N/A' ? `<p><strong>Valid Until:</strong> ${permitValidUntil}</p>` : ''}
                    </div>
                </div>
            `;
        });
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Bulk QR Codes - ${capitalizeFirstLetter(userType)}s</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    .print-container {
                        width: 100%;
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    .print-header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .print-qr-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 20px;
                        page-break-inside: avoid;
                    }
                    .print-qr-item {
                        border: 1px solid #ccc;
                        padding: 15px;
                        text-align: center;
                        page-break-inside: avoid;
                    }
                    .qr-code-img {
                        margin-bottom: 10px;
                    }
                    .qr-info {
                        text-align: left;
                        font-size: 12px;
                    }
                    .logo {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: #1a3c6e;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 10px;
                        color: #666;
                        text-align: center;
                    }
                    @media print {
                        .print-qr-item {
                            page-break-inside: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="print-header">
                        <div class="logo">
                            Parking Management System
                        </div>
                        <h2>QR Codes - ${capitalizeFirstLetter(userType)}s</h2>
                        <p>Total: ${userData.length} QR codes</p>
                    </div>
                    <div class="print-qr-grid">
                        ${qrCodesHtml}
                    </div>
                    <div class="footer">
                        <p>These QR codes can be used for quick identification at parking entries and exits.</p>
                        <p>Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    // Helper function for form validation
    function validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        // Check all required fields
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(function(field) {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        if (!isValid) {
            showNotification('Please fill all required fields', 'error');
        }
        
        return isValid;
    }

    // Setup non-employees table
    function setupNonEmployeesTable() {
        const nonEmployeesTable = document.getElementById('nonEmployeesTable');
        if (!nonEmployeesTable) return;
        
        nonEmployeesTable.innerHTML = '';
        
        nonEmployees.forEach(ne => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${ne.id}</td>
                <td>${ne.name}</td>
                <td>${ne.nic}</td>
                <td>${ne.phone}</td>
                <td>${ne.email}</td>
                <td><span class="status-badge ${ne.permitStatus.toLowerCase()}">${ne.permitStatus}</span></td>
                <td class="btn-actions">
                    <button class="btn btn-primary btn-sm view-ne-btn" data-id="${ne.id}">View</button>
                    <button class="btn btn-danger btn-sm delete-ne-btn" data-id="${ne.id}">Delete</button>
                </td>
            `;
            
            nonEmployeesTable.appendChild(row);
        });
        
        // Add event listeners for non-employee actions
        document.querySelectorAll('.view-ne-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const neId = this.getAttribute('data-id');
                viewNonEmployee(neId);
            });
        });
        
        document.querySelectorAll('.delete-ne-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const neId = this.getAttribute('data-id');
                deleteNonEmployee(neId);
            });
        });
        
        // Update non-employee counts
        updateNonEmployeeCounts();
    }
    
    // Update non-employee counts
    function updateNonEmployeeCounts() {
        const totalCountEl = document.getElementById('totalCount');
        const activeCountEl = document.getElementById('activeCount');
        
        if (totalCountEl) totalCountEl.textContent = nonEmployees.length;
        if (activeCountEl) activeCountEl.textContent = nonEmployees.filter(ne => ne.permitStatus === 'Active').length;
    }
    
    // Setup non-employee form
    function setupNonEmployeeForm() {
        const addNonEmployeeBtn = document.getElementById('addNonEmployeeBtn');
        if (!addNonEmployeeBtn) return;
        
        addNonEmployeeBtn.addEventListener('click', function() {
            const modal = document.getElementById('addNonEmployeeModal');
            if (!modal) return;
            
            // Reset the form first
            const form = document.getElementById('nonEmployeeForm');
            if (form) form.reset();
            
            // Hide QR code section and print button
            const qrSection = document.getElementById('nonEmployeeQRCodeSection');
            if (qrSection) qrSection.style.display = 'none';
            
            const printBtn = document.getElementById('printNonEmployeeQRBtn');
            if (printBtn) printBtn.style.display = 'none';
            
            // Show submit button
            const submitBtn = document.getElementById('submitNonEmployeeBtn');
            if (submitBtn) submitBtn.style.display = 'block';
            
            // Generate a unique Non-Employee ID (for demo)
            const neIdField = document.getElementById('nonEmployeeId');
            if (neIdField) {
                neIdField.value = 'NE' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
            }
            
            // Show the modal
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
        });
        
        // Form submission handler
        const submitNonEmployeeBtn = document.getElementById('submitNonEmployeeBtn');
        if (submitNonEmployeeBtn) {
            submitNonEmployeeBtn.addEventListener('click', function() {
                if (validateForm('nonEmployeeForm')) {
                    // Get permit validity based on type
                    const permitType = document.getElementById('nePermitType').value;
                    let validUntil = new Date();
                    
                    switch(permitType) {
                        case 'monthly':
                            validUntil.setMonth(validUntil.getMonth() + 1);
                            break;
                        case 'quarterly':
                            validUntil.setMonth(validUntil.getMonth() + 3);
                            break;
                        case 'semiannual':
                            validUntil.setMonth(validUntil.getMonth() + 6);
                            break;
                        case 'annual':
                            validUntil.setFullYear(validUntil.getFullYear() + 1);
                            break;
                        default:
                            validUntil.setMonth(validUntil.getMonth() + 1);
                    }
                    
                    const permitValidUntil = validUntil.toISOString().split('T')[0];
                    
                    // Create new non-employee object from form
                    const newNonEmployee = {
                        id: document.getElementById('nonEmployeeId').value,
                        nic: document.getElementById('neNic').value,
                        name: document.getElementById('neName').value,
                        username: document.getElementById('neUsername').value,
                        password: document.getElementById('nePassword').value,
                        phone: document.getElementById('nePhone').value,
                        email: document.getElementById('neEmail').value,
                        address: document.getElementById('neAddress').value,
                        vehicleNo: document.getElementById('neVehicleNo').value,
                        permitType: permitType,
                        permitStatus: 'Active',
                        permitValidUntil: permitValidUntil
                    };
                    
                    // Add to nonEmployees array (in a real app, this would be an API call)
                    nonEmployees.push(newNonEmployee);
                    
                    // Also add to users array for search functionality
                    users.push({
                        id: newNonEmployee.id,
                        name: newNonEmployee.name,
                        email: newNonEmployee.email,
                        department: 'N/A',
                        vehicleNo: newNonEmployee.vehicleNo,
                        permitStatus: 'Active',
                        userType: 'nonemployee'
                    });
                    
                    showNotification('Non-Employee registered successfully', 'success');
                    
                    // Generate and show QR code
                    generateNonEmployeeQRCode(newNonEmployee);
                    
                    // Update non-employees table
                    setupNonEmployeesTable();
                }
            });
        }
        
        // Print QR code button
        const printNonEmployeeQRBtn = document.getElementById('printNonEmployeeQRBtn');
        if (printNonEmployeeQRBtn) {
            printNonEmployeeQRBtn.addEventListener('click', function() {
                const neId = document.getElementById('qrNonEmployeeId').textContent;
                const nonEmployee = nonEmployees.find(ne => ne.id === neId);
                if (nonEmployee) {
                    const qrImage = document.getElementById('nonEmployeeQRImage').src;
                    printNonEmployeeQRCode(nonEmployee, qrImage);
                }
            });
        }
        
        // Add specific event listeners for the Cancel button in non-employee modal
        const neModalCancelBtns = document.querySelectorAll('#addNonEmployeeModal .close-modal');
        neModalCancelBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const modal = document.getElementById('addNonEmployeeModal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
    
    // Function to generate non-employee QR code in the form
    function generateNonEmployeeQRCode(nonEmployee) {
        // Generate QR code data
        const qrData = JSON.stringify({
            id: nonEmployee.id,
            name: nonEmployee.name,
            userType: 'nonemployee',
            vehicleNo: nonEmployee.vehicleNo,
            permitType: nonEmployee.permitType,
            validUntil: nonEmployee.permitValidUntil
        });
        
        // Create QR code URL
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
        
        // Update QR code section
        document.getElementById('nonEmployeeQRImage').src = qrCodeUrl;
        document.getElementById('qrNonEmployeeId').textContent = nonEmployee.id;
        document.getElementById('qrNonEmployeeName').textContent = nonEmployee.name;
        document.getElementById('qrNonEmployeeVehicle').textContent = nonEmployee.vehicleNo;
        document.getElementById('qrNonEmployeePermitType').textContent = capitalizeFirstLetter(nonEmployee.permitType);
        document.getElementById('qrNonEmployeeValidUntil').textContent = nonEmployee.permitValidUntil;
        
        // Show QR code section
        document.getElementById('nonEmployeeQRCodeSection').style.display = 'block';
        
        // Hide submit button and show print button
        document.getElementById('submitNonEmployeeBtn').style.display = 'none';
        document.getElementById('printNonEmployeeQRBtn').style.display = 'block';
    }
    
    // Function to print non-employee QR code
    function printNonEmployeeQRCode(nonEmployee, qrCodeUrl) {
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Non-Employee QR Code - ${nonEmployee.name}</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                    }
                    .print-container {
                        width: 100%;
                        max-width: 500px;
                        margin: 0 auto;
                        padding: 20px;
                        border: 1px solid #ccc;
                        text-align: center;
                    }
                    .qr-code-img {
                        margin-bottom: 20px;
                    }
                    .qr-info {
                        text-align: left;
                        margin-top: 20px;
                    }
                    .logo {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        color: #1a3c6e;
                    }
                    .footer {
                        margin-top: 30px;
                        font-size: 12px;
                        color: #666;
                    }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="logo">
                        Parking Management System
                    </div>
                    <h2>Non-Employee QR Code - ${nonEmployee.name}</h2>
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code">
                    </div>
                    <div class="qr-info">
                        <p><strong>ID:</strong> ${nonEmployee.id}</p>
                        <p><strong>Name:</strong> ${nonEmployee.name}</p>
                        <p><strong>Vehicle No.:</strong> ${nonEmployee.vehicleNo}</p>
                        <p><strong>Permit Type:</strong> ${capitalizeFirstLetter(nonEmployee.permitType)}</p>
                        <p><strong>Valid Until:</strong> ${nonEmployee.permitValidUntil}</p>
                    </div>
                    <div class="footer">
                        <p>This QR code can be used for quick identification at parking entries and exits.</p>
                        <p>Printed on: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }

    // Delete non-employee
    function deleteNonEmployee(neId) {
        const neIndex = nonEmployees.findIndex(ne => ne.id === neId);
        if (neIndex === -1) return;
        
        // Also remove from users array
        const userIndex = users.findIndex(u => u.id === neId);
        if (userIndex !== -1) {
            users.splice(userIndex, 1);
        }
        
        nonEmployees.splice(neIndex, 1);
        
        showNotification('Non-Employee deleted successfully', 'success');
        
        setupNonEmployeesTable();
    }

    // Initialize modal controls for existing elements
    function setupModalControls() {
        // Close modal when clicking the X button or Cancel button
        document.addEventListener('click', function(event) {
            // Check if the clicked element has the close-modal class
            if (event.target.classList.contains('close-modal')) {
                const modal = event.target.closest('.modal');
                if (modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            }
        });
        
        // Close modal when clicking outside the modal content
        const modals = document.querySelectorAll('.modal');
        modals.forEach(function(modal) {
            modal.addEventListener('click', function(event) {
                if (event.target === modal) {
                    modal.classList.remove('show');
                    setTimeout(() => {
                        modal.style.display = 'none';
                    }, 300);
                }
            });
        });
    }
}); 