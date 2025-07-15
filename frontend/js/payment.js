// frontend/js/payment.js

// --- GLOBAL UTILITY FUNCTIONS (Defined outside DOMContentLoaded for universal access) ---
// These are copies from your script.js or newly defined for payment.js's functionality.

function showModal(contentHtml) {
    let modal = document.getElementById('dynamicModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'dynamicModal';
        modal.className = 'modal';
        modal.innerHTML = `<div class="modal-content"></div>`;
        document.body.appendChild(modal);
    }
    const modalContentDiv = modal.querySelector('.modal-content');
    if (modalContentDiv) {
        modalContentDiv.innerHTML = contentHtml;
    }
    modal.style.display = 'flex';
    setTimeout(() => { modal.classList.add('show'); }, 10);
}

function closeModal() {
    const openModal = document.querySelector('.modal.show');
    if (openModal) {
        openModal.classList.remove('show');
        setTimeout(() => { openModal.style.display = 'none'; }, 300);
    }
}

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

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// --- END GLOBAL UTILITY FUNCTIONS ---

// --- GLOBAL VARIABLES (defined outside DOMContentLoaded to be accessible by all functions) ---
let stripe = null;
let elements = null;
let cardElement = null;
let stripeCardContainer = null;
let cardErrors = null;
let token = null;
let userId = null;
let userRole = null;


