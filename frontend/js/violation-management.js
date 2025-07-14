
document.addEventListener('DOMContentLoaded', function() {
    // API base URL - adjust this to match your backend
    const API_BASE_URL = '/api/violations'; 
    // DOM elements
    const createViolationBtn = document.getElementById('createViolationBtn');
    const violationsTable = document.getElementById('violationsTable');
    const newCount = document.getElementById('newCount');
    const resolvedCount = document.getElementById('resolvedCount');
    
    // Initialize page
    init();
    
    function init() {
        loadViolations();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        createViolationBtn.addEventListener('click', showCreateViolationModal);
        
        // Add refresh button functionality
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', loadViolations);
        }
        
        // Auto-refresh every 30 seconds
        setInterval(loadViolations, 30000);
    }
    
    // Load all violations from backend
    async function loadViolations() {
        try {
            console.log(' Loading violations from:', `${API_BASE_URL}/all`);
            const response = await fetch(`${API_BASE_URL}/all`);
            const data = await response.json();
            
            console.log(' Violations loaded:', data.violations?.length || 0, 'violations');
            
            if (data.success) {
                displayViolations(data.violations);
                updateCounts(data.violations);
            } else {
                console.error('Failed to load violations:', data.error);
                showNotification('Failed to load violations', 'error');
            }
        } catch (error) {
            console.error('Error loading violations:', error);
            showNotification('Error loading violations', 'error');
        }
    }
    
    // Display violations in table
    function displayViolations(violations) {
        console.log('Displaying violations:', violations);
        violationsTable.innerHTML = '';
        
        if (!violations || violations.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = '<td colspan="8" style="text-align: center; color: #666;">No violations found</td>';
            violationsTable.appendChild(row);
            return;
        }
        
        violations.forEach(violation => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${violation.violationId}</td>
                <td>${violation.vehicleNo}</td>
                <td>${new Date(violation.date).toLocaleDateString()}</td>
                <td>${violation.violationType}</td>
                <td>${violation.fineAmount}</td>
                <td>${violation.userType}</td>
                <td>${violation.userId}</td>
                <td>
                    <button class="btn btn-sm btn-primary" onclick="viewViolation('${violation._id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteViolation('${violation._id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            `;
            violationsTable.appendChild(row);
        });
    }
    
    // Update status counts
    function updateCounts(violations) {
        // You can customize this logic based on your violation status system
        const newViolations = violations.filter(v => !v.resolved).length;
        const resolvedViolations = violations.filter(v => v.resolved).length;
        
        newCount.textContent = newViolations;
        resolvedCount.textContent = resolvedViolations;
    }
    
    // Show create violation modal
    function showCreateViolationModal() {
        const modal = createModal();
        document.body.appendChild(modal);
        
        // Focus on first input
        setTimeout(() => {
            modal.querySelector('input').focus();
        }, 100);
    }
    
    // Create violation - this is the main function that was causing your issue
    window.createViolation = async function(event) {
        event.preventDefault();
        
        const form = document.getElementById('violationForm');
        const formData = new FormData(form);
        
        // Convert FormData to object
        const violationData = {
            vehicleNo: formData.get('vehicleNo'),
            date: formData.get('date'),
            violationType: formData.get('violationType'),
            fineAmount: parseFloat(formData.get('fineAmount')),
            message: formData.get('message') || '',
            userType: formData.get('userType'),
            userId: formData.get('userId')
        };
        
        console.log('Sending violation data:', violationData);
        console.log('API URL:', API_BASE_URL);
        
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(violationData)
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Response data:', data);
            
            if (data.success) {
                showNotification('Violation created successfully!', 'success');
                closeModal();
                // Immediately refresh the table to show the new violation
                loadViolations();
            } else {
                console.error('Backend error:', data.error);
                showNotification(`Failed to create violation: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Network error details:', error);
            
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                showNotification('Connection failed. Check if your server is running and the API URL is correct.', 'error');
            } else {
                showNotification(`Network error: ${error.message}`, 'error');
            }
        }
    };
    
    // Close modal
    window.closeModal = function() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    };
    
    // View violation details
    window.viewViolation = function(violationId) {
        // Implement view violation functionality
        console.log('View violation:', violationId);
        showNotification('View violation feature coming soon!', 'info');
    };
    
    // Delete violation
    window.deleteViolation = async function(violationId) {
        if (!confirm('Are you sure you want to delete this violation?')) {
            return;
        }
        
        try {
            // You need to add a DELETE route in your backend
            const response = await fetch(`${API_BASE_URL}/${violationId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showNotification('Violation deleted successfully!', 'success');
                // Immediately refresh the table to remove the deleted violation
                loadViolations();
            } else {
                showNotification(`Failed to delete violation: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Error deleting violation:', error);
            showNotification('Error deleting violation. Please try again.', 'error');
        }
    };
    
    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('active');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(event.target) && !sidebarToggle.contains(event.target)) {
                sidebar.classList.remove('active');
            }
        }
    });
});