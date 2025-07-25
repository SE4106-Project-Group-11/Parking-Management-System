document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    // The inline script already checks the role, but we can double-check
    if (!token) {
        window.location.href = '../../index.html';
        return;
    }
    loadDashboardData(token);
});

async function loadDashboardData(token) {
    try {
        const response = await fetch('/api/auth/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch data. Please log in again.');
        
        const result = await response.json();
        if (result.success) {
            updateUI(result.data);
        } else {
            throw new Error(result.message);
        }
    } catch (err) {
        alert(err.message);
        localStorage.clear();
        window.location.href = '../../index.html';
    }
}

function updateUI(data) {
    const { user, activePermit, allViolations, allPayments } = data;

    // 1. Update Header
    document.getElementById('user-name').textContent = user.name;

    // 2. Update Permit Card
    const permitStatusEl = document.getElementById('permit-status-badge');
    const permitVehicleEl = document.getElementById('permit-vehicle-no');
    const permitTypeEl = document.getElementById('permit-type');

    if (activePermit) {
        permitStatusEl.textContent = `Active until ${new Date(activePermit.expiryDate).toLocaleDateString()}`;
        permitStatusEl.className = 'status-badge status-active';
        permitVehicleEl.textContent = `Vehicle: ${user.vehicleNo}`;
        permitTypeEl.textContent = `Type: ${activePermit.permitType}`;
    } else {
        permitStatusEl.textContent = 'No Active Permit';
        permitStatusEl.className = 'status-badge status-inactive';
        permitVehicleEl.textContent = 'Please request or renew a permit.';
        permitTypeEl.textContent = '';
    }

    // 3. Update Violations Table
    const violationsTableBody = document.getElementById('violations-table-body');
    violationsTableBody.innerHTML = ''; // Clear hardcoded HTML rows
    if (!allViolations || allViolations.length === 0) {
        violationsTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No violations found.</td></tr>';
    } else {
        allViolations.forEach(v => {
            const actions = v.status.toLowerCase() === 'pending' 
                ? `<button class="btn btn-primary btn-sm">Pay Fine</button><button class="btn btn-secondary btn-sm">Dispute</button>`
                : `<button class="btn btn-secondary btn-sm">View Details</button>`;
            
            violationsTableBody.innerHTML += `
                <tr>
                    <td>${new Date(v.date).toLocaleDateString()}</td>
                    <td>${v.vehicleNo}</td>
                    <td>${v.violationType}</td>
                    <td>$${v.fineAmount.toFixed(2)}</td>
                    <td><span class="status-badge status-${v.status.toLowerCase()}">${v.status}</span></td>
                    <td>${actions}</td>
                </tr>`;
        });
    }

    // 4. Update Payment History Table
    const paymentHistoryBody = document.getElementById('payment-history-table-body');
    paymentHistoryBody.innerHTML = ''; // Clear hardcoded HTML rows
    if(!allPayments || allPayments.length === 0) {
        paymentHistoryBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No payment history found.</td></tr>';
    } else {
        allPayments.forEach(p => {
            paymentHistoryBody.innerHTML += `
                <tr>
                    <td>${new Date(p.date).toLocaleDateString()}</td>
                    <td>$${p.amount.toFixed(2)}</td>
                    <td>${p.paymentMethod || 'N/A'}</td>
                    <td>${p.description || 'Permit Payment'}</td>
                    <td><span class="status-badge status-approved">${p.status}</span></td>
                </tr>`;
        });
    }
}