// controllers/parkingController.js - SIMPLIFIED AND FIXED VERSION
const ParkingSlot = require('../models/ParkingSlot');

// Initialize parking data on server start
exports.initializeParkingData = async () => {
    try {
        console.log('🚀 Initializing parking system...');
        
        // Use the model's static method to get today's data
        const todayData = await ParkingSlot.getTodaysParkingData();
        const counts = todayData.getCounts();
        
        console.log('✅ Parking system initialized:', counts);
        
        return {
            success: true,
            message: 'Parking system initialized',
            data: counts
        };
    } catch (error) {
        console.error('❌ Error initializing parking system:', error);
        throw error;
    }
};

// Simple QR Code verification function
async function verifyQRCode({ userId, permitId, userName }) {
    try {
        console.log('🔐 Verifying QR code data...');
        
        // Basic validation - customize this based on your QR code format
        if (!userId || !permitId || !userName) {
            console.log('❌ Missing required fields in QR code');
            return { valid: false, reason: 'Missing required fields' };
        }
        
        // Simple format validation
        if (userId.length < 3) {
            console.log('❌ Invalid userId format');
            return { valid: false, reason: 'Invalid userId format' };
        }
        
        if (!permitId.startsWith('P') && !permitId.startsWith('permit')) {
            console.log('❌ Invalid permitId format');
            return { valid: false, reason: 'Invalid permitId format' };
        }
        
        console.log('✅ QR code validation passed');
        return { valid: true };
        
    } catch (error) {
        console.error('❌ Error during QR verification:', error);
        return { valid: false, reason: 'Verification system error' };
    }
}

// Simplified data extraction from QR code
function extractUserDataFromQR(qrData, additionalData = {}) {
    let userId, permitId, userName;
    
    try {
        // Handle different QR data formats
        if (typeof qrData === 'string') {
            try {
                // Try to parse as JSON first
                const parsed = JSON.parse(qrData);
                userId = parsed.userId || parsed.id;
                permitId = parsed.permitId || parsed.permit;
                userName = parsed.userName || parsed.name;
            } catch (e) {
                // If not JSON, treat as plain userId
                userId = qrData;
                permitId = additionalData?.permitId;
                userName = additionalData?.userName;
            }
        } else if (typeof qrData === 'object' && qrData !== null) {
            userId = qrData.userId || qrData.id;
            permitId = qrData.permitId || qrData.permit || qrData.permitId;
            userName = qrData.userName || qrData.name;
        }
        
        // Also check additionalData for missing fields
        userId = userId || additionalData?.userId;
        permitId = permitId || additionalData?.permitId;
        userName = userName || additionalData?.userName;
        
        console.log('📋 Extracted data:', { userId, permitId, userName });
        
        return { userId, permitId, userName };
        
    } catch (error) {
        console.error('❌ Error extracting QR data:', error);
        return { userId: null, permitId: null, userName: null };
    }
}

