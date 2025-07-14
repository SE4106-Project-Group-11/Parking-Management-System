
// frontend/js/payment.js

// --- GLOBAL UTILITY FUNCTIONS (Embedded directly in payment.js for guaranteed access) ---
// These are copies from your script.js. If you prefer them global, ensure script.js correctly
// defines them outside its DOMContentLoaded and is loaded BEFORE payment.js.

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


document.addEventListener('DOMContentLoaded', async function() {
    console.log("payment.js: DOMContentLoaded fired.");

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');

    if (!token || !userId || !userRole) {
        alert('Authentication required to view payments.');
        window.location.href = '../../index.html';
        return;
    }

    // --- STRIPE INTEGRATION SETUP ---
    // Note: Stripe will not fully initialize if its script is not loaded in HTML
    // or if the publishable key is invalid. Errors here will be caught by try/catch.
    let stripe = null;
    let elements = null;
    let cardElement = null;
    const stripeCardContainer = document.getElementById('stripeCardContainer');
    const cardErrors = document.getElementById('card-errors');

    async function initializeStripe() {
        console.log("Attempting to initialize Stripe.");
        if (typeof Stripe === 'undefined') {
            console.error("Stripe.js script not loaded!");
            showNotification('Stripe payment methods not available. Check script.js in HTML.', 'error');
            return; // Exit if Stripe script is not ready
        }
        if (!stripe) {
            try {
                // IMPORTANT: Replace with your actual Stripe publishable key (pk_test_...)
                // This key is safe to be in frontend code.
                stripe = Stripe('pk_test_51RkTtcQBCT5aRlOBsQOWLfz7dcLVqkJ23KuIfze4K8YetPS8mIvx4bTd2e7GRtQ0kTcAuQbasAbWpznwewZQCDJL00YZ6pu6i4'); // <<< IMPORTANT: Replace with your key
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
    // --- END STRIPE INTEGRATION SETUP ---


    // --- Load User Payments from Backend ---
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

            row.innerHTML = `
                <td>${payment.transactionId || payment._id}</td>
                <td>${capitalizeFirstLetter(payment.paymentType)}</td>
                <td>${capitalizeFirstLetter(payment.userType)}</td>
                <td>${payment.userId}</td>
                <td>LKR ${payment.amount.toFixed(2)}</td>
                <td>${paymentDate}</td>
                <td>${capitalizeFirstLetter(payment.mode)}</td>
                <td>
                    <button class="btn btn-sm btn-info view-payment-btn" data-id="${payment._id}">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });
        console.log("Payments table populated.");
    }

    // --- Handle "Make Payment" Modal & Submission Logic ---

    const addPaymentModalTrigger = document.querySelector('[data-modal-target="addPaymentModal"]');
    if (addPaymentModalTrigger) {
        addPaymentModalTrigger.addEventListener('click', async () => {
            console.log("Add Payment Modal opened.");
            const paymentIdField = document.getElementById('paymentId');
            if(paymentIdField) paymentIdField.value = 'PMT' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
            document.getElementById('paymentType').value = '';
            document.getElementById('amount').value = '';
            // paymentGateway selection will default to 'stripe'
            document.getElementById('paymentGateway').value = 'stripe'; // Set default to stripe

            // Show Stripe container by default
            if(stripeCardContainer) stripeCardContainer.style.display = 'block';
            if(cardErrors) cardErrors.textContent = '';

            // Initialize Stripe when modal opens, if not already
            await initializeStripe();

            resetSubmitButton(document.getElementById('submitPayment'), document.getElementById('submitPayment').querySelector('.fa-spinner'), document.getElementById('submitPayment').querySelector('span'));
        });
    }

    // Handle Payment Gateway selection change (shows/hides Stripe card element)
    // This listener is still useful if you decide to add other gateways back
    const paymentGatewaySelect = document.getElementById('paymentGateway');
    if (paymentGatewaySelect) {
        paymentGatewaySelect.addEventListener('change', async function() {
            console.log("Payment Gateway selected:", this.value);
            if (this.value === 'stripe') {
                if(stripeCardContainer) stripeCardContainer.style.display = 'block';
                await initializeStripe();
            } else { // This block will now effectively only hide Stripe if some other (non-Stripe) option is added later
                if(stripeCardContainer) stripeCardContainer.style.display = 'none';
                if(cardElement) cardElement.clear();
                // Future: Handle other gateway specific UI here
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
            const selectedGateway = document.getElementById('paymentGateway').value; // Will be 'stripe'
            const displayPaymentId = document.getElementById('paymentId').value;

            if (!paymentType || isNaN(amount) || amount <= 0 || !selectedGateway) {
                console.error("Client-side validation failed: Missing payment details.");
                showNotification('Please fill all required fields and select a payment gateway.', 'error');
                resetSubmitButton(submitBtn, spinner, buttonText);
                return;
            }
            console.log("Client-side validation passed. Selected Gateway:", selectedGateway);

            try {
                // Since selectedGateway defaults to 'stripe', this block will always execute
                if (selectedGateway === 'stripe') {
                    console.log("Attempting Stripe payment.");
                    if (!stripe || !cardElement) { // Re-check if Stripe is truly initialized
                        await initializeStripe();
                        if (!stripe || !cardElement) { // Final check after re-initialization attempt
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

                } else { // This block should theoretically not be hit as 'stripe' is default selected
                    console.warn("Unexpected payment gateway selected:", selectedGateway);
                    showNotification("An unexpected payment gateway was selected.", "error");
                }

            } catch (err) {
                console.error('Error processing payment (outer catch block):', err);
                showNotification('An error occurred during payment processing. Please try again.', 'error');
            } finally {
                // Always reset button unless there's an explicit redirect (which Stripe direct method doesn't do)
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
});

// Okay, I have your `payment.js` code again. You're confirming it's the correct file.

// My previous response (where I provided the full payment code for Stripe only) should be complete for Stripe integration.

// **The next step is to actually try to make a payment with a Stripe test card and observe the console and network output.**

// To clarify, my previous response from **[Sunday, July 13, 2025 at 11:18:54 PM +0530]** provided the full, corrected code for:
// 1.  `frontend/pages/employee/payment-management.html`
// 2.  `frontend/js/payment.js`
// 3.  `backend/routes/payment.js`
// 4.  `backend/controllers/paymentController.js`
// 5.  And also reminded you about the `.env` and `npm install stripe` steps.

// You should have replaced the content of all these files with the code provided in that response.

// **Now, please follow these steps precisely to test the Stripe integration:**

// 1.  **Ensure your backend server is running cleanly.** (No errors in the terminal after `nodemon app.js`).
// 2.  **Clear your browser cache** (`Ctrl+Shift+R` or `Cmd+Shift+R`) to ensure you load the latest frontend code.
// 3.  **Go to your payment management page** (`http://localhost:5000/pages/employee/payment-management.html` or your dummy domain).
// 4.  **Open your browser's Developer Tools (`F12`) and go to the "Console" tab.**
// 5.  **Open the "Make Payment" modal.**
// 6.  Fill in the details:
//     * **Payment Type:** Choose "Permit" or "Violation".
//     * **Amount (LKR):** Enter `1000`.
//     * **Choose Payment Gateway:** It should already be selected as "Stripe (Card)".
//     * **Credit or Debit Card:** **Use a Stripe test card number.** For example, for a successful Visa payment, use:
//         * **Card Number:** `4242 4242 4242 4242`
//         * **Expiry Date:** Any future date (e.g., `12/25`)
//         * **CVC:** `123`
// 7.  **Click the "Pay Now" button.**

// **After clicking "Pay Now", please provide:**

// * **A screenshot of your browser's Console tab** (scrolled down to capture all new messages).
// * **A screenshot of your browser's Network tab** (showing the `process-stripe-payment` request and its status/response).

// This will show us the success or any new errors with the Stripe integration.

