// models/ParkingSlot.js - CORRECTED VERSION
const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: () => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            return today;
        }
    },
    totalSlots: {
        type: Number,
        required: true,
        default: 100
    },
    occupiedSlots: {
        type: Number,
        required: true,
        default: 0
    },
    verifiedEntries: [{
        userId: {
            type: String,
            required: true
        },
        permitId: {
            type: String,
            required: true
        },
        entryTime: {
            type: Date,
            default: Date.now
        },
        userName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['entered', 'exited'],
            default: 'entered'
        }
    }]
}, {
    timestamps: true
});

// Create compound index for better performance
parkingSlotSchema.index({ date: 1 });
parkingSlotSchema.index({ 'verifiedEntries.userId': 1, 'verifiedEntries.status': 1 });

// FIXED: Bulletproof method with proper error handling and session management
parkingSlotSchema.statics.saveVerifiedUserEntry = async function(userData) {
    const session = await mongoose.startSession();
    
    try {
        console.log('🔥 BULLETPROOF saveVerifiedUserEntry started');
        console.log('📊 Input userData:', JSON.stringify(userData, null, 2));
        
        // Validate input more strictly
        if (!userData || typeof userData !== 'object') {
            throw new Error('Invalid userData: must be an object');
        }
        
        if (!userData.userId || typeof userData.userId !== 'string') {
            throw new Error('Missing or invalid userId');
        }
        
        if (!userData.permitId || typeof userData.permitId !== 'string') {
            throw new Error('Missing or invalid permitId');
        }
        
        if (!userData.userName || typeof userData.userName !== 'string') {
            throw new Error('Missing or invalid userName');
        }

        // Get today's date range in UTC
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
        
        console.log('📅 Date range:', { 
            today: todayUTC.toISOString(), 
            tomorrow: tomorrowUTC.toISOString() 
        });

        // Start transaction
        session.startTransaction();

        // Create new entry object
        const newEntry = {
            userId: userData.userId.toString().trim(),
            permitId: userData.permitId.toString().trim(),
            userName: userData.userName.toString().trim(),
            entryTime: new Date(),
            status: 'entered'
        };
        
        console.log('📝 New entry object:', JSON.stringify(newEntry, null, 2));
        
        // FIXED: Check for existing document first
        let slot = await this.findOne({
            date: { $gte: todayUTC, $lt: tomorrowUTC }
        }).session(session);

        // If no document exists, create one
        if (!slot) {
            console.log('📝 Creating new parking slot document for today...');
            slot = new this({
                date: todayUTC,
                totalSlots: 100,
                occupiedSlots: 0,
                verifiedEntries: []
            });
            await slot.save({ session });
            console.log('✅ New document created with ID:', slot._id);
        }

        // FIXED: Check for duplicate entry more carefully
        const existingEntryIndex = slot.verifiedEntries.findIndex(
            entry => entry.userId === newEntry.userId && entry.status === 'entered'
        );

        if (existingEntryIndex !== -1) {
            await session.abortTransaction();
            console.log('⚠️ Duplicate entry found, user already entered');
            throw new Error('User has already entered today');
        }

        // Check if parking is full
        const currentOccupied = slot.verifiedEntries.filter(entry => entry.status === 'entered').length;
        if (currentOccupied >= slot.totalSlots) {
            await session.abortTransaction();
            throw new Error('Parking is full. No available slots.');
        }

        // FIXED: Add entry and update counts
        slot.verifiedEntries.push(newEntry);
        slot.occupiedSlots = slot.verifiedEntries.filter(entry => entry.status === 'entered').length;
        
        // Mark the array as modified to ensure Mongoose saves it
        slot.markModified('verifiedEntries');

        // Save the document
        const savedSlot = await slot.save({ session });
        
        // Commit transaction
        await session.commitTransaction();
        
        console.log('✅ TRANSACTION COMMITTED - Entry saved successfully');
        console.log('📊 Final occupied slots:', savedSlot.occupiedSlots);
        console.log('📊 Final entries count:', savedSlot.verifiedEntries.length);
        
        // Verify the entry was actually saved
        const savedEntry = savedSlot.verifiedEntries.find(entry => 
            entry.userId === newEntry.userId && 
            entry.status === 'entered'
        );
        
        if (!savedEntry) {
            throw new Error('CRITICAL: Entry not found after save verification!');
        }
        
        console.log('✅ Entry verification passed - Data successfully persisted');
        return savedSlot;
        
    } catch (error) {
        // Rollback transaction on error
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        
        console.error('❌ CRITICAL ERROR in saveVerifiedUserEntry:', error.message);
        console.error('📋 Error stack:', error.stack);
        throw error;
    } finally {
        // Always end the session
        await session.endSession();
    }
};