// QR Code verification and entry - SIMPLIFIED VERSION
exports.verifyQRAndAddEntry = async (req, res) => {
    try {
        console.log('🔍 QR Code entry verification started...');
        console.log('📥 Request body:', req.body);
        
        // Extract user data from request
        const { qrData, additionalData, userId, permitId, userName } = req.body;
        
        let userData;
        
        // Direct data provided (preferred method)
        if (userId && permitId && userName) {
            userData = { userId, permitId, userName };
            console.log('📋 Using direct data:', userData);
        } 
        // Extract from QR data
        else if (qrData) {
            userData = extractUserDataFromQR(qrData, additionalData);
        } 
        // No valid data
        else {
            console.log('❌ No valid user data provided');
            return res.status(400).json({
                success: false,
                message: 'No valid user data provided. Please provide userId, permitId, and userName.',
                expectedFormats: [
                    'Direct: { "userId": "...", "permitId": "...", "userName": "..." }',
                    'QR JSON: { "qrData": "{\\"userId\\":\\"...\\", \\"permitId\\":\\"...\\", \\"userName\\":\\"...\\"}" }',
                    'QR Object: { "qrData": { "userId": "...", "permitId": "...", "userName": "..." } }'
                ]
            });
        }
        
        // Validate extracted data
        if (!userData.userId || !userData.permitId || !userData.userName) {
            console.log('❌ Incomplete user data:', userData);
            return res.status(400).json({
                success: false,
                message: 'Incomplete user data. Missing required fields.',
                required: ['userId', 'permitId', 'userName'],
                received: userData
            });
        }
        
        // Verify QR code (optional - customize based on your needs)
        const verification = await verifyQRCode(userData);
        if (!verification.valid) {
            console.log('❌ QR verification failed:', verification.reason);
            return res.status(401).json({
                success: false,
                message: 'QR code verification failed',
                reason: verification.reason
            });
        }
        
        console.log('✅ QR code verified successfully');
        console.log('💾 Saving entry to database...');
        
        // Use the model's saveVerifiedUserEntry method
        const parkingSlot = await ParkingSlot.saveVerifiedUserEntry(userData);
        
        // Get updated counts after successful entry
        const counts = parkingSlot.getCounts();
        
        console.log('🎉 Entry saved successfully!');
        console.log('📊 Updated parking status:', counts);
        console.log('📊 Available slots decreased from', parkingSlot.totalSlots, 'to', counts.availableSlots);
        
        // Success response with correct counts
        res.status(200).json({
            success: true,
            message: `QR code verified and entry recorded for ${userData.userName}`,
            data: {
                userInfo: {
                    userId: userData.userId,
                    permitId: userData.permitId,
                    userName: userData.userName,
                    entryTime: new Date(),
                    status: 'entered'
                },
                parkingStatus: {
                    totalSlots: counts.totalSlots,
                    occupiedSlots: counts.occupiedSlots,
                    availableSlots: counts.availableSlots,
                    currentlyInside: counts.currentlyInside,
                    totalEntriesToday: counts.totalEntriesToday,
                    exitedToday: counts.exitedToday
                },
                databaseInfo: {
                    documentId: parkingSlot._id,
                    totalEntriesInDB: parkingSlot.verifiedEntries.length
                }
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ QR entry verification failed:', error.message);
        console.error('📋 Full error:', error);
        
        // Handle specific errors
        if (error.message === 'User has already entered today') {
            return res.status(409).json({
                success: false,
                message: 'You have already entered the parking area today',
                errorCode: 'DUPLICATE_ENTRY'
            });
        }
        
        if (error.message.includes('Missing required user data')) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user data provided',
                errorCode: 'INVALID_DATA'
            });
        }
        
        // Generic error response
        res.status(500).json({
            success: false,
            message: 'QR code verification and entry recording failed',
            errorCode: 'INTERNAL_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// QR Code exit verification - SIMPLIFIED VERSION
exports.verifyQRAndMarkExit = async (req, res) => {
    try {
        console.log('🚪 QR Code exit verification started...');
        console.log('📥 Request body:', req.body);
        
        // Extract userId from request
        const { qrData, userId } = req.body;
        
        let userIdToExit;
        
        // Direct userId provided
        if (userId) {
            userIdToExit = userId;
        }
        // Extract from QR data
        else if (qrData) {
            const extracted = extractUserDataFromQR(qrData);
            userIdToExit = extracted.userId;
        }
        
        if (!userIdToExit) {
            return res.status(400).json({
                success: false,
                message: 'No valid userId provided for exit'
            });
        }
        
        console.log('🔍 Processing exit for user:', userIdToExit);
        
        // Get today's parking data
        const parkingSlot = await ParkingSlot.getTodaysParkingData();
        
        // Use the model's markExit method
        await parkingSlot.markExit(userIdToExit);
        
        // Get updated counts
        const counts = parkingSlot.getCounts();
        
        console.log('✅ Exit recorded successfully');
        console.log('📊 Updated parking status:', counts);
        
        res.status(200).json({
            success: true,
            message: 'Exit recorded successfully',
            data: {
                userId: userIdToExit,
                exitTime: new Date(),
                parkingStatus: counts
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Exit verification error:', error.message);
        
        if (error.message === 'No active entry found for this user') {
            return res.status(404).json({
                success: false,
                message: 'No active parking entry found for this user today',
                errorCode: 'NO_ACTIVE_ENTRY'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Exit verification failed',
            errorCode: 'INTERNAL_ERROR',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get parking status
exports.getParkingStatus = async (req, res) => {
    try {
        console.log('📊 Getting parking status...');
        
        const parkingSlot = await ParkingSlot.getTodaysParkingData();
        const counts = parkingSlot.getCounts();
        
        console.log('📈 Parking status:', counts);
        
        res.status(200).json({
            success: true,
            message: 'Parking status retrieved successfully',
            data: {
                date: parkingSlot.date,
                ...counts,
                lastUpdated: parkingSlot.updatedAt,
                entries: parkingSlot.verifiedEntries.map(entry => ({
                    userId: entry.userId,
                    permitId: entry.permitId,
                    userName: entry.userName,
                    entryTime: entry.entryTime,
                    status: entry.status
                }))
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Error fetching parking status:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching parking status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get today's entries
exports.getTodayEntries = async (req, res) => {
    try {
        console.log('📋 Getting today\'s entries...');
        
        const parkingSlot = await ParkingSlot.getTodaysParkingData();
        const counts = parkingSlot.getCounts();
        
        // Sort entries by entry time (most recent first)
        const sortedEntries = parkingSlot.verifiedEntries.sort((a, b) => 
            new Date(b.entryTime) - new Date(a.entryTime)
        );
        
        res.status(200).json({
            success: true,
            message: 'Today\'s entries retrieved successfully',
            data: {
                date: parkingSlot.date,
                ...counts,
                entries: sortedEntries.map(entry => ({
                    userId: entry.userId,
                    permitId: entry.permitId,
                    userName: entry.userName,
                    entryTime: entry.entryTime,
                    status: entry.status
                }))
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Error fetching entries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching entries',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Legacy endpoints (backward compatibility)
exports.addEntry = async (req, res) => {
    console.log('🔄 Legacy addEntry called, redirecting...');
    return exports.verifyQRAndAddEntry(req, res);
};

exports.markExit = async (req, res) => {
    console.log('🔄 Legacy markExit called, redirecting...');
    return exports.verifyQRAndMarkExit(req, res);
};

// Add sample data for testing
exports.addSampleData = async (req, res) => {
    try {
        console.log('🧪 Adding sample data...');
        
        const sampleUsers = [
            { userId: 'user001', permitId: 'P001', userName: 'John Doe' },
            { userId: 'user002', permitId: 'P002', userName: 'Jane Smith' },
            { userId: 'user003', permitId: 'P003', userName: 'Bob Wilson' }
        ];
        
        const results = [];
        
        for (const userData of sampleUsers) {
            try {
                console.log('➕ Adding sample user:', userData.userName);
                const parkingSlot = await ParkingSlot.saveVerifiedUserEntry(userData);
                results.push({
                    success: true,
                    userData,
                    message: 'Added successfully'
                });
            } catch (error) {
                console.log('❌ Error adding sample user:', userData.userName, error.message);
                results.push({
                    success: false,
                    userData,
                    message: error.message
                });
            }
        }
        
        // Get final status
        const parkingSlot = await ParkingSlot.getTodaysParkingData();
        const counts = parkingSlot.getCounts();
        
        console.log('✅ Sample data processing complete');
        
        res.status(200).json({
            success: true,
            message: 'Sample data processing completed',
            data: {
                results,
                finalStatus: counts
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Error adding sample data:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding sample data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};