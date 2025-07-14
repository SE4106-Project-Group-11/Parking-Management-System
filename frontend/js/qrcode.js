// frontend/js/qrcode.js

document.addEventListener('DOMContentLoaded', async function() {
    // --- DOM Elements ---
    const qrCodeImage = document.getElementById('qrCodeImage');
    const printQRCodeBtn = document.getElementById('printQRCode');
    const downloadQRCodeBtn = document.getElementById('downloadQRCode');

    const qrEmployeeId = document.getElementById('qrEmployeeId');
    const qrEmployeeName = document.getElementById('qrEmployeeName');
    const qrEmployeeEmail = document.getElementById('qrEmployeeEmail');
    const qrVehicleNo = document.getElementById('qrVehicleNo');
    const qrPermitStatus = document.getElementById('qrPermitStatus');
    const headerUserName = document.getElementById('headerUserName'); // For top bar user name

    // --- Authentication Check ---
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId'); // MongoDB _id from localStorage

    // Redirect if not logged in or not an employee
    if (!token || userRole !== 'employee') {
        alert('Access denied. Please log in as an employee.');
        window.location.href = '../../index.html';
        return;
    }

    // --- Fetch User Data and Generate QR Code ---
    let fetchedUserData = {}; // Will store the comprehensive user data

    try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Send the JWT token
            }
        });
        const responseData = await res.json();

        if (res.ok && responseData.user) {
            fetchedUserData = responseData.user; // Contains populated permits, empID, etc.

            // 1. Update Header User Name
            if (headerUserName) headerUserName.textContent = fetchedUserData.name || 'Employee';

            // 2. Update QR Code Info Section
            if (qrEmployeeId) qrEmployeeId.textContent = fetchedUserData.empID || 'N/A';
            if (qrEmployeeName) qrEmployeeName.textContent = fetchedUserData.name || 'N/A';
            if (qrEmployeeEmail) qrEmployeeEmail.textContent = fetchedUserData.email || 'N/A';
            if (qrVehicleNo) qrVehicleNo.textContent = fetchedUserData.vehicleNo || 'N/A';

            // 3. Determine Permit Status and Generate QR Code
            const activePermit = fetchedUserData.permits.find(p => p.status === 'approved' && new Date(p.endDate) >= new Date());

            if (activePermit) {
                // Update Permit Status badge
                if (qrPermitStatus) {
                    qrPermitStatus.textContent = `Active until ${formatDate(activePermit.endDate)}`;
                    qrPermitStatus.className = 'status-badge status-active';
                }

                // Data to encode in QR Code (customize as needed for your scanner)
                const qrData = {
                    type: fetchedUserData.role,
                    userId: fetchedUserData._id, // MongoDB _id
                    empID: fetchedUserData.empID, // Employee-specific ID
                    name: fetchedUserData.name,
                    vehicleNo: fetchedUserData.vehicleNo,
                    permitId: activePermit.permitId,
                    permitStatus: 'Active'
                };
                const qrDataString = JSON.stringify(qrData); // Encode as JSON string

                // Generate QR Code image URL using a public API (replace with your backend if you build a QR generator)
                if (qrCodeImage) {
                    qrCodeImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrDataString)}`;
                    qrCodeImage.alt = `QR Code for ${fetchedUserData.name}`;
                }

                // Enable buttons once QR is loaded
                if (printQRCodeBtn) printQRCodeBtn.disabled = false;
                if (downloadQRCodeBtn) downloadQRCodeBtn.disabled = false;

            } else {
                // No active permit
                if (qrPermitStatus) {
                    qrPermitStatus.textContent = 'No Active Permit';
                    qrPermitStatus.className = 'status-badge status-inactive';
                }
                // Display a generic/placeholder QR image or nothing
                if (qrCodeImage) {
                    qrCodeImage.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDI1MCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyNTAiIGZpbGw9IiNDQ0NDQ0MiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9ImFyaWFsIiBmb250LXNpemU9IjE2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2NjY2Ij5ObyBBY3RpdmUgUGVybWl0PC90ZXh0Pjwvc3ZnPg==';
                    qrCodeImage.alt = 'No Active Permit QR Code';
                }
                // Disable buttons
                if (printQRCodeBtn) printQRCodeBtn.disabled = true;
                if (downloadQRCodeBtn) downloadQRCodeBtn.disabled = true;
                showNotification('No active permit found. QR code not generated.', 'info');
            }

        } else {
            console.error('Failed to load user data for QR code:', responseData.message || 'Unknown error');
            showNotification('Could not load QR code details. Please try again.', 'error');
            if (printQRCodeBtn) printQRCodeBtn.disabled = true;
            if (downloadQRCodeBtn) downloadQRCodeBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error fetching QR code data:', error);
        showNotification('Network error loading QR code. Please check your connection.', 'error');
        if (printQRCodeBtn) printQRCodeBtn.disabled = true;
        if (downloadQRCodeBtn) downloadQRCodeBtn.disabled = true;
    }

    // --- Print QR Code functionality ---
    if (printQRCodeBtn) {
        printQRCodeBtn.addEventListener('click', function() {
            printQRCode(fetchedUserData, qrCodeImage.src); // Pass dynamic data and current QR image src
        });
    }

    // --- Download QR Code functionality ---
    if (downloadQRCodeBtn) {
        downloadQRCodeBtn.addEventListener('click', function() {
            downloadQRCode(fetchedUserData, qrCodeImage.src); // Pass dynamic data and current QR image src
        });
    }

    // --- Helper functions for Print/Download (use fetched data) ---
    function printQRCode(data, qrUrl) {
        const printWindow = window.open('', '_blank');
        const userInfo = [];
        userInfo.push(`<p><strong>User Type:</strong> ${capitalizeFirstLetter(data.role || 'N/A')}</p>`);
        if (data.empID) userInfo.push(`<p><strong>Employee ID:</strong> ${data.empID}</p>`);
        if (data.name) userInfo.push(`<p><strong>Name:</strong> ${data.name}</p>`);
        if (data.email) userInfo.push(`<p><strong>Email:</strong> ${data.email}</p>`);
        if (data.vehicleNo) userInfo.push(`<p><strong>Vehicle No.:</strong> ${data.vehicleNo}</p>
            <p><strong>Permit ID:</strong> ${data.permits?.find(p => p.status === 'approved' && new Date(p.endDate) >= new Date())?.permitId || 'N/A'}</p>`);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Parking QR Code - ${data.name || ''}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .print-container { width: 100%; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; text-align: center; }
                    .qr-code-img img { max-width: 100%; height: auto; display: block; margin: 0 auto 20px; }
                    .qr-info { text-align: left; margin-top: 20px; }
                    .logo { font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1a3c6e; }
                    .footer { margin-top: 30px; font-size: 12px; color: #666; }
                </style>
            </head>
            <body>
                <div class="print-container">
                    <div class="logo">
                        <i class="fas fa-parking"></i> Parking Management System
                    </div>
                    <h2>Parking QR Code - ${data.name || ''}</h2>
                    <div class="qr-code-img">
                        <img src="${qrUrl}" alt="QR Code">
                    </div>
                    <div class="qr-info">
                        ${userInfo.join('')}
                    </div>
                    <div class="footer">
                        <p>This QR code can be used for quick identification at parking entries and exits.</p>
                        <p>Printed on: ${new Date().toLocaleString()}</p>
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

    function downloadQRCode(data, qrUrl) {
        const fileName = `${capitalizeFirstLetter(data.role || 'user')}_QRCode_${data.empID || data._id || 'UNKNOWN'}.png`;

        const downloadLink = document.createElement('a');
        downloadLink.href = qrUrl;
        downloadLink.download = fileName;

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        showNotification('QR Code downloaded successfully!', 'success');
    }

    // --- GLOBAL UTILITY FUNCTIONS (Assumed to be available from script.js) ---
    // If you are getting 'xxx is not defined', then copy these functions from script.js here
    // outside this DOMContentLoaded listener.
    // Example:
    // function showNotification(message, type) { /* ... */ }
    // function showModal(contentHtml) { /* ... */ }
    // function closeModal() { /* ... */ }
    // function formatDate(dateString) { /* ... */ }
    // function capitalizeFirstLetter(string) { /* ... */ }


    // --- COMMON SIDEBAR/LOGOUT (Assumed to be available from script.js) ---
    // No specific logic needed here if handled in script.js

}); // End of DOMContentLoaded