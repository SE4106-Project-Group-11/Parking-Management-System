// QR Code functionality for the Parking Management System

document.addEventListener('DOMContentLoaded', function() {
    // Get the QR Code image element
    const qrCodeImage = document.getElementById('qrCodeImage');
    const printQRCodeBtn = document.getElementById('printQRCode');
    const downloadQRCodeBtn = document.getElementById('downloadQRCode');
    
    // User information - in a real app, this would be fetched from the server
    // based on the user's session
    const userData = {
        id: qrCodeImage ? qrCodeImage.getAttribute('data-user-id') : '',
        name: qrCodeImage ? qrCodeImage.getAttribute('data-user-name') : '',
        type: qrCodeImage ? qrCodeImage.getAttribute('data-user-type') : '',
        vehicleNo: qrCodeImage ? qrCodeImage.getAttribute('data-vehicle') : '',
        department: qrCodeImage ? qrCodeImage.getAttribute('data-department') : '',
        company: qrCodeImage ? qrCodeImage.getAttribute('data-company') : '',
        purpose: qrCodeImage ? qrCodeImage.getAttribute('data-purpose') : ''
    };
    
    // Print QR Code functionality
    if (printQRCodeBtn) {
        printQRCodeBtn.addEventListener('click', function() {
            printQRCode(userData);
        });
    }
    
    // Download QR Code functionality
    if (downloadQRCodeBtn) {
        downloadQRCodeBtn.addEventListener('click', function() {
            downloadQRCode();
        });
    }
    
    // Function to print QR Code
    function printQRCode(userData) {
        const printWindow = window.open('', '_blank');
        const qrCodeUrl = document.getElementById('qrCodeImage').src;
        
        // Prepare user-specific information for display
        const userInfo = [];
        if (userData.id) userInfo.push(`<p><strong>${userData.type === 'visitor' ? 'Visitor' : userData.type === 'employee' ? 'Employee' : 'Non-Employee'} ID:</strong> ${userData.id}</p>`);
        if (userData.name) userInfo.push(`<p><strong>Name:</strong> ${userData.name}</p>`);
        if (userData.department) userInfo.push(`<p><strong>Department:</strong> ${userData.department}</p>`);
        if (userData.company) userInfo.push(`<p><strong>Company:</strong> ${userData.company}</p>`);
        if (userData.purpose) userInfo.push(`<p><strong>Purpose:</strong> ${userData.purpose}</p>`);
        if (userData.vehicleNo) userInfo.push(`<p><strong>Vehicle No.:</strong> ${userData.vehicleNo}</p>`);
        userInfo.push(`<p><strong>User Type:</strong> ${userData.type === 'employee' ? 'Employee' : userData.type === 'nonemployee' ? 'Non-Employee' : 'Visitor'}</p>`);
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Parking QR Code - ${userData.name}</title>
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
                    <h2>Parking QR Code - ${userData.name}</h2>
                    <div class="qr-code-img">
                        <img src="${qrCodeUrl}" alt="QR Code">
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
                    window.onload = function() {
                        window.print();
                    }
                </script>
            </body>
            </html>
        `);
        
        printWindow.document.close();
    }
    
    // Function to download QR Code
    function downloadQRCode() {
        const qrCodeUrl = document.getElementById('qrCodeImage').src;
        const userType = userData.type || 'user';
        const userId = userData.id || 'ID';
        
        // Create a temporary anchor element to download the image
        const downloadLink = document.createElement('a');
        downloadLink.href = qrCodeUrl;
        downloadLink.download = `${userType.charAt(0).toUpperCase() + userType.slice(1)}_QRCode_${userId}.png`;
        
        // Append to the body temporarily
        document.body.appendChild(downloadLink);
        
        // Trigger the download
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
        
        // Show notification
        showNotification('QR Code downloaded successfully!', 'success');
    }
    
    // Show notification function
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
}); 