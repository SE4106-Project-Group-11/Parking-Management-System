// parkingController.js - CORRECTED VERSION

const ParkingSlot = require('../models/ParkingSlot');

// FIXED: Enhanced QR verification with bulletproof save
exports.verifyQRAndAddEntryBulletproof = async (req, res) => {
    try {
        console.log('\n🔥 BULLETPROOF QR Code Entry Verification Started');
        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
        console.log('📥 Request headers:', JSON.stringify(req.headers, null, 2));

        const { qrData, additionalData, userId, permitId, userName } = req.body;
        let userData;

        // FIXED: Better data extraction with validation
        if (userId && permitId && userName) {
            userData = { 
                userId: userId.toString().trim(), 
                permitId: permitId.toString().trim(), 
                userName: userName.toString().trim() 
            };
            console.log('📋 Using direct data:', userData);
        } else if (qrData) {
            userData = extractUserDataFromQR(qrData, additionalData);
            console.log('📋 Extracted from QR:', userData);
        } else {
            console.log('❌ No valid user data provided in request');
            return res.status(400).json({
                success: false,
                message: 'No valid user data provided. Please provide either (userId, permitId, userName) or qrData.',
                required: {
                    option1: ['userId', 'permitId', 'userName'],
                    option2: ['qrData']
                },
                received: Object.keys(req.body)
            });
        }

        // FIXED: More thorough validation
        if (!userData || !userData.userId || !userData.permitId || !userData.userName) {
            console.log('❌ Incomplete user data after extraction');
            return res.status(400).json({
                success: false,
                message: 'Incomplete user data extracted',
                required: ['userId', 'permitId', 'userName'],
                received: userData,
                troubleshooting: {
                    qrData: qrData ? 'provided' : 'missing',
                    directData: { userId: !!userId, permitId: !!permitId, userName: !!userName }
                }
            });
        }

        // FIXED: Enhanced QR verification
        console.log('🔐 Starting QR verification...');
        const verification = await verifyQRCode(userData);
        if (!verification.valid) {
            console.log('❌ QR verification failed:', verification.reason);
            return res.status(401).json({
                success: false,
                message: 'QR code verification failed',
                reason: verification.reason,
                userData: userData
            });
        }

        console.log('✅ QR verification passed, attempting bulletproof save...');

        // FIXED: Use the bulletproof save method with better error handling
        try {
            const savedSlot = await ParkingSlot.saveVerifiedUserEntry(userData);
            const counts = savedSlot.getCounts();

            // FIXED: Better verification of the saved entry
            const savedEntry = savedSlot.verifiedEntries.find(
                entry => entry.userId === userData.userId && entry.status === 'entered'
            );

            if (!savedEntry) {
                throw new Error('CRITICAL: Entry verification failed after save - entry not found in database');
            }

            console.log('🎉 BULLETPROOF SAVE SUCCESSFUL!');
            console.log('📊 Final counts:', counts);
            console.log('📋 Saved entry:', {
                userId: savedEntry.userId,
                permitId: savedEntry.permitId,
                userName: savedEntry.userName,
                entryTime: savedEntry.entryTime,
                status: savedEntry.status
            });

            // FIXED: More comprehensive response
            return res.status(200).json({
                success: true,
                message: `QR verified and entry saved successfully for ${userData.userName}`,
                data: {
                    userInfo: {
                        userId: userData.userId,
                        permitId: userData.permitId,
                        userName: userData.userName,
                        entryTime: savedEntry.entryTime,
                        status: savedEntry.status
                    },
                    parkingStatus: counts,
                    databaseInfo: {
                        documentId: savedSlot._id,
                        documentDate: savedSlot.date,
                        totalEntriesInDB: savedSlot.verifiedEntries.length,
                        saveMethod: 'bulletproof-transaction',
                        verified: true,
                        entryId: savedEntry._id
                    }
                },
                timestamp: new Date()
            });

        } catch (saveError) {
            console.error('❌ Save operation failed:', saveError.message);
            
            // FIXED: Better error categorization
            if (saveError.message.includes('already entered')) {
                return res.status(409).json({
                    success: false,
                    message: 'You have already entered the parking area today',
                    errorCode: 'DUPLICATE_ENTRY',
                    userData: userData
                });
            }

            if (saveError.message.includes('Parking is full')) {
                return res.status(403).json({
                    success: false,
                    message: 'Parking is full. No available slots.',
                    errorCode: 'PARKING_FULL',
                    userData: userData
                });
            }

            // Database connection issues
            if (saveError.message.includes('connection') || saveError.message.includes('timeout')) {
                return res.status(503).json({
                    success: false,
                    message: 'Database connection error. Please try again.',
                    errorCode: 'DATABASE_CONNECTION_ERROR'
                });
            }

            // Generic save error
            throw saveError;
        }

    } catch (error) {
        console.error('❌ BULLETPROOF QR entry failed:', error.message);
        console.error('📋 Error stack:', error.stack);

        return res.status(500).json({
            success: false,
            message: 'QR verification and entry failed due to system error',
            errorCode: 'SYSTEM_ERROR',
            error: process.env.NODE_ENV === 'development' ? {
                message: error.message,
                stack: error.stack
            } : 'Internal server error',
            timestamp: new Date()
        });
    }
};