// FIXED: Enhanced getTodaysParkingData method
parkingSlotSchema.statics.getTodaysParkingData = async function() {
    try {
        console.log('📊 getTodaysParkingData called');
        
        const now = new Date();
        const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
        const tomorrowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));

        let slot = await this.findOne({
            date: { $gte: todayUTC, $lt: tomorrowUTC }
        });

        if (!slot) {
            console.log('📝 No document found, creating new one...');
            slot = new this({
                date: todayUTC,
                totalSlots: 100,
                occupiedSlots: 0,
                verifiedEntries: []
            });
            await slot.save();
            console.log('✅ New document created');
        } else {
            // FIXED: Recalculate occupied slots to ensure consistency
            const currentlyInside = slot.verifiedEntries.filter(entry => entry.status === 'entered').length;
            if (slot.occupiedSlots !== currentlyInside) {
                console.log(`🔧 Fixing occupiedSlots mismatch: ${slot.occupiedSlots} -> ${currentlyInside}`);
                slot.occupiedSlots = currentlyInside;
                await slot.save();
            }
        }
        
        console.log('📊 Document found/created:', {
            id: slot._id,
            date: slot.date,
            entriesCount: slot.verifiedEntries.length,
            occupiedSlots: slot.occupiedSlots
        });

        return slot;
    } catch (error) {
        console.error('❌ Error in getTodaysParkingData:', error);
        throw error;
    }
};

// FIXED: Enhanced markExit method with transaction
parkingSlotSchema.methods.markExit = async function(userId) {
    const session = await mongoose.startSession();
    
    try {
        console.log('🚪 markExit called for userId:', userId);
        
        session.startTransaction();

        const entryIndex = this.verifiedEntries.findIndex(
            entry => entry.userId === userId && entry.status === 'entered'
        );

        if (entryIndex === -1) {
            await session.abortTransaction();
            console.log('❌ No active entry found for user:', userId);
            throw new Error('No active entry found for this user');
        }

        // Mark as exited
        this.verifiedEntries[entryIndex].status = 'exited';
        this.occupiedSlots = Math.max(0, this.occupiedSlots - 1);
        this.markModified('verifiedEntries');

        await this.save({ session });
        await session.commitTransaction();
        
        console.log('✅ Exit marked successfully');
        console.log('📊 Updated occupied slots:', this.occupiedSlots);

        return this;
    } catch (error) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        console.error('❌ Error in markExit:', error);
        throw error;
    } finally {
        await session.endSession();
    }
};

// FIXED: Enhanced getCounts method
parkingSlotSchema.methods.getCounts = function() {
    const currentlyInside = this.verifiedEntries.filter(entry => entry.status === 'entered').length;
    const exitedToday = this.verifiedEntries.filter(entry => entry.status === 'exited').length;

    // Ensure occupiedSlots matches currentlyInside
    this.occupiedSlots = currentlyInside;

    const counts = {
        totalSlots: this.totalSlots,
        occupiedSlots: currentlyInside,
        availableSlots: Math.max(0, this.totalSlots - currentlyInside),
        totalEntriesToday: this.verifiedEntries.length,
        currentlyInside: currentlyInside,
        exitedToday: exitedToday,
        verifiedUserCount: currentlyInside,
        lastUpdated: new Date()
    };
    
    console.log('📊 Current counts:', counts);
    return counts;
};

// FIXED: Test method with better error handling
parkingSlotSchema.statics.testDatabaseSave = async function() {
    try {
        console.log('🧪 Testing database save operations...');
        
        const testData = {
            userId: 'test-save-' + Date.now(),
            permitId: 'TEST-001',
            userName: 'Test Save User'
        };
        
        console.log('🧪 Test data:', testData);
        
        const result = await this.saveVerifiedUserEntry(testData);
        
        // Verify the save by querying the database
        const verification = await this.getTodaysParkingData();
        const savedEntry = verification.verifiedEntries.find(
            entry => entry.userId === testData.userId
        );
        
        if (!savedEntry) {
            throw new Error('Test entry not found in database after save');
        }
        
        console.log('🧪 Test result: SUCCESS');
        
        return {
            success: true,
            testData,
            result: {
                documentId: result._id,
                entriesCount: result.verifiedEntries.length,
                occupiedSlots: result.occupiedSlots,
                verified: !!savedEntry
            }
        };
        
    } catch (error) {
        console.error('🧪 Test failed:', error.message);
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
};

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);