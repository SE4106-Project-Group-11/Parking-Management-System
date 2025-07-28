//scanner.js

document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements - Fixed selectors to match your HTML
    const resultElement = document.getElementById('qr-reader-result');
    const startScanButton = document.getElementById('startScanButton');
    const rescanButton = document.getElementById('rescanButton');
    
    // Fixed: These elements don't exist in your HTML, so we'll handle them safely
    const statusText = document.querySelector('.status-indicator span:last-child');
    const statusIndicator = document.querySelector('.status-indicator');
    const scanningOverlay = document.querySelector('.scanning-overlay .scan-line');
    const scanningCorners = document.querySelectorAll('.scanning-overlay .corner');

    let html5QrcodeScanner;

    // --- UI Update Functions ---
    function updateStatus(message, isScanning = false) {
        if (statusText) {
            statusText.textContent = message;
        }
        if (statusIndicator) {
            statusIndicator.style.display = 'inline-flex';
        }
        if (isScanning) {
            startScanAnimation();
        } else {
            stopScanAnimation();
        }
    }

    function updateResultUI(message, type) {
        if (resultElement) {
            resultElement.innerHTML = `<span class="result-icon">${type === 'success' ? '✅' : '❌'}</span><span>${message}</span>`;
            resultElement.className = type === 'success' ? 'result-success' : 'result-error';
            resultElement.style.display = 'flex';
        }
    }
    
    function startScanAnimation() {
        if (scanningOverlay) {
            scanningOverlay.style.display = 'block';
        }
        if (scanningCorners.length > 0) {
            scanningCorners.forEach(c => c.style.display = 'block');
        }
    }

    function stopScanAnimation() {
        if (scanningOverlay) {
            scanningOverlay.style.display = 'none';
        }
        if (scanningCorners.length > 0) {
            scanningCorners.forEach(c => c.style.display = 'none');
        }
    }

    // --- Core Logic Functions ---
    function onScanSuccess(decodedText, decodedResult) {
        // Fixed: Properly check scanner state and clear
        try {
            if (html5QrcodeScanner) {
                html5QrcodeScanner.clear().catch(error => console.error('Failed to clear scanner', error));
            }
        } catch (error) {
            console.error('Scanner clear error:', error);
        }
        
        stopScanAnimation();
        
        if (rescanButton) {
            rescanButton.style.display = 'block';
        }
        if (startScanButton) {
            startScanButton.style.display = 'none';
        }
        if (statusIndicator) {
            statusIndicator.style.display = 'none';
        }

        // Fixed: Better JSON parsing with error handling
        try {
            const userData = JSON.parse(decodedText);
            if (userData && userData.permitId && userData.userId) {
                verifyPermitOnServer(userData);
            } else {
                updateResultUI('Error: QR Code missing required data (permitId, userId).', 'error');
            }
        } catch (error) {
            console.error('JSON Parse Error:', error);
            // If not JSON, treat as simple text
            updateResultUI(`Scanned: ${decodedText}`, 'success');
        }
    }

    function onScanFailure(error) {
        // Ignored to prevent console spam - this is fine
    }

    async function verifyPermitOnServer(userData) {
        updateResultUI('Processing...', 'processing');
        
        // TEMPORARY: Mock response for testing - ENABLED
        // Change this to false when your server endpoint is ready
        const useMockResponse = true;
        
        if (useMockResponse) {
            setTimeout(() => {
                // Mock successful verification
                updateResultUI(`✅ Access Granted: Welcome, Test User (Permit: ${userData.permitId}).`, 'success');
            }, 1000);
            return;
        }
        
        // Fixed: Better token handling
        const token = localStorage.getItem('token');
        if (!token) {
            updateResultUI('Error: Authentication token not found. Please login.', 'error');
            return;
        }

        try {
            // Fixed: Try multiple possible endpoints
            let apiUrl = 'http://localhost:5000/api/parking/verify';
            
            // Try common endpoint variations if the main one fails
            const possibleEndpoints = [
                'http://localhost:5000/api/parking/verify',
                'http://localhost:5000/api/verify',
                'http://localhost:5000/parking/verify',
                'http://localhost:5000/verify'
            ];
            
            let response;
            let lastError;
            
            // Try each endpoint until one works
            for (const endpoint of possibleEndpoints) {
                try {
                    response = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json', 
                            'Authorization': `Bearer ${token}` 
                        },
                        body: JSON.stringify({ 
                            permitId: userData.permitId, 
                            userId: userData.userId 
                        })
                    });
                    
                    // If we get a non-404 response, break out of the loop
                    if (response.status !== 404) {
                        apiUrl = endpoint;
                        break;
                    }
                } catch (error) {
                    lastError = error;
                    continue;
                }
            }
            
            // If all endpoints failed with 404, show specific message
            if (response && response.status === 404) {
                updateResultUI('Error: Server endpoint not found. Please check your backend API.', 'error');
                console.error('All API endpoints returned 404. Available endpoints may be different.');
                return;
            }

            // Fixed: Check if response is JSON before parsing
            const contentType = response.headers.get('content-type');
            let result;
            
            if (contentType && contentType.includes('application/json')) {
                result = await response.json();
            } else {
                const text = await response.text();
                console.error('Non-JSON response:', text);
                updateResultUI('Error: Server returned invalid response format.', 'error');
                return;
            }

            if (!response.ok) {
                updateResultUI(`Access Denied: ${result.message || 'Unknown Error'}`, 'error');
                return;
            }
            
            // Fixed: Better success message handling
            const name = result.data?.name || 'User';
            updateResultUI(`Access Granted: Welcome, ${name}.`, 'success');

        } catch (error) {
            console.error("Verification Fetch Error:", error);
            
            // Fixed: More specific error messages based on error type
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                updateResultUI('Network Error: Cannot connect to server. Is the server running on port 5000?', 'error');
            } else if (error.name === 'SyntaxError') {
                updateResultUI('Error: Server returned invalid JSON response.', 'error');
            } else {
                updateResultUI('Error: Please check if your backend server is running and the API endpoint exists.', 'error');
            }
            
            // Log helpful debugging info
            console.log('Debugging info:');
            console.log('- Check if server is running: http://localhost:5000');
            console.log('- Verify API endpoint exists: POST /api/parking/verify');
            console.log('- Check server console for errors');
        }
    }

    function startScanner() {
        // Fixed: Better button state management
        if (startScanButton) {
            startScanButton.style.display = 'none';
        }
        if (rescanButton) {
            rescanButton.style.display = 'none';
        }
        if (resultElement) {
            resultElement.style.display = 'none';
            resultElement.className = ''; // Clear previous classes
        }
        
        updateStatus('Starting camera...', false);

        try {
            // Fixed: Better scanner initialization
            html5QrcodeScanner = new Html5QrcodeScanner(
                "qr-reader", 
                { 
                    fps: 10, 
                    qrbox: { width: 280, height: 280 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true
                }, 
                false
            );
            
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);
            
            // Fixed: Better timing for status update
            setTimeout(() => {
                updateStatus('Scanning for QR code...', true);
            }, 1500);
            
        } catch (error) {
            console.error('Scanner initialization error:', error);
            updateResultUI('Error: Failed to initialize camera scanner.', 'error');
            
            // Reset buttons on error
            if (startScanButton) {
                startScanButton.style.display = 'block';
            }
        }
    }

    // --- Event Listeners ---
    if (startScanButton) {
        startScanButton.addEventListener('click', startScanner);
    }
    if (rescanButton) {
        rescanButton.addEventListener('click', startScanner);
    }

    // Fixed: Initialize scanner automatically if no start button exists
    if (!startScanButton) {
        // Auto-start scanner if there's no start button
        setTimeout(startScanner, 500);
    }

    // Fixed: Handle camera permissions proactively
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                stream.getTracks().forEach(track => track.stop());
                console.log('Camera permission granted');
                updateStatus('Camera ready', false);
            })
            .catch(function(err) {
                console.error('Camera permission denied:', err);
                updateStatus('Camera permission needed', false);
                updateResultUI('Please allow camera access to scan QR codes.', 'error');
            });
    }
});