// FIXED: Test database save functionality
exports.testDatabaseSave = async (req, res) => {
    try {
        console.log('🧪 Testing database save functionality...');
        
        // Test the model's test method
        const testResult = await ParkingSlot.testDatabaseSave();
        
        // Also get current status
        const currentStatus = await ParkingSlot.getTodaysParkingData();
        const counts = currentStatus.getCounts();
        
        return res.status(200).json({
            success: true,
            message: 'Database save test completed',
            testResult,
            currentStatus: {
                documentId: currentStatus._id,
                documentDate: currentStatus.date,
                ...counts,
                allEntries: currentStatus.verifiedEntries.map(entry => ({
                    id: entry._id,
                    userId: entry.userId,
                    userName: entry.userName,
                    permitId: entry.permitId,
                    status: entry.status,
                    entryTime: entry.entryTime
                }))
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Database save test failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Database save test failed',
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};

// FIXED: Manual entry for testing
exports.manualTestEntry = async (req, res) => {
    try {
        console.log('🔧 Manual test entry started...');
        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));
        
        const { userId, permitId, userName } = req.body;
        
        // FIXED: Better default test data generation
        const timestamp = Date.now();
        const testData = {
            userId: userId || `manual-test-${timestamp}`,
            permitId: permitId || `MANUAL-${timestamp}`,
            userName: userName || `Manual Test User ${timestamp}`
        };
        
        console.log('📝 Manual test data:', testData);
        
        // Validate test data
        if (!testData.userId || !testData.permitId || !testData.userName) {
            return res.status(400).json({
                success: false,
                message: 'Invalid test data generated',
                testData
            });
        }
        
        // Try to save the entry
        const savedSlot = await ParkingSlot.saveVerifiedUserEntry(testData);
        const counts = savedSlot.getCounts();
        
        // Verify the entry was saved
        const savedEntry = savedSlot.verifiedEntries.find(
            entry => entry.userId === testData.userId
        );
        
        console.log('✅ Manual entry successful!');
        
        return res.status(200).json({
            success: true,
            message: 'Manual test entry successful',
            data: {
                testData,
                savedEntry: savedEntry ? {
                    id: savedEntry._id,
                    userId: savedEntry.userId,
                    permitId: savedEntry.permitId,
                    userName: savedEntry.userName,
                    entryTime: savedEntry.entryTime,
                    status: savedEntry.status
                } : null,
                parkingStatus: counts,
                databaseInfo: {
                    documentId: savedSlot._id,
                    documentDate: savedSlot.date,
                    totalEntriesInDB: savedSlot.verifiedEntries.length,
                    verified: !!savedEntry
                }
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Manual test entry failed:', error);
        
        if (error.message.includes('already entered')) {
            return res.status(409).json({
                success: false,
                message: 'User has already entered today',
                errorCode: 'DUPLICATE_ENTRY'
            });
        }
        
        return res.status(500).json({
            success: false,
            message: 'Manual test entry failed',
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};

// FIXED: Clear all entries for today
exports.clearTodayEntries = async (req, res) => {
    try {
        console.log('🗑️ Clearing today\'s entries...');
        
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
        
        // FIXED: Better clear operation with validation
        const result = await ParkingSlot.findOneAndUpdate(
            { date: { $gte: todayUTC, $lt: tomorrowUTC } },
            {
                $set: {
                    occupiedSlots: 0,
                    verifiedEntries: []
                }
            },
            { new: true, runValidators: true }
        );
        
        if (!result) {
            console.log('📝 No document found for today, creating new one...');
            const newSlot = new ParkingSlot({
                date: todayUTC,
                totalSlots: 100,
                occupiedSlots: 0,
                verifiedEntries: []
            });
            const savedSlot = await newSlot.save();
            
            return res.status(200).json({
                success: true,
                message: 'No existing document found. Created new clean document for today.',
                data: {
                    documentId: savedSlot._id,
                    date: savedSlot.date,
                    occupiedSlots: savedSlot.occupiedSlots,
                    entriesCount: savedSlot.verifiedEntries.length,
                    action: 'created'
                },
                timestamp: new Date()
            });
        }
        
        console.log('✅ Today\'s entries cleared');
        
        return res.status(200).json({
            success: true,
            message: 'Today\'s entries cleared successfully',
            data: {
                documentId: result._id,
                date: result.date,
                occupiedSlots: result.occupiedSlots,
                entriesCount: result.verifiedEntries.length,
                action: 'cleared'
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Clear entries failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Clear entries failed',
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};

// FIXED: Get parking status
exports.getParkingStatus = async (req, res) => {
    try {
        console.log('📊 Getting parking status...');
        
        const parkingData = await ParkingSlot.getTodaysParkingData();
        const counts = parkingData.getCounts();
        
        return res.status(200).json({
            success: true,
            message: 'Parking status retrieved successfully',
            data: {
                ...counts,
                documentId: parkingData._id,
                documentDate: parkingData.date,
                entries: parkingData.verifiedEntries.map(entry => ({
                    id: entry._id,
                    userId: entry.userId,
                    userName: entry.userName,
                    permitId: entry.permitId,
                    status: entry.status,
                    entryTime: entry.entryTime
                }))
            },
            timestamp: new Date()
        });
        
    } catch (error) {
        console.error('❌ Get parking status failed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get parking status',
            error: {
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }
        });
    }
};

// FIXED: Enhanced QR exit verification
exports.verifyQRAndExit = async (req, res) => {
    try {
        console.log('\n🚪 QR Code Exit Verification Started');
        console.log('📥 Request body:', JSON.stringify(req.body, null, 2));

        const { qrData, additionalData, userId, permitId, userName } = req.body;
        let userData;

        // Extract user data (same as entry)
        if (userId && permitId && userName) {
            userData = { 
                userId: userId.toString().trim(), 
                permitId: permitId.toString().trim(), 
                userName: userName.toString().trim() 
            };
        } else if (qrData) {
            userData = extractUserDataFromQR(qrData, additionalData);
        } else {
            return res.status(400).json({
                success: false,
                message: 'No valid user data provided for exit'
            });
        }

        // Validate extracted data
        if (!userData || !userData.userId || !userData.permitId || !userData.userName) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete user data for exit',
                required: ['userId', 'permitId', 'userName'],
                received: userData
            });
        }

        // Verify QR code
        const verification = await verifyQRCode(userData);
        if (!verification.valid) {
            return res.status(401).json({
                success: false,
                message: 'QR code verification failed for exit',
                reason: verification.reason
            });
        }

        // Get today's parking data and mark exit
        const parkingData = await ParkingSlot.getTodaysParkingData();
        const updatedSlot = await parkingData.markExit(userData.userId);
        const counts = updatedSlot.getCounts();

        console.log('✅ Exit processed successfully');

        return res.status(200).json({
            success: true,
            message: `Exit processed successfully for ${userData.userName}`,
            data: {
                userInfo: {
                    userId: userData.userId,
                    permitId: userData.permitId,
                    userName: userData.userName,
                    exitTime: new Date()
                },
                parkingStatus: counts,
                databaseInfo: {
                    documentId: updatedSlot._id,
                    totalEntriesInDB: updatedSlot.verifiedEntries.length
                }
            },
            timestamp: new Date()
        });

    } catch (error) {
        console.error('❌ QR exit verification failed:', error);

        if (error.message.includes('No active entry found')) {
            return res.status(404).json({
                success: false,
                message: 'No active entry found for this user',
                errorCode: 'NO_ACTIVE_ENTRY'
            });
        }

        return res.status(500).json({
            success: false,
            message: 'QR exit verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// FIXED: Helper function to extract user data from QR
function extractUserDataFromQR(qrData, additionalData = {}) {
    let userId, permitId, userName;

    try {
        console.log('📋 Extracting data from QR:', typeof qrData, qrData);
        
        if (typeof qrData === 'string') {
            // Try to parse as JSON first
            try {
                const parsed = JSON.parse(qrData);
                userId = parsed.userId || parsed.id || parsed.user_id;
                permitId = parsed.permitId || parsed.permit || parsed.permit_id;
                userName = parsed.userName || parsed.name || parsed.user_name || parsed.fullName;
                console.log('   Parsed as JSON:', { userId, permitId, userName });
            } catch (jsonError) {
                console.log('   Not JSON, treating as plain string');
                // If not JSON, check if it's a simple userId
                if (qrData.trim().length > 0) {
                    userId = qrData.trim();
                    permitId = additionalData?.permitId;
                    userName = additionalData?.userName;
                }
            }
        } else if (typeof qrData === 'object' && qrData !== null) {
            userId = qrData.userId || qrData.id || qrData.user_id;
            permitId = qrData.permitId || qrData.permit || qrData.permit_id;
            userName = qrData.userName || qrData.name || qrData.user_name || qrData.fullName;
            console.log('   Treated as object:', { userId, permitId, userName });
        }

        // Fill missing data from additionalData
        if (!userId && additionalData?.userId) userId = additionalData.userId;
        if (!permitId && additionalData?.permitId) permitId = additionalData.permitId;
        if (!userName && additionalData?.userName) userName = additionalData.userName;

        // Clean up the extracted data
        if (userId) userId = userId.toString().trim();
        if (permitId) permitId = permitId.toString().trim();
        if (userName) userName = userName.toString().trim();

        console.log('📋 Final extraction result:', { userId, permitId, userName });
        return { userId, permitId, userName };

    } catch (error) {
        console.error('❌ Error extracting QR data:', error);
        return { userId: null, permitId: null, userName: null };
    }
}

// FIXED: Enhanced QR verification function
async function verifyQRCode({ userId, permitId, userName }) {
    try {
        console.log('🔐 Verifying QR code data:', { userId, permitId, userName });
        
        // Check for required fields
        if (!userId || !permitId || !userName) {
            return { 
                valid: false, 
                reason: 'Missing required fields',
                details: { 
                    hasUserId: !!userId, 
                    hasPermitId: !!permitId, 
                    hasUserName: !!userName 
                }
            };
        }
        
        // Validate userId format
        if (typeof userId !== 'string' || userId.length < 3) {
            return { 
                valid: false, 
                reason: 'Invalid userId format - must be string with at least 3 characters',
                received: { type: typeof userId, length: userId?.length, value: userId }
            };
        }
        
        // Validate permitId format (more flexible)
        if (typeof permitId !== 'string' || permitId.length < 3) {
            return { 
                valid: false, 
                reason: 'Invalid permitId format - must be string with at least 3 characters',
                received: { type: typeof permitId, length: permitId?.length, value: permitId }
            };
        }
        
        // Validate userName format
        if (typeof userName !== 'string' || userName.length < 2) {
            return { 
                valid: false, 
                reason: 'Invalid userName format - must be string with at least 2 characters',
                received: { type: typeof userName, length: userName?.length, value: userName }
            };
        }
        
        // Additional validation rules (customize as needed)
        if (userId.includes(' ') || userId.includes('\n') || userId.includes('\t')) {
            return { 
                valid: false, 
                reason: 'UserId contains invalid characters (spaces or whitespace)' 
            };
        }
        
        // Check for common test patterns that should be allowed
        const isTestData = userId.startsWith('test-') || 
                          userId.startsWith('manual-') || 
                          permitId.startsWith('TEST-') || 
                          permitId.startsWith('MANUAL-');
        
        console.log('✅ QR verification passed', isTestData ? '(test data)' : '(production data)');
        return { 
            valid: true, 
            isTestData,
            validatedData: { userId, permitId, userName }
        };
        
    } catch (error) {
        console.error('❌ QR verification error:', error);
        return { 
            valid: false, 
            reason: 'Verification system error',
            error: error.message 
        };
    }
}

module.exports = {
    verifyQRAndAddEntryBulletproof: exports.verifyQRAndAddEntryBulletproof,
    testDatabaseSave: exports.testDatabaseSave,
    manualTestEntry: exports.manualTestEntry,
    clearTodayEntries: exports.clearTodayEntries,
    getParkingStatus: exports.getParkingStatus,
    verifyQRAndExit: exports.verifyQRAndExit
};