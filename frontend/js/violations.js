// violations.js
// This file handles fetching and displaying non-employee violations

document.addEventListener('DOMContentLoaded', function() {

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (!token || !userId || userRole !== 'nonemployee') {
        alert('Access denied. Please log in as a non-employee.');
        window.location.href = '../../index.html';
        return;
    }
    fetch(`/api/violations/user/${userId}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(data => {
        if (!data.success) {
            alert(data.message || 'Failed to fetch violations.');
            window.location.href = '../../index.html';
            return;
        }
        // Populate violations table
        const violations = data.violations || [];
        const tbody = document.querySelector('tbody');
        tbody.innerHTML = '';
        if (violations.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No violations found.</td></tr>';
        } else {
            violations.forEach(v => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${v.date ? new Date(v.date).toLocaleDateString() : ''}</td>
                    <td>${v.vehicleNo || ''}</td>
                    <td>${v.violationType || v.reason || ''}</td>
                    <td>$${v.fineAmount || '0.00'}</td>
                    <td><span class="status-badge status-${v.status}">${v.status}</span></td>
                    <td>
                        <button class="btn btn-primary btn-sm pay-fine-btn" data-violation-id="${v._id}">Pay Fine</button>
                        <button class="btn btn-secondary btn-sm dispute-btn" data-violation-id="${v._id}">Dispute</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    })
    .catch(err => {
        alert('Error fetching violations. Please try again later.');
    });
});