// --- STRIPE INTEGRATION FUNCTIONS (moved to global scope) ---
async function initializeStripe() {
    console.log("Attempting to initialize Stripe.");
    if (typeof Stripe === 'undefined') {
        console.error("Stripe.js script not loaded!");
        showNotification('Stripe payment methods not available. Check script.js in HTML.', 'error');
        return;
    }
    if (!stripe) {
        try {
            stripe = Stripe('pk_test_YOUR_STRIPE_PUBLISHABLE_KEY'); // <<< IMPORTANT: Replace with your key
            elements = stripe.elements();
            cardElement = elements.create('card');
            cardElement.mount('#card-element');
            console.log("Stripe initialized and card element mounted.");

            cardElement.addEventListener('change', function(event) {
                if (cardErrors) {
                    if (event.error) {
                        cardErrors.textContent = event.error.message;
                        console.error("Stripe card error:", event.error.message);
                    } else {
                        cardErrors.textContent = '';
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing Stripe:', error);
            showNotification('Error loading payment methods. Check Stripe key.', 'error');
        }
    } else {
        console.log("Stripe already initialized.");
        if(cardElement) cardElement.clear();
    }
}

// --- CORE PAYMENT DATA LOADING FUNCTIONS (moved to global scope) ---
async function loadUserPayments() {
    console.log("Loading user payments...");
    try {
        const res = await fetch(`http://localhost:5000/api/payments/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        console.log("Payments API response:", data);

        if (res.ok && data.success) {
            populatePaymentsTable(data.payments);
        } else {
            showNotification(data.message || 'Failed to load payments.', 'error');
            console.error('Error loading payments:', data.message);
        }
    } catch (error) {
        showNotification('Network error loading payments.', 'error');
        console.error('Network error loading payments (catch):', error);
    }
}

function populatePaymentsTable(payments) {
    const tbody = document.getElementById('paymentsTable');
    if (!tbody) { console.warn("Payments table body not found."); return; }
    tbody.innerHTML = '';

    if (!payments || payments.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #666;">No payments made yet.</td></tr>';
        return;
    }

    payments.forEach(payment => {
        const row = document.createElement('tr');
        const paymentDate = new Date(payment.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

        console.log("DEBUG: Populating payment with _id:", payment._id, "as string:", String(payment._id), "and type:", typeof payment._id);

        row.innerHTML = `
            <td>${payment.transactionId || String(payment._id)}</td>
            <td>${capitalizeFirstLetter(payment.paymentType)}</td>
            <td>${capitalizeFirstLetter(payment.userType)}</td>
            <td>${payment.userId}</td>
            <td>LKR ${payment.amount.toFixed(2)}</td>
            <td>${paymentDate}</td>
            <td>${capitalizeFirstLetter(payment.mode)}</td>
            <td>
                <button class="btn btn-sm btn-info view-payment-btn" data-id="${String(payment._id)}">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    console.log("Payments table populated.");
}

// --- HELPER FUNCTION FOR SUBMIT BUTTON RESET (moved to global scope) ---
function resetSubmitButton(btn, spinner, textSpan) {
    if (spinner) spinner.style.display = 'none';
    if (textSpan) textSpan.textContent = 'Pay Now';
    if (btn) btn.disabled = false;
    console.log("Submit button reset.");
}

// --- PAYMENT DETAILS MODAL DISPLAY FUNCTION (moved to global scope) ---
function showPaymentDetailsModal(payment) {
    const stripeResponse = payment.gatewayResponse;
    const stripePiId = stripeResponse ? stripeResponse.id : 'N/A';
    const stripeChargeId = stripeResponse && stripeResponse.latest_charge && stripeResponse.latest_charge.id ? stripeResponse.latest_charge.id : 'N/A';
    const stripePmId = stripeResponse ? stripeResponse.payment_method : 'N/A';
    const stripeStatus = stripeResponse ? stripeResponse.status : 'N/A';
    const stripeCreatedDate = stripeResponse && stripeResponse.created ? formatDate(stripeResponse.created * 1000) : 'N/A';

    const cardDetails = stripeResponse && stripeResponse.latest_charge && stripeResponse.latest_charge.payment_method_details && stripeResponse.latest_charge.payment_method_details.card
                        ? stripeResponse.latest_charge.payment_method_details.card : null;

    const modalContent = `
        <div class="modal-header">
            <h2>Payment Details</h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="payment-details-view">
                <h3>Transaction Overview</h3>
                <p><strong>Payment ID:</strong> ${payment.transactionId || payment._id}</p>
                <p><strong>Payment Type:</strong> ${capitalizeFirstLetter(payment.paymentType)}</p>
                <p><strong>User Type:</strong> ${capitalizeFirstLetter(payment.userType)}</p>
                <p><strong>User ID:</strong> ${payment.userId}</p>
                <p><strong>Amount:</strong> LKR ${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
                <p><strong>Date:</strong> ${formatDate(payment.date)}</p>
                <p><strong>Payment Mode:</strong> ${capitalizeFirstLetter(payment.mode)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${payment.status || 'unknown'}">${capitalizeFirstLetter(payment.status || 'Unknown')}</span></p>

                ${stripeResponse ? `
                    <h3 style="margin-top: 20px;">Payment Gateway Reference</h3>
                    <p><strong>Stripe Payment Intent ID:</strong> ${stripePiId}</p>
                    <p><strong>Stripe Status:</strong> ${capitalizeFirstLetter(stripeStatus)}</p>
                    ${cardDetails ? `
                        <p><strong>Card Last 4:</strong> ${cardDetails.last4 || 'N/A'}</p>
                    ` : ''}
                ` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Close</button>
        </div>
    `;
    showModal(modalContent);

    // --- NEW: Add event listeners for the close buttons after modal content is loaded ---
    const currentModal = document.getElementById('dynamicModal');
    if (currentModal) {
        const closeBtns = currentModal.querySelectorAll('.close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                closeModal();
            });
        });

        currentModal.addEventListener('click', function(event) {
            if (event.target === currentModal) {
                closeModal();
            }
        });
    }
    // --- END NEW EVENT LISTENERS ---
}


// --- DOMContentLoaded for page initialization and event listener attachment ---
document.addEventListener('DOMContentLoaded', async function() {
    // Re-assign global variables from localStorage on DOMContentLoaded
    token = localStorage.getItem('token'); // Removed const for global re-assignment
    userId = localStorage.getItem('userId'); // Removed const
    userRole = localStorage.getItem('userRole'); // Removed const

    if (!token || !userId || !userRole) {
        alert('Authentication required to view payments.');
        window.location.href = '../../index.html';
        return;
    }

    // Initialize Stripe-related DOM elements once DOM is ready
    // These need to be assigned after DOMContentLoaded because elements might not exist immediately
    stripeCardContainer = document.getElementById('stripeCardContainer');
    cardErrors = document.getElementById('card-errors');


    // --- Handle "Make Payment" Modal & Submission Logic ---

    const addPaymentModalTrigger = document.querySelector('[data-modal-target="addPaymentModal"]');
    if (addPaymentModalTrigger) {
        addPaymentModalTrigger.addEventListener('click', async () => {
            console.log("Add Payment Modal opened.");
            const paymentIdField = document.getElementById('paymentId');
            if(paymentIdField) paymentIdField.value = 'PMT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            document.getElementById('paymentType').value = '';
            document.getElementById('amount').value = '';
            document.getElementById('paymentGateway').value = 'stripe';

            if(stripeCardContainer) stripeCardContainer.style.display = 'block';
            if(cardErrors) cardErrors.textContent = '';

            await initializeStripe();

            resetSubmitButton(document.getElementById('submitPayment'), document.getElementById('submitPayment').querySelector('.fa-spinner'), document.getElementById('submitPayment').querySelector('span'));
        });
    }

    const paymentGatewaySelect = document.getElementById('paymentGateway');
    if (paymentGatewaySelect) {
        paymentGatewaySelect.addEventListener('change', async function() {
            console.log("Payment Gateway selected:", this.value);
            if (this.value === 'stripe') {
                if(stripeCardContainer) stripeCardContainer.style.display = 'block';
                await initializeStripe();
            } else {
                if(stripeCardContainer) stripeCardContainer.style.display = 'none';
                if(cardElement) cardElement.clear();
            }
        });
    }


    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        console.log("Payment form found, attaching submit listener.");
        paymentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log("--- Pay Now button clicked, form submitted! ---");

            const submitBtn = document.getElementById('submitPayment');
            const spinner = submitBtn.querySelector('.fa-spinner');
            const buttonText = submitBtn.querySelector('span');

            if (spinner) spinner.style.display = 'inline-block';
            if (buttonText) buttonText.textContent = 'Processing...';
            submitBtn.disabled = true;

            const paymentType = document.getElementById('paymentType').value;
            const amount = parseFloat(document.getElementById('amount').value);
            const selectedGateway = document.getElementById('paymentGateway').value;
            const displayPaymentId = document.getElementById('paymentId').value;

            if (!paymentType || isNaN(amount) || amount <= 0 || !selectedGateway) {
                console.error("Client-side validation failed: Missing payment details.");
                showNotification('Please fill all required fields and select a payment gateway.', 'error');
                resetSubmitButton(submitBtn, spinner, buttonText);
                return;
            }
            console.log("Client-side validation passed. Selected Gateway:", selectedGateway);

            try {
                if (selectedGateway === 'stripe') {
                    console.log("Attempting Stripe payment.");
                    if (!stripe || !cardElement) {
                        await initializeStripe();
                        if (!stripe || !cardElement) {
                            console.error("Stripe not properly initialized, cannot proceed with payment.");
                            showNotification('Payment service not ready. Please try again.', 'error');
                            resetSubmitButton(submitBtn, spinner, buttonText);
                            return;
                        }
                    }

                    const { paymentMethod, error } = await stripe.createPaymentMethod({
                        type: 'card',
                        card: cardElement,
                    });

                    if (error) {
                        if (cardErrors) cardErrors.textContent = error.message;
                        showNotification(error.message, 'error');
                        console.error("Stripe createPaymentMethod error:", error);
                        resetSubmitButton(submitBtn, spinner, buttonText);
                        return;
                    }
                    console.log("Stripe PaymentMethod created:", paymentMethod.id);

                    const res = await fetch('http://localhost:5000/api/payments/process-stripe-payment', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            paymentMethodId: paymentMethod.id,
                            amount: Math.round(amount * 100),
                            paymentType: paymentType,
                            displayPaymentId: displayPaymentId
                        })
                    });
                    console.log("Fetch to process-stripe-payment sent.");

                    const data = await res.json();
                    console.log("Response from process-stripe-payment:", data);

                    if (res.ok && data.success) {
                        showNotification(data.message || 'Payment succeeded!', 'success');
                        closeModal();
                        loadUserPayments();
                    } else {
                        showNotification(data.message || 'Payment failed.', 'error');
                    }

                } else {
                    console.warn("Unexpected payment gateway selected:", selectedGateway);
                    showNotification("An unexpected payment gateway was selected.", "error");
                }

            } catch (err) {
                console.error('Error processing payment (outer catch block):', err);
                showNotification('An error occurred during payment processing. Please try again.', 'error');
            } finally {
                resetSubmitButton(submitBtn, spinner, buttonText);
            }
        });
    } else {
        console.warn("Payment form element not found, skipping event listener attachment.");
    }

    function resetSubmitButton(btn, spinner, textSpan) {
        if (spinner) spinner.style.display = 'none';
        if (textSpan) textSpan.textContent = 'Pay Now';
        if (btn) btn.disabled = false;
        console.log("Submit button reset.");
    }

    // Initial load of payments
    loadUserPayments();


    // --- Global Utility Functions (from script.js, assumed to be accessible globally) ---
    // These functions (showNotification, showModal, closeModal, formatDate, capitalizeFirstLetter)
    // must be available in the global scope for payment.js to work.
    // If you copied them into script.js outside DOMContentLoaded, they should be fine.
    // Otherwise, copy them directly into payment.js (outside its DOMContentLoaded).

    // --- NEW: Event listener for 'View' buttons in the payment history table ---
    document.body.addEventListener('click', async function(e) {
        if (e.target.classList.contains('view-payment-btn')) {
            const paymentId = e.target.getAttribute('data-id'); // Get the MongoDB _id of the payment
            console.log(`View button clicked for Payment ID: ${paymentId}`); // Debug Log

            try {
                const res = await fetch(`http://localhost:5000/api/payments/${paymentId}`, { // Fetch single payment
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                const data = await res.json();
                console.log("Single payment details API response:", data); // Debug Log

                if (res.ok && data.success && data.payment) {
                    showPaymentDetailsModal(data.payment); // Display details in a modal
                } else {
                    showNotification(data.message || 'Failed to load payment details.', 'error');
                    console.error('Error loading single payment:', data.message);
                }
            } catch (error) {
                showNotification('Network error loading payment details.', 'error');
                console.error('Network error loading single payment (catch):', error);
            }
        }
    });

    // --- NEW: Function to display payment details in a modal ---
    // frontend/js/payment.js

// ... (previous functions and code) ...

// --- Function to display payment details in a modal ---
function showPaymentDetailsModal(payment) {
    const stripeResponse = payment.gatewayResponse;
    const stripePiId = stripeResponse ? stripeResponse.id : 'N/A';
    const stripeChargeId = stripeResponse && stripeResponse.latest_charge && stripeResponse.latest_charge.id ? stripeResponse.latest_charge.id : 'N/A';
    const stripePmId = stripeResponse ? stripeResponse.payment_method : 'N/A';
    const stripeStatus = stripeResponse ? stripeResponse.status : 'N/A';
    const stripeCreatedDate = stripeResponse && stripeResponse.created ? formatDate(stripeResponse.created * 1000) : 'N/A';

    const cardDetails = stripeResponse && stripeResponse.latest_charge && stripeResponse.latest_charge.payment_method_details && stripeResponse.latest_charge.payment_method_details.card
                            ? stripeResponse.latest_charge.payment_method_details.card : null;

    const modalContent = `
        <div class="modal-header">
            <h2>Payment Details</h2>
            <button class="close-modal">&times;</button>
        </div>
        <div class="modal-body">
            <div class="payment-details-view">
                <h3>Transaction Overview</h3>
                <p><strong>Payment ID:</strong> ${payment.transactionId || payment._id}</p>
                <p><strong>Payment Type:</strong> ${capitalizeFirstLetter(payment.paymentType)}</p>
                <p><strong>User Type:</strong> ${capitalizeFirstLetter(payment.userType)}</p>
                <p><strong>User ID:</strong> ${payment.userId}</p>
                <p><strong>Amount:</strong> LKR ${payment.amount ? payment.amount.toFixed(2) : '0.00'}</p>
                <p><strong>Date:</strong> ${formatDate(payment.date)}</p>
                <p><strong>Payment Mode:</strong> ${capitalizeFirstLetter(payment.mode)}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${payment.status || 'unknown'}">${capitalizeFirstLetter(payment.status || 'Unknown')}</span></p>

                ${stripeResponse ? `
                    <h3 style="margin-top: 20px;">Payment Gateway Reference</h3>
                    <p><strong>Stripe Payment Intent ID:</strong> ${stripePiId}</p>
                    <p><strong>Stripe Status:</strong> ${capitalizeFirstLetter(stripeStatus)}</p>
                    ${cardDetails ? `
                        <p><strong>Card Last 4:</strong> ${cardDetails.last4 || 'N/A'}</p>
                    ` : ''}
                ` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary close-modal">Close</button>
        </div>
    `;
    showModal(modalContent); // Use the global showModal function

    // >>>>>> NEW DEBUGGING AND ROBUST LISTENER ATTACHMENT FOR MODAL CLOSE <<<<<<
    const currentModalElement = document.getElementById('dynamicModal'); // Get the modal that was just opened
    console.log("DEBUG: showPaymentDetailsModal - currentModalElement:", currentModalElement); // Debug Log

    if (currentModalElement) {
        // Attach listener to 'x' button and 'Close' button within THIS specific modal
        const closeBtns = currentModalElement.querySelectorAll('.close-modal');
        console.log("DEBUG: showPaymentDetailsModal - Found close buttons:", closeBtns.length); // Debug Log
        
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                console.log("DEBUG: Close button clicked. Calling closeModal()."); // Debug Log
                closeModal(); // Call your closeModal function
            });
        });

        // Attach listener for clicking outside the modal content
        currentModalElement.addEventListener('click', function(event) {
            // Check if the click was directly on the modal overlay (not its content)
            const modalContent = currentModalElement.querySelector('.modal-content');
            if (modalContent && !modalContent.contains(event.target)) {
                 console.log("DEBUG: Click outside modal content. Calling closeModal()."); // Debug Log
                closeModal();
            }
        });
    } else {
        console.warn("DEBUG: showPaymentDetailsModal - dynamicModal not found after showModal. Cannot attach close listeners."); // Debug Warning
    }
    // >>>>>> END NEW DEBUGGING AND ROBUST LISTENER ATTACHMENT <<<<<<
}
});

// this is frontend payment.js file and make changes properly