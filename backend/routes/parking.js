// routes/parking.js - CORRECTED VERSION

const express = require('express');
const router = express.Router();
const parkingController = require('../controllers/parkingController');
const mongoose = require('mongoose');

// FIXED: Enhanced test endpoint with database connection verification
router.get('/test', async (req, res) => {
    try {
        console.log('🧪 Enhanced test endpoint called');
        
        // Check database connection
        const dbState = mongoose.connection.readyState;
        const dbStateText = ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState];
        
        // Try a simple database operation
        let dbTest = null;
        try {
            const ParkingSlot = require('../models/ParkingSlot');
            const testDoc = await ParkingSlot.findOne().limit(1);
            dbTest = {
                success: true,
                hasDocuments: !!testDoc,
                documentCount: await ParkingSlot.countDocuments()
            };
        } catch (dbError) {
            dbTest = {
                success: false,
                error: dbError.message
            };
        }
        
        res.status(200).json({ 
            success: true, 
            message: 'Parking QR Verification API is working!',
            timestamp: new Date(),
            server: {
                nodeEnv: process.env.NODE_ENV || 'development',
                uptime: process.uptime(),
                memory: process.memoryUsage()
            },
            database: {
                connectionState: dbState,
                stateText: dbStateText,
                host: mongoose.connection.host,
                name: mongoose.connection.name,
                test: dbTest
            },
            endpoints: {
                main: [
                    'POST /api/parking/qr-verify-entry-bulletproof - Bulletproof QR entry (RECOMMENDED)',
                    'POST /api/parking/qr-verify-exit - QR exit verification',
                    'GET /api/parking/status - Get current parking status',
                    'GET /api/parking/entries - Get today\'s entries'
                ],
                testing: [
                    'GET /api/parking/test - API health check',
                    'GET /api/parking/test/database-save - Test database save operations',
                    'POST /api/parking/test/manual-entry - Manual test entry',
                    'DELETE /api/parking/test/clear-today - Clear today\'s entries'
                ],
                legacy: [
                    'POST /api/parking/qr-verify-entry - Original QR entry (if exists)',
                    'POST /api/parking/sample-data - Add sample data (if exists)'
                ]
            }
        });
    } catch (error) {
        console.error('❌ Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Test endpoint failed',
            error: error.message,
            timestamp: new Date()
        });
    }
});

// MAIN ROUTES - Production endpoints

// FIXED: Bulletproof QR entry (PRIMARY ENDPOINT)
router.post('/qr-verify-entry-bulletproof', async (req, res) => {
    try {
        console.log('\n🔥 Route: qr-verify-entry-bulletproof called');
        await parkingController.verifyQRAndAddEntryBulletproof(req, res);
    } catch (error) {
        console.error('❌ Route error in qr-verify-entry-bulletproof:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Route handler error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
});

// FIXED: QR exit verification
router.post('/qr-verify-exit', async (req, res) => {
    try {
        console.log('\n🚪 Route: qr-verify-exit called');
        await parkingController.verifyQRAndExit(req, res);
    } catch (error) {
        console.error('❌ Route error in qr-verify-exit:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Route handler error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
});

// FIXED: Get parking status
router.get('/status', async (req, res) => {
    try {
        console.log('\n📊 Route: status called');
        await parkingController.getParkingStatus(req, res);
    } catch (error) {
        console.error('❌ Route error in status:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Route handler error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
});

// FIXED: Get today's entries (alias for status)
router.get('/entries', async (req, res) => {
    try {
        console.log('\n📋 Route: entries called');
        await parkingController.getParkingStatus(req, res);
    } catch (error) {
        console.error('❌ Route error in entries:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Route handler error',
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
});

// TESTING ROUTES - Development and testing endpoints

// FIXED: Test database save functionality
router.get('/test/database-save', async (req, res) => {
    try {
        console.log('\n🧪 Route: test/database-save called');
        await parkingController.testDatabaseSave(req, res);
    } catch (error) {
        console.error('❌ Route error in test/database-save:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Test route handler error',
                error: error.message
            });
        }
    }
});

// FIXED: Manual test entry
router.post('/test/manual-entry', async (req, res) => {
    try {
        console.log('\n🔧 Route: test/manual-entry called');
        await parkingController.manualTestEntry(req, res);
    } catch (error) {
        console.error('❌ Route error in test/manual-entry:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Test route handler error',
                error: error.message
            });
        }
    }
});

// FIXED: Clear today's entries
router.delete('/test/clear-today', async (req, res) => {
    try {
        console.log('\n🗑️ Route: test/clear-today called');
        await parkingController.clearTodayEntries(req, res);
    } catch (error) {
        console.error('❌ Route error in test/clear-today:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Test route handler error',
                error: error.message
            });
        }
    }
});

// MIDDLEWARE - Error handling for all routes
router.use((error, req, res, next) => {
    console.error('❌ Parking router middleware error:', error);
    
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            message: 'Router middleware error',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
            timestamp: new Date()
        });
    }
});


module.exports = router;