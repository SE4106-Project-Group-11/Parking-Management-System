// JavaScript for Payment Management functionality

document.addEventListener('DOMContentLoaded', function() {
    // Reference to form elements
    const paymentForm = document.getElementById('paymentForm');
    const paymentTypeSelect = document.getElementById('paymentType');
    const userTypeSelect = document.getElementById('userType');
    const userIdInput = document.getElementById('userId');
    const amountInput = document.getElementById('amount');
    const paymentDateInput = document.getElementById('paymentDate');
    const paymentModeSelect = document.getElementById('paymentMode');
    const cardDetailsSection = document.getElementById('cardDetailsSection');
    const cardNumberInput = document.getElementById('cardNumber');
    const notesTextarea = document.getElementById('notes');
    const submitPaymentBtn = document.getElementById('submitPayment');
    const cancelPaymentBtn = document.getElementById('cancelPayment');
    
    // Reference to error message elements
    const paymentTypeError = document.getElementById('paymentTypeError');
    const userTypeError = document.getElementById('userTypeError');
    const userIdError = document.getElementById('userIdError');
    const amountError = document.getElementById('amountError');
    const paymentDateError = document.getElementById('paymentDateError');
    const paymentModeError = document.getElementById('paymentModeError');
    const cardNumberError = document.getElementById('cardNumberError');
    
    // Generate a unique payment ID when the modal is opened
    const addPaymentBtn = document.querySelector('[data-modal-target="addPaymentModal"]');
    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', function() {
            try {
                // Generate a unique payment ID
                const paymentId = 'PMT' + Math.floor(Math.random() * 10000).toString().padStart(5, '0');
                const paymentIdField = document.getElementById('paymentId');
                if (paymentIdField) paymentIdField.value = paymentId;
                
                // Set default date to today
                const today = new Date().toISOString().split('T')[0];
                if (paymentDateInput) paymentDateInput.value = today;
                
                // Reset form fields
                resetPaymentForm();
            } catch (error) {
                console.error('Error initializing payment form:', error);
            }
        });
    }
    
    // Handle payment mode change to show/hide card details
    if (paymentModeSelect) {
        paymentModeSelect.addEventListener('change', function() {
            if (this.value === 'card') {
                cardDetailsSection.style.display = 'block';
            } else {
                cardDetailsSection.style.display = 'none';
                cardNumberInput.value = '';
                cardNumberError.textContent = '';
            }
        });
    }
    
    // Handle form submission
    if (submitPaymentBtn) {
        submitPaymentBtn.addEventListener('click', function() {
            try {
                // Show loading spinner
                const spinner = this.querySelector('.fa-spinner');
                const buttonText = this.querySelector('span');
                if (spinner) spinner.style.display = 'inline-block';
                if (buttonText) buttonText.textContent = 'Processing...';
                this.disabled = true;
                
                // Clear all previous error messages
                clearErrorMessages();
                
                // Validate form
                if (!validatePaymentForm()) {
                    resetSubmitButton();
                    return;
                }
                
                // Get form data
                const paymentData = {
                    paymentId: document.getElementById('paymentId').value,
                    paymentType: paymentTypeSelect.value,
                    userType: userTypeSelect.value,
                    userId: userIdInput.value,
                    amount: amountInput.value,
                    date: paymentDateInput.value,
                    paymentMode: paymentModeSelect.value,
                    cardNumber: paymentModeSelect.value === 'card' ? cardNumberInput.value : '',
                    notes: notesTextarea.value
                };
                
                console.log('Payment data:', paymentData);
                
                // Simulate server request
                setTimeout(() => {
                    // Add new row to payments table
                    addPaymentToTable(paymentData);
                    
                    // Show success notification
                    showNotification('Payment added successfully!', 'success');
                    
                    // Close the modal
                    const modal = document.getElementById('addPaymentModal');
                    if (modal) {
                        modal.classList.remove('show');
                        setTimeout(() => {
                            modal.style.display = 'none';
                            resetSubmitButton();
                        }, 300);
                    }
                }, 1000); // Simulate a 1-second server delay
                
            } catch (error) {
                console.error('Error submitting payment:', error);
                showNotification('An error occurred. Please try again.', 'error');
                resetSubmitButton();
            }
        });
    }
    
    // Handle cancel button
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', function() {
            const modal = document.getElementById('addPaymentModal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
    
    // Search and filter functionality
    const searchPaymentBtn = document.getElementById('searchPaymentBtn');
    if (searchPaymentBtn) {
        searchPaymentBtn.addEventListener('click', function() {
            const searchTerm = document.getElementById('paymentSearch').value.toLowerCase();
            const paymentTypeFilter = document.getElementById('paymentTypeFilter').value;
            const userTypeFilter = document.getElementById('userTypeFilter').value;
            
            filterPaymentsTable(searchTerm, paymentTypeFilter, userTypeFilter);
        });
    }
    
    // View and print button handlers
    document.addEventListener('click', function(e) {
        if (e.target.closest('.view-btn')) {
            const paymentId = e.target.closest('.view-btn').getAttribute('data-id');
            viewPaymentDetails(paymentId);
        }
        
        if (e.target.closest('.print-btn')) {
            const paymentId = e.target.closest('.print-btn').getAttribute('data-id');
            printPaymentReceipt(paymentId);
        }
    });
    
    // ===== Helper Functions =====
    
    // Validate payment form
    function validatePaymentForm() {
        let isValid = true;
        
        if (!paymentTypeSelect.value) {
            paymentTypeError.textContent = 'Please select a payment type';
            isValid = false;
        }
        
        if (!userTypeSelect.value) {
            userTypeError.textContent = 'Please select a user type';
            isValid = false;
        }
        
        if (!userIdInput.value) {
            userIdError.textContent = 'User ID is required';
            isValid = false;
        }
        
        if (!amountInput.value) {
            amountError.textContent = 'Amount is required';
            isValid = false;
        } else if (parseFloat(amountInput.value) <= 0) {
            amountError.textContent = 'Amount must be greater than zero';
            isValid = false;
        }
        
        if (!paymentDateInput.value) {
            paymentDateError.textContent = 'Payment date is required';
            isValid = false;
        }
        
        if (!paymentModeSelect.value) {
            paymentModeError.textContent = 'Please select a payment mode';
            isValid = false;
        }
        
        // Validate card number if payment mode is card
        if (paymentModeSelect.value === 'card') {
            if (!cardNumberInput.value) {
                cardNumberError.textContent = 'Card number is required';
                isValid = false;
            } else if (!validateCardNumber(cardNumberInput.value)) {
                cardNumberError.textContent = 'Please enter a valid card number';
                isValid = false;
            }
        }
        
        return isValid;
    }
    
    // Basic card number validation (format check)
    function validateCardNumber(cardNumber) {
        // Remove spaces and dashes
        const cleaned = cardNumber.replace(/\s+/g, '').replace(/-/g, '');
        // Check if it contains only digits and is between 13-19 digits
        return /^\d{13,19}$/.test(cleaned);
    }
    
    // Clear all error messages
    function clearErrorMessages() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }
    
    // Reset payment form
    function resetPaymentForm() {
        if (paymentForm) {
            // Clear all error messages
            clearErrorMessages();
            
            // Reset form fields except for readonly fields
            const fields = paymentForm.querySelectorAll('input:not([readonly]), select, textarea');
            fields.forEach(field => {
                if (field.id !== 'paymentId' && field.id !== 'paymentDate') {
                    field.value = '';
                }
            });
            
            // Hide card details section
            if (cardDetailsSection) {
                cardDetailsSection.style.display = 'none';
            }
        }
    }
    
    // Reset submit button state
    function resetSubmitButton() {
        if (submitPaymentBtn) {
            const spinner = submitPaymentBtn.querySelector('.fa-spinner');
            const buttonText = submitPaymentBtn.querySelector('span');
            if (spinner) spinner.style.display = 'none';
            if (buttonText) buttonText.textContent = 'Submit Payment';
            submitPaymentBtn.disabled = false;
        }
    }
    
    // Add payment to table
    function addPaymentToTable(paymentData) {
        const paymentsTable = document.getElementById('paymentsTable');
        if (!paymentsTable) return;
        
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td>${paymentData.paymentId}</td>
            <td>${capitalizeFirstLetter(paymentData.paymentType)}</td>
            <td>${capitalizeFirstLetter(paymentData.userType)}</td>
            <td>${paymentData.userId}</td>
            <td>$${parseFloat(paymentData.amount).toFixed(2)}</td>
            <td>${paymentData.date}</td>
            <td>${capitalizeFirstLetter(paymentData.paymentMode)}</td>
            <td>
                <button class="btn btn-sm btn-primary view-btn" data-id="${paymentData.paymentId}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-secondary print-btn" data-id="${paymentData.paymentId}">
                    <i class="fas fa-print"></i>
                </button>
            </td>
        `;
        
        // Add new row at the top of the table
        paymentsTable.insertBefore(newRow, paymentsTable.firstChild);
    }
    
    // Filter payments table
    function filterPaymentsTable(searchTerm, paymentType, userType) {
        const rows = document.querySelectorAll('#paymentsTable tr');
        
        rows.forEach(row => {
            const paymentTypeCell = row.cells[1]?.textContent.toLowerCase();
            const userTypeCell = row.cells[2]?.textContent.toLowerCase();
            const textContent = row.textContent.toLowerCase();
            
            const matchesSearch = !searchTerm || textContent.includes(searchTerm);
            const matchesPaymentType = !paymentType || paymentTypeCell === paymentType.toLowerCase();
            const matchesUserType = !userType || userTypeCell === userType.toLowerCase();
            
            if (matchesSearch && matchesPaymentType && matchesUserType) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    }
    
    // View payment details
    function viewPaymentDetails(paymentId) {
        // In a real app, this would fetch details from the server
        // For demo, we'll show a modal with details from the table
        
        const rows = document.querySelectorAll('#paymentsTable tr');
        let paymentData = null;
        
        for (const row of rows) {
            const cellId = row.cells[0]?.textContent;
            if (cellId === paymentId) {
                paymentData = {
                    id: row.cells[0]?.textContent,
                    type: row.cells[1]?.textContent,
                    userType: row.cells[2]?.textContent,
                    userId: row.cells[3]?.textContent,
                    amount: row.cells[4]?.textContent,
                    date: row.cells[5]?.textContent,
                    mode: row.cells[6]?.textContent
                };
                break;
            }
        }
        
        if (!paymentData) return;
        
        const modalHtml = `
            <div class="modal-header">
                <h2>Payment Details</h2>
                <button class="close-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="payment-details">
                    <p><strong>Payment ID:</strong> ${paymentData.id}</p>
                    <p><strong>Payment Type:</strong> ${paymentData.type}</p>
                    <p><strong>User Type:</strong> ${paymentData.userType}</p>
                    <p><strong>User ID:</strong> ${paymentData.userId}</p>
                    <p><strong>Amount:</strong> ${paymentData.amount}</p>
                    <p><strong>Date:</strong> ${paymentData.date}</p>
                    <p><strong>Payment Mode:</strong> ${paymentData.mode}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary close-modal">Close</button>
                <button class="btn btn-primary print-btn" data-id="${paymentData.id}">
                    <i class="fas fa-print"></i> Print Receipt
                </button>
            </div>
        `;
        
        showModal(modalHtml);
    }
    
    // Print payment receipt
    function printPaymentReceipt(paymentId) {
        // In a real app, this would generate a printable receipt
        // For demo, we'll show a notification
        showNotification(`Printing receipt for payment ${paymentId}...`, 'success');
        
        // Simulate print dialog
        setTimeout(() => {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`
                    <html>
                    <head>
                        <title>Payment Receipt - ${paymentId}</title>
                        <style>
                            body { font-family: Arial, sans-serif; padding: 20px; }
                            .receipt { max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; }
                            .receipt-header { text-align: center; margin-bottom: 20px; }
                            .receipt-header h1 { margin: 0; color: #1a3a5f; }
                            .receipt-body { margin-bottom: 20px; }
                            .receipt-body p { margin: 5px 0; }
                            .receipt-footer { text-align: center; font-size: 0.9em; margin-top: 30px; }
                        </style>
                    </head>
                    <body>
                        <div class="receipt">
                            <div class="receipt-header">
                                <h1>Payment Receipt</h1>
                                <p>Parking Management System</p>
                            </div>
                            <div class="receipt-body">
                                <p><strong>Receipt ID:</strong> ${paymentId}</p>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                                <p><strong>Amount:</strong> $XX.XX</p>
                                <p><strong>Payment For:</strong> XXXXX</p>
                                <p><strong>Payment Method:</strong> XXXXX</p>
                            </div>
                            <div class="receipt-footer">
                                <p>Thank you for your payment!</p>
                                <p>For questions, contact support@parking-system.com</p>
                            </div>
                        </div>
                        <script>
                            window.onload = function() { window.print(); }
                        </script>
                    </body>
                    </html>
                `);
                printWindow.document.close();
            }
        }, 500);
    }
    
    // Show modal
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
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Close modal on click outside or on close button
        modal.onclick = (e) => {
            if (e.target === modal || e.target.classList.contains('close-modal')) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        };
    }
    
    // Show notification
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
    
    // Capitalize first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}); 