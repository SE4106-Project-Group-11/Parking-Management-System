// JavaScript for Payment Management functionality

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Please log in first.');
    return;
  }

  // DOM elements
  const form = document.getElementById('paymentForm');
  const paymentIdEl = document.getElementById('paymentId');
  const typeEl = document.getElementById('paymentType');
  // For employee page, these may not exist
  const userTypeEl = document.getElementById('userType');
  const userIdEl = document.getElementById('userId');
  const amountEl = document.getElementById('amount');
  const dateEl = document.getElementById('paymentDate');
  const modeEl = document.getElementById('paymentMode');
  const tbody = document.getElementById('paymentsTable');
  const submitBtn = document.getElementById('submitPayment');
  const cancelBtn = document.getElementById('cancelPayment');
  const addBtn = document.querySelector('[data-modal-target="addPaymentModal"]');

  // Optional error fields map
  const errors = {
    paymentType: document.getElementById('paymentTypeError'),
    userType: document.getElementById('userTypeError'),
    userId: document.getElementById('userIdError'),
    amount: document.getElementById('amountError'),
    date: document.getElementById('paymentDateError'),
    paymentMode: document.getElementById('paymentModeError')
  };

  // Helpers for missing inputs
  const getUserType = () => userTypeEl ? userTypeEl.value : localStorage.getItem('userRole') || '';
  const getUserId = () => userIdEl ? userIdEl.value : localStorage.getItem('userId') || '';
  const getDate = () => dateEl ? dateEl.value : new Date().toISOString().split('T')[0];

  // Clear only existing error messages
  const clearErrorMessages = () => {
    Object.values(errors).forEach(el => {
      if (el) el.textContent = '';
    });
  };

  // Validate form data
  const validate = (data) => {
    let valid = true;
    clearErrorMessages();
    if (!data.paymentType && errors.paymentType) {
      errors.paymentType.textContent = 'Select payment type'; valid = false;
    }
    if (userTypeEl && !data.userType && errors.userType) {
      errors.userType.textContent = 'Select user type'; valid = false;
    }
    if (userIdEl && !data.userId && errors.userId) {
      errors.userId.textContent = 'Enter user ID'; valid = false;
    }
    if ((isNaN(data.amount) || data.amount <= 0) && errors.amount) {
      errors.amount.textContent = 'Enter valid amount'; valid = false;
    }
    if (dateEl && !data.date && errors.date) {
      errors.date.textContent = 'Select date'; valid = false;
    }
    if (!data.mode && errors.paymentMode) {
      errors.paymentMode.textContent = 'Select payment mode'; valid = false;
    }
    return valid;
  };

  // Load existing payments
  const loadPayments = async () => {
    try {
      const res = await fetch('/api/payments/me', { headers: { 'Authorization': 'Bearer ' + token } });
      const { payments } = await res.json();
      tbody.innerHTML = payments.length ? payments.map(p => `
        <tr>
          <td>${p._id}</td>
          <td>${p.paymentType || 'Permit'}</td>
          <td>${p.userType}</td>
          <td>${p.userId}</td>
          <td>${p.amount.toFixed(2)}</td>
          <td>${new Date(p.date).toLocaleDateString()}</td>
          <td>${p.mode}</td>
          <td>
            <button class="view-btn" data-id="${p._id}"><i class="fas fa-eye"></i></button>
            <button class="print-btn" data-id="${p._id}"><i class="fas fa-print"></i></button>
          </td>
        </tr>
      `).join('') : '<tr><td colspan="8">No payments made yet.</td></tr>';
    } catch (e) {
      console.error(e);
      tbody.innerHTML = '<tr><td colspan="8">Error loading payments.</td></tr>';
    }
  };

  loadPayments();

  // Open modal to add payment
  addBtn?.addEventListener('click', () => {
    if (paymentIdEl) paymentIdEl.value = 'PMT' + Math.floor(Math.random() * 1e5).toString().padStart(5, '0');
    if (dateEl) dateEl.value = getDate();
    clearErrorMessages();
    form?.reset();
    const modal = document.getElementById('addPaymentModal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
  });

  // Close modal
  const closeModal = () => {
    const modal = document.getElementById('addPaymentModal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
  };
  cancelBtn?.addEventListener('click', closeModal);
  document.querySelectorAll('.close-modal').forEach(btn => btn.addEventListener('click', closeModal));

  // Submit payment
  submitBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const data = {
      paymentType: typeEl?.value,
      userType: getUserType(),
      userId: getUserId(),
      paymentId: paymentIdEl?.value,
      amount: parseFloat(amountEl?.value),
      date: getDate(),
      mode: modeEl?.value
    };
    if (!validate(data)) return;
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message);
      alert('Payment saved!');
      closeModal();
      loadPayments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  });

  // View and print handlers
  document.addEventListener('click', (e) => {
    const id = e.target.closest('button')?.dataset.id;
    if (!id) return;
    if (e.target.closest('.view-btn')) showDetails(id);
    if (e.target.closest('.print-btn')) printReceipt(id);
  });

  const showDetails = (id) => {
    const row = Array.from(tbody.rows).find(r => r.cells[0].textContent === id);
    if (!row) return;
    const inner = `
      <div class="modal-header"><h2>Payment Details</h2><button class="close-modal">×</button></div>
      <div class="modal-body">
        <p><strong>ID:</strong> ${id}</p>
        <p><strong>Type:</strong> ${row.cells[1].textContent}</p>
        <p><strong>Amount:</strong> ${row.cells[4].textContent}</p>
        <p><strong>Date:</strong> ${row.cells[5].textContent}</p>
      </div>
      <div class="modal-footer"><button class="btn close-modal">Close</button></div>
    `;
    document.getElementById('dynamicModal')?.remove();
    showModal(inner);
  };

  const printReceipt = (id) => {
    const row = Array.from(tbody.rows).find(r => r.cells[0].textContent === id);
    if (!row) return;
    const html = `
      <html><body><h1>Receipt ${id}</h1>
      <p>Amount: ${row.cells[4].textContent}</p>
      <script>window.print();</script></body></html>`;
    const w = window.open(); if (w) { w.document.write(html); w.document.close(); }
  };

  // Generic modal
  function showModal(content) {
    const modal = document.createElement('div');
    modal.id = 'dynamicModal'; modal.className = 'modal';
    modal.innerHTML = `<div class="modal-content">${content}</div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  }
});
