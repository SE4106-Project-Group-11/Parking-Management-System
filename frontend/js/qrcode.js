// frontend/js/qrcode.js

// qrcode.js
// Fetch and display non-employee QR code data

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    if (!token || !userId || userRole !== 'nonemployee') {
        alert('Access denied. Please log in as a non-employee.');
        window.location.href = '../../index.html';
        return;
    }
    try {
        const res = await fetch(`/api/auth/dashboard`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        console.log('QR code fetch response:', data); // Debug log
        if (!data.success) {
            alert(data.message || 'Failed to fetch QR code data.');
            window.location.href = '../../index.html';
            return;
        }
        if (!data.data || !data.data.user) {
            alert('No user data found in response.');
            console.error('No user data:', data);
            return;
        }
        const user = data.data.user;
        const qrData = {
            id: user._id || user.id || 'N/A',
            name: user.name || user.fullName || 'N/A',
            vehicleNo: user.vehicleNo || user.vehicle || 'N/A',
            permitType: user.permitType || (user.permits && user.permits[0] && user.permits[0].type) || 'N/A',
            validUntil: user.permits && user.permits.length > 0 ? user.permits[0].validUntil : 'N/A'
        };
        // Display QR code and user info
        const userNameEl = document.getElementById('qrUserName');
        if (userNameEl) userNameEl.textContent = qrData.name;
        const vehicleNoEl = document.getElementById('qrVehicleNo');
        if (vehicleNoEl) vehicleNoEl.textContent = qrData.vehicleNo;
        const permitTypeEl = document.getElementById('qrPermitType');
        if (permitTypeEl) permitTypeEl.textContent = qrData.permitType;
        const validUntilEl = document.getElementById('qrValidUntil');
        if (validUntilEl) validUntilEl.textContent = qrData.validUntil;
        // Generate QR code
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify(qrData))}`;
        const qrImageEl = document.getElementById('qrImage');
        if (qrImageEl) qrImageEl.src = qrCodeUrl;
    } catch (err) {
        alert('Error fetching QR code data. Please try again later.');
        console.error('QR code fetch error:', err);
    }
});