// routes/parking.js
const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');

// Test route
router.get('/test', (req, res) => {
    console.log('🧪 Test endpoint called');
    res.json({ 
        success: true, 
        message: 'Parking QR Verification API is working!',
        timestamp: new Date(),
        endpoints: [
            'GET /api/parking/test',
            'POST /api/parking/qr-verify-entry',
            'POST /api/parking/qr-verify-exit', 
            'GET /api/parking/status',
            'GET /api/parking/entries',
            'POST /api/parking/sample-data'
        ]
    });
});

// QR Code verification endpoints
router.post('/qr-verify-entry', parkingController.verifyQRAndAddEntry);
router.post('/qr-verify-exit', parkingController.verifyQRAndMarkExit);

// Status and entries
router.get('/status', parkingController.getParkingStatus);
router.get('/entries', parkingController.getTodayEntries);

// Legacy endpoints (backward compatibility)
router.post('/entry', parkingController.addEntry);
router.post('/exit', parkingController.markExit);

// Test data
router.post('/sample-data', parkingController.addSampleData);

module.exports = router;